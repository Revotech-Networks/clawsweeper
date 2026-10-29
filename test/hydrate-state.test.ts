import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/hydrate-state.ts", import.meta.url));

test("hydration rejects overlapping layouts before deleting any state", (t) => {
  const cases = ["same-root", "root-alias", "nested-source", "nested-target", "cross-path-alias"];
  for (const scenario of cases) {
    const root = mkdtempSync(path.join(os.tmpdir(), "clawsweeper-hydration-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    let source = path.join(root, "state");
    let target = path.join(root, "worktree");
    if (scenario === "same-root") target = source;
    if (scenario === "nested-source") source = path.join(target, "results", "state");
    if (scenario === "nested-target") target = path.join(source, "records", "worktree");
    mkdirSync(path.join(source, "records"), { recursive: true });
    writeFileSync(path.join(source, "records", "source.txt"), "source state");
    if (scenario === "root-alias") symlinkSync(source, target, "dir");
    mkdirSync(path.join(target, "records"), { recursive: true });
    writeFileSync(path.join(target, "records", "target.txt"), "existing target");
    if (scenario === "cross-path-alias") {
      symlinkSync(path.join(target, "records"), path.join(source, "jobs"), "dir");
    }
    const result = spawnSync(
      process.execPath,
      [script, "--state-dir", source, "--worktree", target],
      {
        encoding: "utf8",
      },
    );
    assert.notEqual(result.status, 0, scenario);
    assert.match(result.stderr, /Hydration paths overlap/, scenario);
    assert.equal(
      readFileSync(path.join(source, "records", "source.txt"), "utf8"),
      "source state",
      scenario,
    );
    assert.equal(
      readFileSync(path.join(target, "records", "target.txt"), "utf8"),
      "existing target",
      scenario,
    );
  }
});

test("hydration preserves sibling and normal nested checkout layouts", (t) => {
  for (const nested of [false, true]) {
    const root = mkdtempSync(path.join(os.tmpdir(), "clawsweeper-hydration-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const target = path.join(root, "worktree");
    const source = nested ? path.join(target, "clawsweeper-state") : path.join(root, "state");
    mkdirSync(path.join(source, "records"), { recursive: true });
    writeFileSync(path.join(source, "records", "source.txt"), "source state");
    mkdirSync(path.join(target, "records"), { recursive: true });
    writeFileSync(path.join(target, "records", "obsolete.txt"), "old state");
    mkdirSync(path.join(target, "jobs"), { recursive: true });
    writeFileSync(path.join(target, "jobs", "obsolete.json"), "{}");
    writeFileSync(path.join(target, "keep.txt"), "not generated");
    const result = spawnSync(
      process.execPath,
      [script, "--state-dir", source, "--worktree", target],
      {
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).source, source);
    assert.equal(readFileSync(path.join(source, "records", "source.txt"), "utf8"), "source state");
    assert.equal(readFileSync(path.join(target, "records", "source.txt"), "utf8"), "source state");
    assert.equal(existsSync(path.join(target, "records", "obsolete.txt")), false);
    assert.equal(existsSync(path.join(target, "jobs")), false);
    assert.equal(readFileSync(path.join(target, "keep.txt"), "utf8"), "not generated");
  }
});
