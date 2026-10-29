import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("issue implementation post-flight waits for green PR checks without merging", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawsweeper-post-flight-"));
  const fakeBin = path.join(tmp, "bin");
  const jobPath = path.join(tmp, "job.md");
  const runDir = path.join(tmp, "run");
  const resultPath = path.join(runDir, "result.json");
  const reportPath = path.join(runDir, "post-flight-report.json");

  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(fakeBin, "gh"),
    [
      "#!/usr/bin/env node",
      "const args = process.argv.slice(2);",
      "if (args[0] === 'api' && args[1] === 'repos/openclaw/openclaw/pulls/123') {",
      "  process.stdout.write(JSON.stringify({",
      "    number: 123,",
      "    state: 'open',",
      "    title: 'fix(ui): preserve source config',",
      "    draft: false,",
      "    labels: [],",
      "    base: { ref: 'main' },",
      "    merged_at: null,",
      "    head: { sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },",
      "  }));",
      "  process.exit(0);",
      "}",
      "if (args[0] === 'pr' && args[1] === 'view') {",
      "  process.stdout.write(JSON.stringify({",
      "    baseRefName: 'main',",
      "    isDraft: false,",
      "    mergeable: 'MERGEABLE',",
      "    mergeStateStatus: 'CLEAN',",
      "    reviewDecision: null,",
      "    state: 'OPEN',",
      "    statusCheckRollup: [",
      "      {",
      "        name: 'Real behavior proof',",
      "        workflowName: 'Real behavior proof',",
      "        startedAt: '2026-05-24T00:39:28Z',",
      "        completedAt: '2026-05-24T00:40:30Z',",
      "        status: 'COMPLETED',",
      "        conclusion: 'CANCELLED',",
      "      },",
      "      {",
      "        name: 'Real behavior proof',",
      "        workflowName: 'Real behavior proof',",
      "        startedAt: '2026-05-24T00:39:44Z',",
      "        completedAt: '2026-05-24T00:39:56Z',",
      "        status: 'COMPLETED',",
      "        conclusion: 'SUCCESS',",
      "      },",
      "    ],",
      "    title: 'fix(ui): preserve source config',",
      "    url: 'https://github.com/openclaw/openclaw/pull/123',",
      "  }));",
      "  process.exit(0);",
      "}",
      "process.stderr.write(`unexpected gh args: ${args.join(' ')}\\n`);",
      "process.exit(1);",
    ].join("\n"),
    { mode: 0o755 },
  );

  fs.writeFileSync(
    jobPath,
    [
      "---",
      "repo: openclaw/openclaw",
      "cluster_id: issue-openclaw-openclaw-85831",
      "mode: autonomous",
      "allowed_actions:",
      "  - comment",
      "  - label",
      "  - fix",
      "  - raise_pr",
      "blocked_actions:",
      "  - close",
      "  - merge",
      "canonical:",
      "  - '#85831'",
      "candidates:",
      "  - '#85831'",
      "cluster_refs:",
      "  - '#85831'",
      "allow_fix_pr: true",
      "allow_merge: false",
      "security_policy: central_security_only",
      "security_sensitive: false",
      "target_branch: clawsweeper/issue-openclaw-openclaw-85831",
      "source: issue_implementation",
      "---",
      "Issue implementation job.",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    resultPath,
    JSON.stringify(
      {
        repo: "openclaw/openclaw",
        cluster_id: "issue-openclaw-openclaw-85831",
        mode: "autonomous",
        actions: [],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(runDir, "fix-execution-report.json"),
    JSON.stringify(
      {
        actions: [
          {
            action: "open_fix_pr",
            status: "opened",
            pr_url: "https://github.com/openclaw/openclaw/pull/123",
            branch: "clawsweeper/issue-openclaw-openclaw-85831",
          },
        ],
      },
      null,
      2,
    ),
  );

  try {
    execFileSync(process.execPath, ["dist/repair/post-flight.js", jobPath, resultPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CLAWSWEEPER_ALLOW_EXECUTE: "1",
        CLAWSWEEPER_ALLOWED_OWNER: "openclaw",
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? ""}`,
      },
      stdio: "pipe",
    });

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert.deepEqual(report.actions, [
      {
        action: "finalize_fix_pr",
        source_action: "open_fix_pr",
        source_status: "opened",
        target: "https://github.com/openclaw/openclaw/pull/123",
        pr: "#123",
        title: "fix(ui): preserve source config",
        status: "ready",
        reason:
          "issue implementation PR checks are green; merge intentionally blocked for this lane",
        mergeable: "MERGEABLE",
        merge_state_status: "CLEAN",
        review_decision: null,
        waited_ms: 0,
      },
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("issue implementation post-flight waits for checks to be created", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawsweeper-post-flight-"));
  const fakeBin = path.join(tmp, "bin");
  const jobPath = path.join(tmp, "job.md");
  const runDir = path.join(tmp, "run");
  const resultPath = path.join(runDir, "result.json");
  const reportPath = path.join(runDir, "post-flight-report.json");
  const viewCountPath = path.join(tmp, "view-count.txt");

  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(fakeBin, "gh"),
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "const args = process.argv.slice(2);",
      "if (args[0] === 'api' && args[1] === 'repos/openclaw/openclaw/pulls/123') {",
      "  process.stdout.write(JSON.stringify({",
      "    number: 123, state: 'open', title: 'fix(ui): preserve source config',",
      "    draft: false, labels: [], base: { ref: 'main' }, merged_at: null,",
      "    head: { sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },",
      "  }));",
      "  process.exit(0);",
      "}",
      "if (args[0] === 'pr' && args[1] === 'view') {",
      "  const path = process.env.FAKE_GH_VIEW_COUNT_FILE;",
      "  const count = fs.existsSync(path) ? Number(fs.readFileSync(path, 'utf8')) : 0;",
      "  fs.writeFileSync(path, String(count + 1));",
      "  const checks = count === 0",
      "    ? [{ name: 'label', workflowName: 'Labeler', startedAt: '2026-05-24T00:39:40Z', status: 'COMPLETED', conclusion: 'SUCCESS' }]",
      "    : [{ name: 'check', startedAt: '2026-05-24T00:39:44Z', status: 'COMPLETED', conclusion: 'SUCCESS' }];",
      "  process.stdout.write(JSON.stringify({",
      "    baseRefName: 'main', isDraft: false, mergeable: 'MERGEABLE',",
      "    mergeStateStatus: 'CLEAN', reviewDecision: null, state: 'OPEN',",
      "    statusCheckRollup: checks, title: 'fix(ui): preserve source config',",
      "    url: 'https://github.com/openclaw/openclaw/pull/123',",
      "  }));",
      "  process.exit(0);",
      "}",
      "process.stderr.write(`unexpected gh args: ${args.join(' ')}\\n`);",
      "process.exit(1);",
    ].join("\n"),
    { mode: 0o755 },
  );

  writeIssueImplementationJob(jobPath);
  writeIssueImplementationReports(runDir, resultPath);

  try {
    execFileSync(process.execPath, ["dist/repair/post-flight.js", jobPath, resultPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CLAWSWEEPER_ALLOW_EXECUTE: "1",
        CLAWSWEEPER_ALLOWED_OWNER: "openclaw",
        CLAWSWEEPER_POST_FLIGHT_WAIT_MS: "10000",
        CLAWSWEEPER_POST_FLIGHT_POLL_MS: "1",
        FAKE_GH_VIEW_COUNT_FILE: viewCountPath,
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? ""}`,
      },
      stdio: "pipe",
    });

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert.equal(report.actions[0]?.status, "ready");
    assert.equal(fs.readFileSync(viewCountPath, "utf8"), "2");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

for (const [scenario, expectedStatus, expectedViews] of [
  ["unchanged", "executed", 2],
  ["contributor", "executed", 2],
  ["mismatch", "blocked", 1],
  ["drift", "blocked", 2],
  ["missing-commit", "blocked", 1],
  ["invalid-commit", "blocked", 1],
  ["missing-head", "blocked", 1],
  ["merge-race", "blocked", 3],
  ["already-merged", "executed", 1],
] as const) {
  test(`merge post-flight preserves reviewed commit: ${scenario}`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawsweeper-post-flight-"));
    const fakeBin = path.join(tmp, "bin");
    const jobPath = path.join(tmp, "job.md");
    const runDir = path.join(tmp, "run");
    const resultPath = path.join(runDir, "result.json");
    const reportPath = path.join(runDir, "post-flight-report.json");
    const mergeFlagPath = path.join(tmp, "merged.txt");
    const viewCountPath = path.join(tmp, "view-count.txt");
    const mergeArgsPath = path.join(tmp, "merge-args.json");

    fs.mkdirSync(fakeBin, { recursive: true });
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(fakeBin, "gh"),
      [
        "#!/usr/bin/env node",
        "const fs = require('node:fs');",
        "const args = process.argv.slice(2);",
        "const scenario = process.env.FAKE_GH_SCENARIO;",
        "if (args[0] === 'api' && args[1] === 'repos/openclaw/openclaw/pulls/123') {",
        "  const merged = scenario === 'already-merged' || fs.existsSync(process.env.FAKE_GH_MERGED_FILE);",
        "  const viewed = fs.existsSync(process.env.FAKE_GH_VIEW_COUNT_FILE);",
        "  const head = scenario === 'missing-head' ? null : (scenario === 'mismatch' || (scenario === 'drift' && viewed)) ? 'b'.repeat(40) : 'a'.repeat(40);",
        "  process.stdout.write(JSON.stringify({",
        "    number: 123, state: merged ? 'closed' : 'open', title: 'fix(ui): preserve source config',",
        "    draft: false, labels: [], base: { ref: 'main' },",
        "    merged_at: merged ? '2026-05-24T00:42:00Z' : null,",
        "    merge_commit_sha: merged ? 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' : null,",
        "    head: { sha: head },",
        "  }));",
        "  process.exit(0);",
        "}",
        "if (args[0] === 'api' && args[1] === 'repos/openclaw/openclaw/issues/123/comments?per_page=100') {",
        "  process.stdout.write('');",
        "  process.exit(0);",
        "}",
        "if (args[0] === 'api' && args[1] === 'graphql') {",
        "  process.stdout.write(JSON.stringify({ data: { repository: { pullRequest: { reviewThreads: { pageInfo: { hasNextPage: false }, nodes: [] } } } } }));",
        "  process.exit(0);",
        "}",
        "if (args[0] === 'pr' && args[1] === 'view') {",
        "  const path = process.env.FAKE_GH_VIEW_COUNT_FILE;",
        "  const count = fs.existsSync(path) ? Number(fs.readFileSync(path, 'utf8')) : 0;",
        "  fs.writeFileSync(path, String(count + 1));",
        "  const checks = count === 0",
        "    ? [{ name: 'label', workflowName: 'Labeler', startedAt: '2026-05-24T00:39:40Z', status: 'COMPLETED', conclusion: 'SUCCESS' }]",
        "    : [{ name: 'check', workflowName: 'CI', startedAt: '2026-05-24T00:39:44Z', status: 'COMPLETED', conclusion: 'SUCCESS' }];",
        "  process.stdout.write(JSON.stringify({",
        "    baseRefName: 'main', isDraft: false, mergeable: 'MERGEABLE',",
        "    mergeStateStatus: 'CLEAN', reviewDecision: null, state: 'OPEN',",
        "    statusCheckRollup: checks, title: 'fix(ui): preserve source config',",
        "    url: 'https://github.com/openclaw/openclaw/pull/123',",
        "  }));",
        "  process.exit(0);",
        "}",
        "if (args[0] === 'pr' && args[1] === 'merge') {",
        "  fs.writeFileSync(process.env.FAKE_GH_MERGE_ARGS_FILE, JSON.stringify(args));",
        "  if (scenario === 'merge-race') { process.stderr.write('head branch was modified'); process.exit(1); }",
        "  fs.writeFileSync(process.env.FAKE_GH_MERGED_FILE, '1');",
        "  process.exit(0);",
        "}",
        "process.stderr.write(`unexpected gh args: ${args.join(' ')}\\n`);",
        "process.exit(1);",
      ].join("\n"),
      { mode: 0o755 },
    );

    writeMergeJob(jobPath);
    writeMergeReports(runDir, resultPath);
    const fixReportPath = path.join(runDir, "fix-execution-report.json");
    const fixReport = JSON.parse(fs.readFileSync(fixReportPath, "utf8"));
    const action = fixReport.actions[0];
    if (scenario === "missing-commit" || scenario === "already-merged") delete action.commit;
    if (scenario === "invalid-commit") action.commit = "aaaaaaa";
    if (scenario === "contributor") {
      action.action = "repair_contributor_branch";
      action.status = "pushed";
    }
    fs.writeFileSync(fixReportPath, JSON.stringify(fixReport));

    try {
      execFileSync(process.execPath, ["dist/repair/post-flight.js", jobPath, resultPath], {
        cwd: repoRoot,
        env: {
          HOME: tmp,
          XDG_CONFIG_HOME: tmp,
          GITHUB_REPOSITORY: "fixture-owner/fixture-runtime",
          CLAWSWEEPER_ALLOW_EXECUTE: "1",
          CLAWSWEEPER_ALLOWED_OWNER: "openclaw",
          CLAWSWEEPER_ALLOW_MERGE: "1",
          CLAWSWEEPER_POST_FLIGHT_REQUIRE_PR_CHECKS: "1",
          CLAWSWEEPER_POST_FLIGHT_WAIT_MS: "10000",
          CLAWSWEEPER_POST_FLIGHT_POLL_MS: "1",
          FAKE_GH_MERGED_FILE: mergeFlagPath,
          FAKE_GH_VIEW_COUNT_FILE: viewCountPath,
          FAKE_GH_MERGE_ARGS_FILE: mergeArgsPath,
          FAKE_GH_SCENARIO: scenario,
          PATH: `${fakeBin}${path.delimiter}${path.dirname(process.execPath)}`,
        },
        stdio: "pipe",
        timeout: 20000,
      });

      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      assert.equal(report.actions[0]?.status, expectedStatus);
      assert.equal(Number(fs.readFileSync(viewCountPath, "utf8")), expectedViews);
      const attemptedMerge = ["unchanged", "contributor", "merge-race"].includes(scenario);
      assert.equal(fs.existsSync(mergeArgsPath), attemptedMerge);
      assert.equal(
        fs.existsSync(mergeFlagPath),
        scenario === "unchanged" || scenario === "contributor",
      );
      if (attemptedMerge) {
        const mergeArgs = JSON.parse(fs.readFileSync(mergeArgsPath, "utf8"));
        assert.equal(mergeArgs[mergeArgs.indexOf("--match-head-commit") + 1], "a".repeat(40));
        const body = fs.readFileSync(mergeArgs[mergeArgs.indexOf("--body-file") + 1], "utf8");
        assert.match(body, /Prepared head SHA: a{40}/);
      }
      if (expectedStatus === "executed") {
        assert.equal(report.actions[0]?.merge_commit_sha, "b".repeat(40));
      } else if (scenario === "merge-race") {
        assert.equal(report.actions[0]?.retry_recommended, true);
      } else {
        assert.match(report.actions[0]?.reason, /commit|head/);
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
}

test("post-flight keeps no-timestamp pending duplicate checks visible", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawsweeper-post-flight-"));
  const fakeBin = path.join(tmp, "bin");
  const jobPath = path.join(tmp, "job.md");
  const runDir = path.join(tmp, "run");
  const resultPath = path.join(runDir, "result.json");
  const reportPath = path.join(runDir, "post-flight-report.json");
  const viewCountPath = path.join(tmp, "view-count.txt");

  fs.mkdirSync(fakeBin, { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(fakeBin, "gh"),
    [
      "#!/usr/bin/env node",
      "const fs = require('node:fs');",
      "const args = process.argv.slice(2);",
      "if (args[0] === 'api' && args[1] === 'repos/openclaw/openclaw/pulls/123') {",
      "  process.stdout.write(JSON.stringify({",
      "    number: 123, state: 'open', title: 'fix(ui): preserve source config',",
      "    draft: false, labels: [], base: { ref: 'main' }, merged_at: null,",
      "    head: { sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },",
      "  }));",
      "  process.exit(0);",
      "}",
      "if (args[0] === 'pr' && args[1] === 'view') {",
      "  const path = process.env.FAKE_GH_VIEW_COUNT_FILE;",
      "  const count = fs.existsSync(path) ? Number(fs.readFileSync(path, 'utf8')) : 0;",
      "  fs.writeFileSync(path, String(count + 1));",
      "  const checks = count === 0",
      "    ? [",
      "        { name: 'check', workflowName: 'CI', startedAt: '2026-05-24T00:39:40Z', status: 'COMPLETED', conclusion: 'SUCCESS' },",
      "        { name: 'check', workflowName: 'CI', status: 'QUEUED', conclusion: null },",
      "      ]",
      "    : [{ name: 'check', workflowName: 'CI', startedAt: '2026-05-24T00:39:44Z', status: 'COMPLETED', conclusion: 'SUCCESS' }];",
      "  process.stdout.write(JSON.stringify({",
      "    baseRefName: 'main', isDraft: false, mergeable: 'MERGEABLE',",
      "    mergeStateStatus: 'CLEAN', reviewDecision: null, state: 'OPEN',",
      "    statusCheckRollup: checks, title: 'fix(ui): preserve source config',",
      "    url: 'https://github.com/openclaw/openclaw/pull/123',",
      "  }));",
      "  process.exit(0);",
      "}",
      "process.stderr.write(`unexpected gh args: ${args.join(' ')}\\n`);",
      "process.exit(1);",
    ].join("\n"),
    { mode: 0o755 },
  );

  writeIssueImplementationJob(jobPath);
  writeIssueImplementationReports(runDir, resultPath);

  try {
    execFileSync(process.execPath, ["dist/repair/post-flight.js", jobPath, resultPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CLAWSWEEPER_ALLOW_EXECUTE: "1",
        CLAWSWEEPER_ALLOWED_OWNER: "openclaw",
        CLAWSWEEPER_POST_FLIGHT_WAIT_MS: "10000",
        CLAWSWEEPER_POST_FLIGHT_POLL_MS: "1",
        FAKE_GH_VIEW_COUNT_FILE: viewCountPath,
        PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? ""}`,
      },
      stdio: "pipe",
    });

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert.equal(report.actions[0]?.status, "ready");
    assert.equal(fs.readFileSync(viewCountPath, "utf8"), "2");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

function writeIssueImplementationJob(jobPath: string) {
  fs.writeFileSync(
    jobPath,
    [
      "---",
      "repo: openclaw/openclaw",
      "cluster_id: issue-openclaw-openclaw-85831",
      "mode: autonomous",
      "allowed_actions:",
      "  - comment",
      "  - label",
      "  - fix",
      "  - raise_pr",
      "blocked_actions:",
      "  - close",
      "  - merge",
      "canonical:",
      "  - '#85831'",
      "candidates:",
      "  - '#85831'",
      "cluster_refs:",
      "  - '#85831'",
      "allow_fix_pr: true",
      "allow_merge: false",
      "security_policy: central_security_only",
      "security_sensitive: false",
      "target_branch: clawsweeper/issue-openclaw-openclaw-85831",
      "source: issue_implementation",
      "---",
      "Issue implementation job.",
      "",
    ].join("\n"),
  );
}

function writeMergeJob(jobPath: string) {
  fs.writeFileSync(
    jobPath,
    [
      "---",
      "repo: openclaw/openclaw",
      "cluster_id: automerge-openclaw-openclaw-123",
      "mode: autonomous",
      "allowed_actions:",
      "  - comment",
      "  - label",
      "  - fix",
      "  - raise_pr",
      "  - merge",
      "blocked_actions: []",
      "canonical:",
      "  - '#123'",
      "candidates:",
      "  - '#123'",
      "cluster_refs:",
      "  - '#123'",
      "allow_fix_pr: true",
      "allow_merge: true",
      "security_policy: central_security_only",
      "security_sensitive: false",
      "target_branch: clawsweeper/automerge-openclaw-openclaw-123",
      "source: pr_automerge",
      "---",
      "Automerge job.",
      "",
    ].join("\n"),
  );
}

function writeIssueImplementationReports(runDir: string, resultPath: string) {
  fs.writeFileSync(
    resultPath,
    JSON.stringify(
      {
        repo: "openclaw/openclaw",
        cluster_id: "issue-openclaw-openclaw-85831",
        mode: "autonomous",
        actions: [],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(runDir, "fix-execution-report.json"),
    JSON.stringify(
      {
        actions: [
          {
            action: "open_fix_pr",
            status: "opened",
            pr_url: "https://github.com/openclaw/openclaw/pull/123",
            branch: "clawsweeper/issue-openclaw-openclaw-85831",
          },
        ],
      },
      null,
      2,
    ),
  );
}

function writeMergeReports(runDir: string, resultPath: string) {
  fs.writeFileSync(
    resultPath,
    JSON.stringify(
      {
        repo: "openclaw/openclaw",
        cluster_id: "automerge-openclaw-openclaw-123",
        mode: "autonomous",
        actions: [],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(runDir, "fix-execution-report.json"),
    JSON.stringify(
      {
        actions: [
          {
            action: "open_fix_pr",
            status: "opened",
            commit: "a".repeat(40),
            pr_url: "https://github.com/openclaw/openclaw/pull/123",
            branch: "clawsweeper/automerge-openclaw-openclaw-123",
            merge_preflight: {
              security_status: "cleared",
              security_evidence: ["no security signal"],
              comments_status: "resolved",
              comments_evidence: ["no unresolved review comments"],
              bot_comments_status: "resolved",
              bot_comments_evidence: ["no unresolved bot comments"],
              validation_commands: ["pnpm test"],
              codex_review: {
                command: "/review",
                status: "passed",
                findings_addressed: true,
                evidence: ["Codex review passed"],
              },
            },
          },
        ],
      },
      null,
      2,
    ),
  );
}
