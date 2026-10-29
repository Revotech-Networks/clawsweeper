import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test, { after } from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const artifactRoot = path.join(root, ".artifacts/gate-repair");
fs.mkdirSync(artifactRoot, { recursive: true });
const fixtures = fs.mkdtempSync(path.join(artifactRoot, "fixtures-"));
after(() => fs.rmSync(fixtures, { recursive: true, force: true }));
const gates = ["CLAWSWEEPER_ALLOW_EXECUTE", "CLAWSWEEPER_ALLOW_FIX_PR"];
const both = (value: string) => Object.fromEntries(gates.map((gate) => [gate, value]));
const started = Date.now();
let fixtureBlocked = false;

type Scenario = {
  variables?: Record<string, string>;
  gateEnv?: Record<string, string>;
  dispatchFailure?: boolean;
  snapshot?: string;
  openFailure?: "before" | "after";
  restoreFailures?: string[];
  dryRun?: boolean;
  window?: boolean;
  mode?: string;
  allowFix?: boolean;
  capacityFull?: boolean;
  waitForCapacity?: boolean;
};

// The real compiled entrypoints run in a copied import closure: their repoRoot(),
// job paths and ledger writes all resolve inside the fixture.
function copyRuntime(runtime: string) {
  const pending = ["dist/repair/requeue-job.js", "dist/repair/self-heal-failed-runs.js"];
  const copied = new Set<string>();
  while (pending.length) {
    const relative = pending.pop()!;
    if (copied.has(relative)) continue;
    assert.ok(relative.startsWith("dist/"));
    copied.add(relative);
    const content = fs.readFileSync(path.join(root, relative), "utf8");
    fs.mkdirSync(path.dirname(path.join(runtime, relative)), { recursive: true });
    fs.writeFileSync(path.join(runtime, relative), content);
    for (const match of content.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
      const specifier = match[1]!;
      if (specifier.startsWith("node:")) continue;
      assert.ok(specifier.startsWith("."), `unexpected runtime dependency: ${specifier}`);
      pending.push(path.normalize(path.join(path.dirname(relative), specifier)));
    }
  }
  fs.mkdirSync(path.join(runtime, "config"));
  fs.copyFileSync(
    path.join(root, "config/automation-limits.json"),
    path.join(runtime, "config/automation-limits.json"),
  );
  fs.writeFileSync(path.join(runtime, "package.json"), '{"type":"module"}\n');
}

const fakeCli = String.raw`
import fs from "node:fs";
import path from "node:path";
const dir = process.env.FIXTURE_DIR;
const spec = JSON.parse(fs.readFileSync(path.join(dir, "scenario.json"), "utf8"));
const file = path.join(dir, "state.json");
const state = JSON.parse(fs.readFileSync(file, "utf8"));
const args = process.argv.slice(2);
const tool = path.basename(process.argv[1]);
const gates = ["CLAWSWEEPER_ALLOW_EXECUTE", "CLAWSWEEPER_ALLOW_FIX_PR"];
const equal = (expected) => JSON.stringify(args) === JSON.stringify(expected);
const head = "1111111111111111111111111111111111111111";
let kind = "unexpected", status = 0, output = "", error = "";
if (process.cwd() !== path.join(dir, "runtime")) throw new Error("wrong fixture cwd");
if (tool === "git" && equal(["rev-parse", "origin/main"])) {
  kind = "head"; output = head;
} else if (tool === "gh" && equal(["variable", "list", "--repo", "proof/fixture", "--json", "name,value"])) {
  kind = "snapshot";
  if (spec.snapshot === "denied") {
    status = 43; error = "HTTP 403: Resource not accessible by integration (SYNTHETIC_SNAPSHOT_FAILURE)";
  } else {
    output = spec.snapshot ?? JSON.stringify(Object.entries(state.variables).map(([name, value]) => ({name, value})));
  }
} else if (tool === "gh" && (
  (args.length === 7 && args[0] === "variable" && args[1] === "set" && args[5] === "--body" && typeof args[6] === "string") ||
  (args.length === 5 && args[0] === "variable" && args[1] === "delete")
) && gates.includes(args[2]) && args[3] === "--repo" && args[4] === "proof/fixture") {
  const name = args[2];
  const opening = args[1] === "set" && args[6] === "1" && !state.opened.includes(name);
  kind = opening ? "open" : "restore";
  if (opening) state.opened.push(name);
  if (opening && name === gates[1] && spec.openFailure) {
    if (spec.openFailure === "after") state.variables[name] = "1";
    status = 44; error = "SYNTHETIC_OPEN_FAILURE";
  } else if (!opening && (spec.restoreFailures ?? []).includes(name)) {
    status = 42; error = "SYNTHETIC_RESTORE_FAILURE: " + name;
  } else if (args[1] === "delete") {
    delete state.variables[name];
  } else {
    state.variables[name] = args[6];
  }
} else if (tool === "gh" && ["queued", "in_progress", "waiting", "requested", "pending"].some(status => equal([
  "api", "--method", "GET",
  "repos/proof/fixture/actions/workflows/repair-cluster-worker.yml/runs?per_page=100&status=" + status,
  "--jq", ".workflow_runs"
]))) {
  kind = "capacity";
  output = JSON.stringify(spec.capacityFull ? [{id: 800001, status: "in_progress"}] : []);
} else if (tool === "gh" && equal([
  "workflow", "run", "repair-cluster-worker.yml", "--repo", "proof/fixture",
  "-f", "job=jobs/gate-proof.md", "-f", "mode=" + (spec.mode ?? "execute"),
  "-f", "runner=fixture-runner", "-f", "execution_runner=fixture-executor", "-f", "model=fixture-model"
])) {
  kind = "dispatch";
  status = spec.dispatchFailure ? 41 : 0;
  if (status) error = "SYNTHETIC_DISPATCH_FAILURE";
  state.dispatches.push({status, variables: {...state.variables}, createdAt: new Date().toISOString()});
} else if (tool === "gh" && [
  "databaseId,workflowName,headSha,status,conclusion,createdAt,url",
  "databaseId,workflowName,displayTitle,headSha,status,conclusion,createdAt,updatedAt,url"
].some(fields => equal(["run", "list", "--repo", "proof/fixture", "--limit", "200", "--json", fields]))) {
  kind = "runs";
  output = JSON.stringify(state.dispatches.filter(d => d.status === 0).map(d => ({
    databaseId: 900001, workflowName: "repair cluster worker", displayTitle: "repair cluster jobs/gate-proof.md",
    headSha: head, status: "in_progress", conclusion: null, createdAt: d.createdAt, updatedAt: d.createdAt,
    url: "https://example.invalid/runs/900001"
  })));
} else {
  status = 97; error = "FAIL_CLOSED_UNEXPECTED_COMMAND: " + JSON.stringify([tool, ...args]);
}
state.calls.push({tool, args, kind, status});
fs.writeFileSync(file, JSON.stringify(state));
process.stdout.write(output);
process.stderr.write(error);
process.exit(status);
`;

function runFixture(cli: string, spec: Scenario = {}) {
  assert.equal(fixtureBlocked, false, "earlier fixture hit a forbidden command or timeout");
  assert.ok(Date.now() - started < 40_000, "focused fixture budget exhausted");
  const dir = fs.mkdtempSync(path.join(fixtures, `${cli}-`));
  const runtime = path.join(dir, "runtime");
  for (const child of ["runtime", "bin", "home", "config", "tmp"]) {
    fs.mkdirSync(path.join(dir, child));
  }
  copyRuntime(runtime);
  fs.writeFileSync(path.join(dir, "scenario.json"), JSON.stringify(spec));
  fs.writeFileSync(
    path.join(dir, "state.json"),
    JSON.stringify({
      variables: spec.variables ?? {},
      calls: [],
      dispatches: [],
      opened: [],
    }),
  );
  for (const tool of ["gh", "git"]) {
    fs.writeFileSync(path.join(dir, "bin", tool), `#!${process.execPath}\n${fakeCli}`, {
      mode: 0o700,
    });
  }
  fs.mkdirSync(path.join(runtime, "jobs"));
  fs.writeFileSync(
    path.join(runtime, "jobs/gate-proof.md"),
    `---
repo: proof/fixture
cluster_id: synthetic-gate-proof
mode: ${spec.mode ?? "execute"}
allowed_actions: [${spec.allowFix === false ? "comment" : "fix"}]
candidates: [1]
allow_fix_pr: ${spec.allowFix !== false}
---
Synthetic temporary gate regression fixture.
`,
  );
  fs.mkdirSync(path.join(runtime, "results/runs"), { recursive: true });
  fs.writeFileSync(
    path.join(runtime, "results/runs/900000.json"),
    JSON.stringify({
      run_id: "900000",
      source_job: "jobs/gate-proof.md",
      workflow_conclusion: "failure",
      cluster_id: "synthetic-gate-proof",
      mode: spec.mode ?? "execute",
      published_at: new Date().toISOString(),
    }),
  );
  const args = [path.join(runtime, "dist/repair", `${cli}.js`)];
  if (cli === "requeue-job") args.push("jobs/gate-proof.md");
  args.push(
    "--repo",
    "proof/fixture",
    "--runner",
    "fixture-runner",
    "--execution-runner",
    "fixture-executor",
    "--model",
    "fixture-model",
    "--max-live-workers",
    "1",
  );
  if (!spec.dryRun) args.push("--execute");
  if (spec.window !== false) args.push("--open-execute-window");
  if (spec.waitForCapacity) args.push("--wait-for-capacity");
  if (cli === "self-heal-failed-runs") args.push("--max-jobs", "1");
  const result = spawnSync(process.execPath, args, {
    cwd: runtime,
    encoding: "utf8",
    timeout: 3_000,
    env: {
      PATH: path.join(dir, "bin"),
      HOME: path.join(dir, "home"),
      XDG_CONFIG_HOME: path.join(dir, "config"),
      GH_CONFIG_DIR: path.join(dir, "config/gh"),
      TMPDIR: path.join(dir, "tmp"),
      FIXTURE_DIR: dir,
      CLAWSWEEPER_REPO: "proof/fixture",
      NO_COLOR: "1",
      LANG: "C.UTF-8",
      CLAWSWEEPER_LIVE_WORKER_CAPACITY_TIMEOUT_MS: "20",
      CLAWSWEEPER_LIVE_WORKER_CAPACITY_POLL_MS: "1",
      ...spec.gateEnv,
    },
  });
  const state = JSON.parse(fs.readFileSync(path.join(dir, "state.json"), "utf8"));
  fixtureBlocked = Boolean(result.error || state.calls.some((call) => call.kind === "unexpected"));
  assert.equal(fixtureBlocked, false, result.stderr || String(result.error));
  if (!spec.dryRun) {
    assert.deepEqual(
      state.calls.filter((call) => call.tool === "git").map((call) => call.args),
      [["rev-parse", "origin/main"]],
    );
  }
  const ledger = path.join(runtime, "results/self-heal.json");
  return {
    ...state,
    ...result,
    writes: state.calls.filter((call) => ["open", "restore"].includes(call.kind)),
    restores: state.calls.filter((call) => call.kind === "restore"),
    ledger: fs.existsSync(ledger) ? JSON.parse(fs.readFileSync(ledger, "utf8")) : null,
  };
}

for (const cli of ["requeue-job", "self-heal-failed-runs"]) {
  for (const [label, variables] of Object.entries({
    absent: {},
    empty: both(""),
    zero: both("0"),
    one: both("1"),
    mixed: { [gates[0]!]: "  paused\n", [gates[1]!]: "1" },
  })) {
    for (const dispatchFailure of [false, true]) {
      test(`${cli}: restore ${label} after dispatch ${dispatchFailure ? "failure" : "success"}`, () => {
        const result = runFixture(cli, { variables, dispatchFailure });
        assert.equal(result.status, dispatchFailure ? 1 : 0, result.stderr);
        assert.deepEqual(result.variables, variables);
        assert.equal(result.dispatches.length, 1);
        assert.deepEqual(result.dispatches[0].variables, both("1"));
        const changed = gates.filter((gate) => variables[gate] !== "1");
        assert.deepEqual(
          result.writes.map((call) => call.args[2]),
          [...changed, ...changed.toReversed()],
        );
        if (dispatchFailure) {
          assert.match(
            result.stderr,
            /failed to dispatch jobs\/gate-proof.md: SYNTHETIC_DISPATCH_FAILURE/,
          );
          assert.doesNotMatch(result.stderr, /AggregateError/);
        }
        if (cli === "self-heal-failed-runs") {
          assert.equal(Boolean(result.ledger), !dispatchFailure);
          if (result.ledger)
            assert.deepEqual(result.ledger.attempts[0].dispatched_run_ids, ["900001"]);
        }
      });
    }
  }

  for (const snapshot of [
    "denied",
    "null",
    "{}",
    "[null]",
    '[{"name":"CLAWSWEEPER_ALLOW_FIX_PR"}]',
    '[{"name":"CLAWSWEEPER_ALLOW_EXECUTE","value":0}]',
    '[{"name":"CLAWSWEEPER_ALLOW_EXECUTE","value":"0"},{"name":"CLAWSWEEPER_ALLOW_EXECUTE","value":"1"}]',
    "invalid json",
  ]) {
    test(`${cli}: unusable snapshot ${snapshot} blocks all writes and dispatch`, () => {
      const result = runFixture(cli, { snapshot, variables: both("0"), gateEnv: both("1") });
      assert.equal(result.status, 1);
      assert.deepEqual(result.writes, []);
      assert.deepEqual(result.dispatches, []);
      assert.deepEqual(result.variables, both("0"));
    });
  }

  for (const openFailure of ["before", "after"] as const) {
    test(`${cli}: second opening failure ${openFailure} applying unwinds every attempt`, () => {
      const result = runFixture(cli, { openFailure });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /SYNTHETIC_OPEN_FAILURE/);
      assert.deepEqual(result.dispatches, []);
      assert.deepEqual(result.variables, {});
      assert.deepEqual(
        result.restores.map((call) => call.args[2]),
        gates.toReversed(),
      );
    });
  }

  for (const variables of [{}, both("0")]) {
    for (const restoreFailures of [[gates[1]!], gates]) {
      for (const dispatchFailure of [false, true]) {
        test(`${cli}: attempt both ${Object.keys(variables).length ? "set" : "delete"} restores with ${restoreFailures.length} cleanup failures and dispatch failure=${dispatchFailure}`, () => {
          const result = runFixture(cli, { variables, restoreFailures, dispatchFailure });
          assert.equal(result.status, 1);
          assert.deepEqual(
            result.restores.map((call) => call.args[2]),
            gates.toReversed(),
          );
          assert.match(result.stderr, /AggregateError/);
          for (const gate of restoreFailures)
            assert.ok(result.stderr.includes(`SYNTHETIC_RESTORE_FAILURE: ${gate}`));
          if (dispatchFailure) assert.match(result.stderr, /SYNTHETIC_DISPATCH_FAILURE/);
          assert.deepEqual(result.variables, {
            ...variables,
            ...Object.fromEntries(restoreFailures.map((gate) => [gate, "1"])),
          });
        });
      }
    }
  }

  test(`${cli}: dry run performs no writes or dispatch`, () => {
    const result = runFixture(cli, { dryRun: true });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.writes, []);
    assert.deepEqual(result.dispatches, []);
    assert.equal(result.ledger, null);
  });

  for (const waitForCapacity of [false, true]) {
    test(`${cli}: ${waitForCapacity ? "waited" : "immediate"} capacity refusal restores gates without dispatch`, () => {
      const result = runFixture(cli, { capacityFull: true, waitForCapacity });
      assert.equal(result.status, 1);
      assert.match(result.stderr, waitForCapacity ? /timed out waiting/ : /refusing dispatch/);
      assert.deepEqual(result.variables, {});
      assert.deepEqual(result.dispatches, []);
      assert.equal(result.ledger, null);
    });
  }

  test(`${cli}: non-window closed gate refuses dispatch without mutation`, () => {
    const result = runFixture(cli, { window: false, gateEnv: both("0") });
    assert.equal(result.status, 1);
    assert.deepEqual(result.writes, []);
    assert.deepEqual(result.dispatches, []);
  });

  test(`${cli}: plan mode keeps existing gate selection`, () => {
    const result = runFixture(cli, { mode: "plan" });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.variables, {});
    assert.equal(result.dispatches.length, 1);
    assert.deepEqual(result.dispatches[0].variables, cli === "requeue-job" ? {} : both("1"));
    if (cli === "requeue-job") assert.deepEqual(result.writes, []);
  });
}

for (const envValue of ["0", "1"]) {
  for (const dispatchFailure of [false, true]) {
    test(`self-heal: environment ${envValue} does not invent repository presence; dispatch failure=${dispatchFailure}`, () => {
      const result = runFixture("self-heal-failed-runs", {
        gateEnv: both(envValue),
        dispatchFailure,
      });
      assert.equal(result.status, dispatchFailure ? 1 : 0, result.stderr);
      assert.deepEqual(result.variables, {});
      assert.deepEqual(result.dispatches[0].variables, both("1"));
    });
  }
}

test("self-heal: non-window env-first gate behavior is preserved", () => {
  const result = runFixture("self-heal-failed-runs", {
    window: false,
    variables: both("0"),
    gateEnv: both("1"),
    snapshot: "denied",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.writes, []);
  assert.equal(result.dispatches.length, 1);
  assert.deepEqual(result.variables, both("0"));
  assert.equal(
    result.calls.some((call) => call.kind === "snapshot"),
    false,
  );
});

test("self-heal: non-window 403 fallback still refuses a closed gate", () => {
  const result = runFixture("self-heal-failed-runs", { window: false, snapshot: "denied" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /falling back to workflow env/);
  assert.deepEqual(result.writes, []);
  assert.deepEqual(result.dispatches, []);
});

test("requeue: autonomous comment-only job opens only the execute gate", () => {
  const result = runFixture("requeue-job", { allowFix: false, mode: "autonomous" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.variables, {});
  assert.deepEqual(
    result.writes.map((call) => call.args[2]),
    [gates[0], gates[0]],
  );
  assert.deepEqual(result.dispatches[0].variables, { [gates[0]!]: "1" });
});
