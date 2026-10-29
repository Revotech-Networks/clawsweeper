import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  parseReviewReport,
  reportOnlyDecision,
} from "../../dist/repair/issue-implementation-intake.js";
import {
  renderIssueImplementationJob,
  REVIEW_REPRODUCIBLE_BUG_TRIGGER_SOURCE,
  REVIEW_VISION_FIT_TRIGGER_SOURCE,
} from "../../dist/repair/comment-router-core.js";

function report(overrides = {}) {
  const fields = {
    number: "123",
    repository: "openclaw/openclaw",
    type: "issue",
    state_at_review: "open",
    review_status: "complete",
    decision: "keep_open",
    close_reason: "none",
    confidence: "high",
    work_candidate: "queue_fix_pr",
    work_confidence: "high",
    work_validation: JSON.stringify(["pnpm test src/example.test.ts"]),
    work_likely_files: JSON.stringify(["src/example.ts", "src/example.test.ts"]),
    work_cluster_refs: JSON.stringify(["#123"]),
    labels: JSON.stringify(["bug"]),
    item_category: "bug",
    reproduction_status: "reproduced",
    reproduction_confidence: "high",
    requires_new_feature: "false",
    requires_new_config_option: "false",
    requires_product_decision: "false",
    ...overrides,
  };
  const frontmatter = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  return `---\n${frontmatter}\n---\n\n## Repair Work Prompt\n\nFix the reproduced existing-behavior bug and add a regression test.\n`;
}

for (const candidateKind of ["strict_bug", "vision_fit"]) {
  test(`enabled ${candidateKind} preparation preserves PR search and failure guards`, () => {
    for (const scenario of ["eligible", "duplicate", "search-error"]) {
      const dir = mkdtempSync(join(tmpdir(), "clawsweeper-intake-"));
      try {
        cpSync("dist", join(dir, "dist"), { recursive: true });
        cpSync("config", join(dir, "config"), { recursive: true });
        cpSync("package.json", join(dir, "package.json"));
        const bin = join(dir, "bin");
        mkdirSync(bin);
        const query = 'q=repo:openclaw/openclaw is:pr is:open "123"';
        writeFileSync(
          join(bin, "gh"),
          `#!${process.execPath}
import assert from "node:assert/strict";
const args = process.argv.slice(2);
const endpoint = args[1];
if (args[0] !== "api") throw new Error("unexpected command");
if (endpoint === "search/issues") {
  const methodIndex = args.indexOf("--method");
  const method = methodIndex >= 0 ? args[methodIndex + 1] : args.includes("-f") ? "POST" : "GET";
  if (method !== "GET" || ${JSON.stringify(scenario)} === "search-error") {
    console.error("gh: Not Found (HTTP 404)");
    process.exit(1);
  }
  assert.equal(args[args.indexOf("-f") + 1], ${JSON.stringify(query)});
  assert.equal(args[args.indexOf("--jq") + 1], ".items");
  console.log(JSON.stringify(${scenario === "duplicate" ? '[{number: 456, title: "Existing fix"}]' : "[]"}));
} else if (endpoint === "repos/openclaw/openclaw/issues/123") {
  console.log(JSON.stringify({state: "open", locked: false, title: "Existing bug", body: "Narrow reproduction", labels: []}));
} else if (endpoint === "repos/openclaw/openclaw/issues/123/comments?per_page=100" || endpoint === "repos/openclaw/openclaw/pulls") {
  console.log("[]");
} else {
  throw new Error("unexpected endpoint: " + endpoint);
}
`,
          { mode: 0o755 },
        );
        const reportPath = join(dir, "report.md");
        writeFileSync(
          reportPath,
          report(
            candidateKind === "vision_fit"
              ? {
                  item_category: "feature",
                  reproduction_status: "not_applicable",
                  requires_new_feature: "true",
                  auto_implementation_candidate: "vision_fit",
                  vision_fit: "aligned",
                  vision_fit_evidence: JSON.stringify(["VISION.md supports setup reliability."]),
                  implementation_complexity: "small",
                }
              : {},
          ),
        );
        const result = spawnSync(
          process.execPath,
          [
            join(dir, "dist/repair/issue-implementation-intake.js"),
            "prepare",
            "--enabled",
            "true",
            "--target-repo",
            "openclaw/openclaw",
            "--item-number",
            "123",
            "--candidate-kind",
            candidateKind,
            "--report-file",
            reportPath,
          ],
          {
            cwd: dir,
            env: { PATH: `${bin}:${dirname(process.execPath)}`, HOME: dir },
            encoding: "utf8",
            timeout: 10_000,
          },
        );
        const jobPath = join(dir, "jobs/openclaw/inbox/issue-openclaw-openclaw-123.md");
        const auditPath = join(dir, "results/issue-implementation-intake/openclaw-openclaw/123.md");
        if (scenario === "search-error") {
          assert.notEqual(result.status, 0);
          assert.match(result.stderr, /failed to search open PRs mentioning issue/);
          assert.equal(existsSync(jobPath), false);
          assert.equal(existsSync(auditPath), false);
        } else {
          assert.equal(result.status, 0, result.stderr);
          const output = JSON.parse(result.stdout);
          assert.equal(output.should_repair, scenario === "eligible");
          assert.equal(existsSync(jobPath), scenario === "eligible");
          assert.equal(existsSync(auditPath), true);
          if (scenario === "duplicate") {
            assert.equal(output.blocker_class, "hard");
            assert.match(output.blockers, /open PR already mentions this issue/);
          } else {
            const job = readFileSync(jobPath, "utf8");
            assert.match(job, /repo: openclaw\/openclaw/);
            assert.match(job, /candidates:\n  - #123\n/);
            assert.match(job, /allow_merge: false/);
            assert.match(job, /allow_post_merge_close: false/);
          }
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });
}

test("strict reproducible bug reports are eligible for implementation intake", () => {
  const markdown = report();
  const parsed = parseReviewReport(markdown);
  const decision = reportOnlyDecision({
    targetRepo: "openclaw/openclaw",
    report: parsed,
    reportMarkdown: markdown,
  });

  assert.equal(decision.shouldRepair, true);
  assert.equal(decision.status, "queued_for_repair");
});

test("implementation intake rejects feature and config-option work", () => {
  for (const overrides of [
    { item_category: "feature" },
    { requires_new_feature: "true" },
    { requires_new_config_option: "true" },
    { requires_product_decision: "true" },
    { reproduction_status: "source_reproducible" },
  ]) {
    const markdown = report(overrides);
    const decision = reportOnlyDecision({
      targetRepo: "openclaw/openclaw",
      report: parseReviewReport(markdown),
      reportMarkdown: markdown,
    });

    assert.equal(decision.shouldRepair, false);
  }
});

test("implementation intake override permits soft blockers", () => {
  const markdown = report({
    item_category: "feature",
    requires_new_feature: "true",
    work_validation: JSON.stringify([]),
  });
  const decision = reportOnlyDecision({
    targetRepo: "openclaw/openclaw",
    report: parseReviewReport(markdown),
    reportMarkdown: markdown,
    operatorOverride: true,
  });

  assert.equal(decision.shouldRepair, true);
  assert.equal(decision.status, "override_queued_for_repair");
  assert.equal(decision.blockerClass, "soft");
  assert.equal(decision.operatorOverride, true);
  assert.match(decision.reason, /item category is feature/);
});

test("implementation intake override routes hard blockers to handoff", () => {
  const markdown = report({
    labels: JSON.stringify(["security"]),
  });
  const decision = reportOnlyDecision({
    targetRepo: "openclaw/openclaw",
    report: parseReviewReport(markdown),
    reportMarkdown: markdown,
    operatorOverride: true,
  });

  assert.equal(decision.shouldRepair, true);
  assert.equal(decision.status, "override_handoff");
  assert.equal(decision.blockerClass, "hard");
  assert.equal(decision.operatorOverride, true);
  assert.match(decision.reason, /protected label present/);
});

test("vision-fit reports are eligible for sibling implementation intake", () => {
  const markdown = report({
    item_category: "feature",
    reproduction_status: "not_applicable",
    reproduction_confidence: "low",
    requires_new_feature: "true",
    auto_implementation_candidate: "vision_fit",
    vision_fit: "aligned",
    vision_fit_evidence: JSON.stringify([
      "VISION.md lists setup reliability and first-run UX as current priorities.",
    ]),
    implementation_complexity: "small",
  });
  const decision = reportOnlyDecision({
    targetRepo: "openclaw/openclaw",
    report: parseReviewReport(markdown),
    reportMarkdown: markdown,
    candidateKind: "vision_fit",
  });

  assert.equal(decision.shouldRepair, true);
  assert.equal(decision.status, "queued_for_repair");
});

test("vision-fit intake rejects broad or unaligned issue work", () => {
  for (const overrides of [
    { auto_implementation_candidate: "none" },
    { vision_fit: "rejected" },
    { implementation_complexity: "medium" },
    { requires_product_decision: "true" },
    { vision_fit_evidence: JSON.stringify([]) },
  ]) {
    const markdown = report({
      item_category: "feature",
      reproduction_status: "not_applicable",
      reproduction_confidence: "low",
      requires_new_feature: "true",
      auto_implementation_candidate: "vision_fit",
      vision_fit: "aligned",
      vision_fit_evidence: JSON.stringify(["VISION.md supports this narrow direction."]),
      implementation_complexity: "small",
      ...overrides,
    });
    const decision = reportOnlyDecision({
      targetRepo: "openclaw/openclaw",
      report: parseReviewReport(markdown),
      reportMarkdown: markdown,
      candidateKind: "vision_fit",
    });

    assert.equal(decision.shouldRepair, false);
  }
});

test("review-triggered issue implementation jobs require autogenerated PR labels", () => {
  const job = renderIssueImplementationJob({
    repo: "openclaw/openclaw",
    issueNumber: 123,
    title: "Crash on existing command",
    triggerSource: REVIEW_REPRODUCIBLE_BUG_TRIGGER_SOURCE,
    reviewReportPath: "records/openclaw-openclaw/items/123.md",
    strictBugOnly: true,
  });

  assert.match(job, /trigger_source: review_reproducible_bug/);
  assert.match(job, /required_pr_labels:\n  - clawsweeper:autogenerated/);
  assert.match(job, /Treat it as bug-only/);
  assert.match(job, /new config\s+option/);
});

test("vision-fit issue implementation jobs carry vision guardrails", () => {
  const job = renderIssueImplementationJob({
    repo: "openclaw/openclaw",
    issueNumber: 124,
    title: "Improve first-run setup",
    triggerSource: REVIEW_VISION_FIT_TRIGGER_SOURCE,
    reviewReportPath: "records/openclaw-openclaw/items/124.md",
    visionFit: true,
  });

  assert.match(job, /trigger_source: review_vision_fit/);
  assert.match(job, /vision-fit issue lane/);
  assert.match(job, /target repository VISION\.md/);
  assert.match(job, /clawsweeper:autogenerated/);
});

test("issue implementation PR executor applies autogenerated label", () => {
  const source = readFileSync("src/repair/execute-fix-artifact.ts", "utf8");

  assert.match(source, /AUTOGENERATED_LABEL/);
  assert.match(source, /job\.frontmatter\.source === "issue_implementation"/);
});

test("issue implementation intake checks generated branches through REST", () => {
  const source = readFileSync("src/repair/issue-implementation-intake.ts", "utf8");

  assert.match(source, /repos\/\$\{owner\}\/\$\{name\}\/pulls/);
  assert.match(source, /head=\$\{owner\}:\$\{branch\}/);
  assert.doesNotMatch(source, /"pr", "list"/);
});

test("repair executor uses retryable blobless target checkout", () => {
  const source = readFileSync("src/repair/execute-fix-artifact.ts", "utf8");

  assert.match(source, /cloneTargetCheckout/);
  assert.match(source, /--filter=blob:none/);
  assert.match(source, /CLAWSWEEPER_CHECKOUT_CLONE_ATTEMPTS/);
  assert.match(source, /CLAWSWEEPER_CHECKOUT_CLONE_TIMEOUT_MS/);
});

test("comment router default allows one same-head infrastructure retry", () => {
  const source = readFileSync("src/repair/config.ts", "utf8");

  assert.match(source, /CLAWSWEEPER_MAX_REPAIRS_PER_HEAD \?\? 2/);
});

test("comment router rewrites existing issue implementation jobs on override", () => {
  const source = readFileSync("src/repair/comment-router.ts", "utf8");

  assert.match(source, /command\.operator_override === true/);
  assert.match(source, /fs\.writeFileSync\(\s*absolute,\s*renderIssueImplementationJob/s);
  assert.match(source, /issueImplementationJobOptions\(command\)/);
  assert.match(source, /statusDetail = "written"/);
});

test("comment router classifies protected issue build overrides as hard", () => {
  const source = readFileSync("src/repair/comment-router.ts", "utf8");

  assert.match(source, /issueImplementationOverrideBlockerClass\(command\)/);
  assert.match(source, /target\.kind === "issue" && target\.job_path/);
  assert.match(source, /issueImplementationLinkedPrSignal\(target\)/);
  assert.match(source, /issueLinkedOpenPrReferences\(issue, issueNumber\)/);
  assert.match(source, /open_prs: linkedOpenPrs/);
  assert.match(source, /addPullRequestReferenceNumbersFromText/);
  assert.match(source, /searchOpenPullRequestsMentioningIssue\(Number\(issueNumber\)\)/);
  assert.match(source, /target\.body/);
  assert.match(source, /target\.locked === true/);
  assert.match(source, /labels\.some\(isIssueImplementationProtectedLabel\)/);
  assert.match(source, /overrideBlockerClass,\n\s+overrideAction: command\.operator_override/);
  assert.match(source, /prepare a non-mutating handoff for this issue/);
});
