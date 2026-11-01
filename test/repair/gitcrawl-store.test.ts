import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

test("gitcrawl readers prefer portable gitcrawl-store before legacy local DB", () => {
  const sources = [
    readFileSync("src/clawsweeper.ts", "utf8"),
    readFileSync("src/repair/import-gitcrawl-clusters.ts", "utf8"),
    readFileSync("src/repair/import-gitcrawl-low-signal-prs.ts", "utf8"),
  ];

  for (const source of sources) {
    assert.match(source, /CLAWSWEEPER_GITCRAWL_DB/);
    assert.match(source, /gitcrawl-store/);
    assert.match(source, /\.sync\.db/);
    assert.match(source, /replace\(/);
    assert(source.indexOf("gitcrawl-store") < source.indexOf('.config", "gitcrawl", "gitcrawl.db'));
  }
});

test("gitcrawl docs describe external store freshness instead of per-run crawling", () => {
  const relatedDocs = readFileSync("docs/related-issue-discovery.md", "utf8");
  const repairDocs = readFileSync("docs/repair/README.md", "utf8");

  assert.match(relatedDocs, /does not run a gitcrawl fetch\s+or download issues during review/);
  assert.match(relatedDocs, /git pull --ff-only/);
  assert.match(repairDocs, /does not crawl or download\s+issues during repair import/);
  assert.match(repairDocs, /git -C \.\.\/gitcrawl-store pull --ff-only/);
});

test("gitcrawl cluster import drip-feeds mostly open clusters by default", () => {
  const source = readFileSync("src/repair/import-gitcrawl-clusters.ts", "utf8");
  const limitsDocs = readFileSync("docs/limits.md", "utf8");
  const repairDocs = readFileSync("docs/repair/README.md", "utf8");

  assert.match(source, /const allowEmpty = Boolean\(args\["allow-empty"\]\)/);
  assert.match(source, /const allowInstantClose = booleanArg\("allow-instant-close", false\)/);
  assert.match(source, /const skipClosedPercent = percentArg\("skip-closed-percent", 75\)/);
  assert.match(source, /skip mostly-closed cluster/);
  assert.match(source, /closedPercent >= skipClosedPercent/);
  assert.match(
    source,
    /\(\(closed_count \* 100\) \/ eligible_member_count\) < \$\{sqlNumber\(skipClosedPercent\)\}/,
  );
  assert.match(limitsDocs, /75% closed members are skipped/);
  assert.match(repairDocs, /75%\+ closed clusters by default/);
});

test("scheduled cluster repair intake follows gitcrawl-store freshness cadence", () => {
  const workflow = readFileSync(".github/workflows/repair-cluster-intake.yml", "utf8");
  const limitsDocs = readFileSync("docs/limits.md", "utf8");
  const repairDocs = readFileSync("docs/repair/README.md", "utf8");
  const internalDocs = readFileSync("docs/repair/internal-features.md", "utf8");

  assert.match(workflow, /cron: "8 8 \* \* \*"/);
  assert.match(workflow, /gitcrawl-store refreshes openclaw\/openclaw every 15 minutes/);
  assert.match(workflow, /last_processed_store_sha256/);
  assert.match(workflow, /CLAWSWEEPER_CLUSTER_REPAIR_IMPORT_LIMIT \|\| '1'/);
  assert.match(workflow, /pnpm run repair:dispatch/);
  assert.doesNotMatch(workflow, /git pull --rebase origin main/);
  assert.match(limitsDocs, /default is `1` cluster per daily\s+run/);
  assert.match(repairDocs, /intake runs daily/);
  assert.match(internalDocs, /refreshes `openclaw\/openclaw` every 15\s+minutes/);
});

test("gitcrawl cluster import is not blocked by the scheduled intake gate", () => {
  const source = readFileSync("src/repair/import-gitcrawl-clusters.ts", "utf8");
  const lowSignalSource = readFileSync("src/repair/import-gitcrawl-low-signal-prs.ts", "utf8");
  const dispatchJobs = readFileSync("src/repair/dispatch-jobs.ts", "utf8");

  assert.doesNotMatch(source, /CLAWSWEEPER_FEATURE_CLUSTER_REPAIR_ENABLED/);
  assert.doesNotMatch(lowSignalSource, /CLAWSWEEPER_FEATURE_CLUSTER_REPAIR_ENABLED/);
  assert.doesNotMatch(dispatchJobs, /CLAWSWEEPER_FEATURE_CLUSTER_REPAIR_ENABLED/);
});

for (const family of ["legacy", "portable"] as const) {
  test(`${family} cluster import preserves repository identity`, async (t) => {
    const tmp = mkdtempSync(path.join(os.tmpdir(), "clawsweeper-cluster-repo-"));
    t.after(() => rmSync(tmp, { recursive: true, force: true }));
    const runtime = path.join(tmp, "runtime");
    const bin = path.join(tmp, "bin");
    mkdirSync(runtime);
    mkdirSync(bin);
    cpSync("dist", path.join(runtime, "dist"), { recursive: true });
    cpSync("config", path.join(runtime, "config"), { recursive: true });
    // Execute the production SQL with SQLite without requiring a system CLI package.
    writeFileSync(
      path.join(bin, "sqlite3"),
      `#!${process.execPath}
const { DatabaseSync } = require("node:sqlite");
const args = process.argv.slice(2);
const json = args[0] === "-json";
if (json) args.shift();
if (args.length !== 2) throw new Error("unexpected SQLite invocation");
const db = new DatabaseSync(args[0], { readOnly: true });
try {
  const rows = db.prepare(args[1]).all();
  console.log(json ? JSON.stringify(rows) : rows.map(row => Object.values(row).join("|")).join("\\n"));
} finally {
  db.close();
}
`,
      { mode: 0o755 },
    );

    const cases = [
      { name: "foreign explicit cluster", foreignCluster: true, automatic: false, jobs: 0 },
      { name: "foreign automatic cluster", foreignCluster: true, automatic: true, jobs: 0 },
      { name: "same repository explicit cluster", automatic: false, jobs: 1 },
      { name: "same repository automatic cluster", automatic: true, jobs: 1 },
      {
        name: "foreign member excluded explicitly",
        foreignMember: true,
        automatic: false,
        jobs: 1,
      },
      {
        name: "foreign member excluded automatically",
        foreignMember: true,
        automatic: true,
        jobs: 1,
      },
      {
        name: "foreign member cannot satisfy minimum size",
        foreignMember: true,
        automatic: true,
        minSize: 3,
        jobs: 0,
      },
      {
        name: "foreign representative excluded explicitly",
        representative: "foreign",
        automatic: false,
        jobs: 1,
      },
      {
        name: "foreign representative excluded automatically",
        representative: "foreign",
        automatic: true,
        jobs: 1,
      },
      {
        name: "missing representative remains supported explicitly",
        representative: "missing",
        automatic: false,
        jobs: 1,
      },
      {
        name: "missing representative remains supported automatically",
        representative: "missing",
        automatic: true,
        jobs: 1,
      },
    ];
    for (const scenario of cases) {
      await t.test(scenario.name, () => {
        const dir = mkdtempSync(path.join(tmp, "case-"));
        const dbPath = path.join(dir, "store.db");
        const db = new DatabaseSync(dbPath);
        try {
          // Required query columns from Gitcrawl's legacy and portable schemas.
          db.exec(`
            create table repositories (id integer primary key, owner text, name text);
            create table threads (
              id integer primary key, repo_id integer, number integer, kind text, state text,
              title text, body text, body_excerpt text, labels_json text, updated_at text
            );
            insert into repositories values (1, 'fixture', 'alpha'), (2, 'fixture', 'beta');
          `);
          const insertThread = db.prepare(
            "insert into threads values (?, ?, ?, 'issue', 'open', 'Fix import selection', 'Bug report', 'Bug report', '[]', '2026-10-29T00:00:00Z')",
          );
          for (const [id, repoId, number] of [
            [101, 1, 11],
            [102, 1, 12],
            [201, 2, 11],
            [202, 2, 12],
            [203, 2, 99],
          ]) {
            insertThread.run(id, repoId, number);
          }
          const repoId = scenario.foreignCluster ? 2 : 1;
          const members = scenario.foreignCluster ? [201, 202] : [101, 102];
          if (scenario.foreignMember) members.push(203);
          const representative =
            scenario.representative === "missing"
              ? null
              : scenario.representative === "foreign"
                ? 203
                : members[0];
          if (family === "legacy") {
            db.exec(`
              create table clusters (id integer primary key, repo_id integer,
                representative_thread_id integer, member_count integer, created_at text,
                closed_at_local text, close_reason_local text);
              create table cluster_members (cluster_id integer, thread_id integer);
            `);
            db.prepare("insert into clusters values (9, ?, ?, ?, '2026-10-29', null, null)").run(
              repoId,
              representative,
              members.length,
            );
            for (const member of members)
              db.prepare("insert into cluster_members values (9, ?)").run(member);
          } else {
            db.exec(`
              create table cluster_groups (id integer primary key, repo_id integer,
                representative_thread_id integer, created_at text, closed_at text, status text);
              create table cluster_memberships (cluster_id integer, thread_id integer, state text);
            `);
            db.prepare(
              "insert into cluster_groups values (9, ?, ?, '2026-10-29', null, 'active')",
            ).run(repoId, representative);
            for (const member of members)
              db.prepare("insert into cluster_memberships values (9, ?, 'active')").run(member);
          }
        } finally {
          db.close();
        }

        const out = path.join(dir, "jobs");
        mkdirSync(out);
        const result = spawnSync(
          process.execPath,
          [
            path.join(runtime, "dist/repair/import-gitcrawl-clusters.js"),
            ...(scenario.automatic ? ["--from-gitcrawl", "--allow-empty"] : ["9"]),
            "--repo",
            "fixture/alpha",
            "--db",
            dbPath,
            "--out",
            out,
            "--mode",
            "autonomous",
            "--min-size",
            String(scenario.minSize ?? 2),
          ],
          {
            cwd: runtime,
            env: { PATH: bin, HOME: dir, GITHUB_REPOSITORY: "fixture/runtime" },
            encoding: "utf8",
            timeout: 20_000,
          },
        );
        assert.equal(result.status, 0, result.stderr || result.error?.message);
        const files = readdirSync(out, { recursive: true }).filter((file) =>
          String(file).endsWith(".md"),
        );
        assert.equal(files.length, scenario.jobs, result.stdout);
        if (scenario.jobs === 0) return;
        const job = readFileSync(path.join(out, String(files[0])), "utf8");
        assert.match(job, /^repo: fixture\/alpha$/m);
        assert.match(job, /^candidates:\n  - "#11"\n  - "#12"\n/m);
        assert.match(job, /^cluster_refs:\n  - "#11"\n  - "#12"\n/m);
        assert.doesNotMatch(job, /#99\b/);
        if (scenario.representative) assert.match(job, /^canonical:\n  \[\]\n/m);
        else assert.match(job, /^canonical:\n  - "#11"\n/m);
      });
    }
  });
}
