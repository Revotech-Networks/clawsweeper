import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

for (const securitySensitive of [false, true]) {
  test(`repair review ${securitySensitive ? "rejects security-sensitive" : "accepts ordinary"} low-signal closure`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawsweeper-review-results-"));
    try {
      const resultPath = path.join(tmp, "result.json");
      const updatedAt = "2026-05-25T00:00:00Z";
      fs.writeFileSync(
        path.join(tmp, "cluster-plan.json"),
        JSON.stringify({
          items: [
            {
              ref: "#101",
              kind: "pull_request",
              state: "open",
              updated_at: updatedAt,
              security_sensitive: securitySensitive,
            },
          ],
        }),
      );
      fs.writeFileSync(
        resultPath,
        JSON.stringify({
          repo: "openclaw/openclaw",
          cluster_id: "low-signal-review",
          mode: "execute",
          status: "planned",
          actions: [
            {
              target: "#101",
              action: "close_low_signal",
              classification: "low_signal",
              status: "planned",
              target_kind: "pull_request",
              target_updated_at: updatedAt,
              idempotency_key: "low-signal-review-101",
              evidence: [
                "Synthetic low-signal recommendation; deterministic preflight governs safety.",
              ],
            },
          ],
        }),
      );

      const review = spawnSync(process.execPath, ["dist/repair/review-results.js", resultPath], {
        cwd: process.cwd(),
        env: { PATH: "", HOME: tmp },
        encoding: "utf8",
        timeout: 10_000,
      });
      assert.equal(review.error, undefined);
      assert.equal(review.status, securitySensitive ? 1 : 0, review.stderr || review.stdout);
      const report = JSON.parse(review.stdout);
      assert.equal(report.status, securitySensitive ? "failed" : "passed");
      assert.deepEqual(
        report.reports[0].failures,
        securitySensitive ? ["#101 mutating action targets security-sensitive item"] : [],
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
}
