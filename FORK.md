# FORK.md: Revotech fork of ClawSweeper

This is `Revotech-Networks/clawsweeper`, a fork of
[`openclaw/clawsweeper`](https://github.com/openclaw/clawsweeper). This file
covers only what differs in our fork. For everything else the upstream docs
apply; see [Upstream docs that still apply](#upstream-docs-that-still-apply).

Read this file before you change code, config, workflows or docs here.

## Why we fork and who uses it

We fork for three reasons:

- **Revotech targets.** Our config adds a conservative profile for
  `Revotech-Networks/revomind` and a review-only fallback for every other
  `Revotech-Networks/*` repository.
- **A reference model for our worker.** `Revotech-Networks/revo-claude-worker`
  uses ClawSweeper as its model for queue and lane design: durable per-item
  reports, lanes with capacity limits, model runs kept separate from GitHub
  writes, and proof that a change is merged before closing.
- **Hardening.** The fork is where we audit and fix ClawSweeper. Upstream has
  none of these fixes yet. The tracking issue is
  https://github.com/Revotech-Networks/clawsweeper/issues/1 and the full record
  is `QA-HARDENING-REPORT.md`.

Where the fork is used today:

| Where | What uses it | Details |
| --- | --- | --- |
| Worker PC (Windows + WSL 2 Ubuntu, runs as `root`) | `revo-claude-worker/scripts/bootstrap_openclaw_tools.sh` | Clones the fork to `/root/openclaw-tools/clawsweeper` (override with `OPENCLAW_TOOLS_DIR`), adds the `upstream` remote, then runs `pnpm install --frozen-lockfile && pnpm run build`. |
| Worker PC | `revo-claude-worker/scripts/update_openclaw_forks.sh` | Runs `git merge --ff-only upstream/main` on `main` and pushes to `origin main`. **This always fails for this repo.** Our `main` has its own commits, and upstream rewrote its history (see [Sync from upstream](#sync-from-upstream)). |
| GitHub Actions on this fork | `.github/workflows/*.yml` (inherited from upstream) | Only `CI` (`pnpm check`) and `CodeQL` are meaningful here. The fork has no Actions secrets or variables, so live workflows fail. |
| This repo | `QA-HARDENING-REPORT.md`, issues and PRs | Records for the audit and hardening work. |

Nothing deploys this fork as a live bot. No systemd unit, cron job or service
runs ClawSweeper commands. The worker PC only clones and builds it. The worker
PC paths come from `revo-claude-worker` (`README.md`,
`docs/openclaw-integration.md` and the two scripts above). This guide was
written on another machine, so check those paths on the worker PC before you
rely on them.

What the live Actions failures mean on this fork:

- Scheduled `ClawSweeper` (`sweep.yml`) and `repair comment router` runs fail at
  the `Create state token` step with `[@octokit/auth-app] privateKey option is
  required`. This is expected: the fork has no GitHub App key and no access to
  `openclaw/clawsweeper-state`.
- Don't try to fix these failures by adding secrets. Wiring this fork to a real
  GitHub App and state repository is Chris's decision.
- Judge PRs only by the `CI` (`pnpm check`) and `CodeQL` checks.

## How the fork differs from upstream

The fork branched from upstream commit `fd3f6ff32c` ("Fix fast ack command
parsing (#233)", 2026-05-31, https://github.com/openclaw/clawsweeper/pull/233). Our copy of that commit is `a07fc1f942`. Both
have the same tree (`866fb1e3cf`) but different hashes, because upstream later
rewrote its history. As a result, `git merge-base origin/main upstream/main`
finds nothing, and `git log upstream/main..origin/main` lists the whole history
(about 12,000 commits). To see the real divergence, compare against the fork
point:

```bash
git log --oneline a07fc1f942..origin/main            # fork-only commits
git diff --stat a07fc1f942 origin/main               # files changed by the fork
git log --oneline fd3f6ff32c..upstream/main | wc -l  # upstream commits we don't have
```

Before this guide was added (at `424b4691ff`), the fork had 23 commits of its
own touching 27 files, and upstream was 2550 commits ahead (2026-11-01). The
guide's own commit adds `FORK.md` and changes `AGENTS.md`, so the first two
counts are now higher.

### 1. Revotech target profiles (config)

`config/target-repositories.json` gains three entries:

- **A `repositories[]` profile for `Revotech-Networks/revomind`.** Its checkout
  dir is `revomind`. Closing issues automatically is never allowed
  (`"issue": []`), and a PR may close only with `"implemented_on_main"`. The
  prompt note keeps security, billing, auth, deployment and customer-data work
  review-only.
- **A `generic_fallbacks[]` entry for owner `Revotech-Networks`.** It accepts any
  repo name matching `^[A-Za-z0-9_.-]+$` and allows no closures at all, so
  review and comment only.
- **`"Revotech-Networks"` in `target_inventory.owners`.**

Use it by passing our repo as the target. Every review command needs a local
checkout of the target and calls Codex:

```bash
pnpm run review -- --target-repo Revotech-Networks/revomind --target-dir ../revomind --batch-size 1 --artifact-dir artifacts/reviews
```

`review` is not read-only. Before Codex runs, it posts a public "review
started" comment on each selected issue or PR that doesn't have a ClawSweeper
comment yet. The comment goes out through `gh api` (`postReviewStartStatusComment`
in `src/clawsweeper.ts`). That needs a `gh` login, or `GH_TOKEN`, with write
access to the target. Run `review` against a Revotech repo only when Chris asks.

To check the profiles without calling Codex or GitHub (requires
`pnpm run build`):

```bash
node --input-type=module -e '
import { repositoryProfileFor } from "./dist/repository-profiles.js";
for (const r of ["Revotech-Networks/revomind", "Revotech-Networks/any-repo"])
  console.log(r, JSON.stringify(repositoryProfileFor(r).applyCloseRules));'
# Revotech-Networks/revomind {"issue":[],"pull_request":["implemented_on_main"]}
# Revotech-Networks/any-repo {"issue":[],"pull_request":[]}
```

Don't run `apply-decisions` or `apply-artifacts` against a Revotech repo unless
Chris asks. Those commands post comments and close items on GitHub.

### 2. Deploy jobs run only upstream (CI)

The `deploy` job in `.github/workflows/dashboard.yml` (Cloudflare dashboard
Worker) and in `.github/workflows/pages.yml` (docs site) has
`if: github.repository == 'openclaw/clawsweeper'`. On this fork both jobs show
as skipped. Without the guard, the fork would try to deploy OpenClaw's
dashboard and docs with credentials it doesn't have. (https://github.com/Revotech-Networks/clawsweeper/pull/17)

### 3. Correctness and security fixes (code)

Each fix ships with tests and is already active. None needs a flag.

| PR | What changed | Where | How it shows up |
| --- | --- | --- | --- |
| https://github.com/Revotech-Networks/clawsweeper/pull/16 | Post-flight merges are bound to the commit that was reviewed. | `src/repair/post-flight.ts` | The action must carry `commit` (40 hex). The merge is blocked with `pull request head does not match reviewed commit` if the head moved, and it always passes `gh pr merge --match-head-commit <commit>`. |
| https://github.com/Revotech-Networks/clawsweeper/pull/18 | Temporary repository gates restore their previous values. | `src/repair/temporary-repository-gates.ts`, used by `src/repair/requeue-job.ts` and `src/repair/self-heal-failed-runs.ts` | With `--open-execute-window` (or `--live`), `CLAWSWEEPER_ALLOW_EXECUTE` and `CLAWSWEEPER_ALLOW_FIX_PR` are set to `1` for the operation. Afterwards each one is restored to its earlier value, or deleted if it didn't exist. If restoring fails, an `AggregateError` is thrown. |
| https://github.com/Revotech-Networks/clawsweeper/pull/23 | Low-signal auto-close keeps the security guards. | `src/repair/apply-result.ts` (`validateLowSignalLiveState`), `src/repair/review-results.ts` | A security signal in the PR body, reviews or review comments now blocks a low-signal close with `security-sensitive target requires central security triage`. Other paths already used that message before the fork (for example, `post-flight.ts`). `MUTATING_ACTIONS` now reuses `CLOSE_ACTIONS` and `MERGE_ACTIONS`. |
| https://github.com/Revotech-Networks/clawsweeper/pull/33 | Repair-mode commands keep their order. | `src/repair/comment-router-core.ts` (`repairLoopControlBlockReason`), `src/repair/comment-router.ts` | When a person posts `/clawsweeper autofix` and later `/clawsweeper automerge` (or the reverse), the later command wins. The earlier one is skipped with `... was superseded by a later /clawsweeper <intent> command`. `/clawsweeper stop` still pauses both. |
| https://github.com/Revotech-Networks/clawsweeper/pull/7 | Hydration refuses overlapping paths before it deletes anything. | `scripts/hydrate-state.ts` | Throws `Hydration paths overlap: ...` when the state root and the worktree overlap, including through symlinks. |
| https://github.com/Revotech-Networks/clawsweeper/pull/9 | Each Codex review clears stale output first. | `src/clawsweeper.ts` (`runCodex`) | Deletes the earlier output file before Codex runs, so a failed run can't reuse the last decision. |
| https://github.com/Revotech-Networks/clawsweeper/pull/11 | The PR search during issue-implementation intake uses GET. | `src/repair/issue-implementation-intake.ts` | `gh api search/issues --method GET ...`. Without it, `-f` makes `gh` send a POST, which the search endpoint rejects. |

### 4. Simplifications and test fixes (no behaviour change)

- https://github.com/Revotech-Networks/clawsweeper/pull/8: `scripts/check-limits.ts` reuses the canonical limits instead of a copy.
- https://github.com/Revotech-Networks/clawsweeper/pull/22: `scripts/build-docs-site.mjs` uses its fixed config directly.
- https://github.com/Revotech-Networks/clawsweeper/pull/26: `src/clawsweeper.ts` drops `duplicateCanonicalLinkTexts`, which
  duplicated `duplicateCanonicalTexts`.
- https://github.com/Revotech-Networks/clawsweeper/pull/31: `src/limits.ts` loses its unused core worker-scheduler block.
- https://github.com/Revotech-Networks/clawsweeper/pull/3: `test/clawsweeper.test.ts` and `test/repair/target-fanout.test.ts` no
  longer depend on today's date or the live target inventory. Without this,
  baseline tests fail in the fork.

### 5. Fork-only docs

- `QA-HARDENING-REPORT.md` is the audit and hardening record: scope, findings,
  evidence and accepted counts.
- `FORK.md` (this file).
- The fork block at the end of `AGENTS.md`.

Open work: https://github.com/Revotech-Networks/clawsweeper/issues/14 with PR
https://github.com/Revotech-Networks/clawsweeper/pull/15 (bind cluster imports
to the selected repository), and
https://github.com/Revotech-Networks/clawsweeper/issues/28 (issue intake uses a
read-only token for workflow dispatch).

## Build, test and verify

You need Node 24 or newer (`engines.node` is `>=24`) and pnpm `10.33.2` (from
`packageManager`). Use Corepack when it works. If the `corepack` shim is broken
(for example, mise with no global Node set), run the pinned pnpm through
`npx`:

```bash
corepack enable && pnpm --version      # preferred
npx -y pnpm@10.33.2 --version          # fallback
```

With the fallback, replace `pnpm` with `npx -y pnpm@10.33.2` in each command
below, for example `npx -y pnpm@10.33.2 run check`. The scripts in
`package.json` call `pnpm` themselves, and that still works because pnpm puts
itself on `PATH` for the scripts it runs.

Install, build and run the full gate. CI runs this same gate as `pnpm check`.
Use `--frozen-lockfile` so the install fails if `pnpm-lock.yaml` is out of
date, instead of rewriting it:

```bash
pnpm install --frozen-lockfile
pnpm run build          # tsgo -p tsconfig.json -> dist/
pnpm run build:all      # adds the repair and dashboard builds
pnpm run check          # surface + limits + builds + lint + all tests + coverage + format check
```

Run the tests for a single fork change:

```bash
node --test test/hydrate-state.test.ts
pnpm run build:repair && node --test test/repair/temporary-repository-gates.test.ts test/repair/post-flight.test.ts test/repair/comment-router-core.test.ts test/repair/apply-result.test.ts
```

"Installing" means cloning and building: the worker PC runs
`bootstrap_openclaw_tools.sh`. Nothing else is installed or deployed.

Before you open a PR, run `pnpm run check`, then `pnpm run format` if the
format check fails. PRs target `main` on this fork, and we merge with
**squash**. Never open PRs against `openclaw/clawsweeper` from here.

## Sync from upstream

Upstream rewrote its history, so the usual fast-forward or plain
`git merge upstream/main` doesn't work:

- A fast-forward fails because there is no common ancestor.
- `--allow-unrelated-histories` treats every file as a conflict.

Instead, merge with the real fork point named explicitly. Do this on a branch
and land it through a PR:

```bash
git remote add upstream https://github.com/openclaw/clawsweeper.git 2>/dev/null
git remote set-url --push upstream DISABLED        # never push to upstream
git fetch upstream main && git fetch origin main

# Preview the merge without touching the worktree. Prints a tree id, then the conflicted files.
git merge-tree --write-tree --name-only --merge-base=fd3f6ff32c origin/main upstream/main

# Real merge in a throwaway clone. The graft re-parents our first fork-only commit
# (213617f230 "Add") onto upstream's fd3f6ff32c, so git finds the right merge base.
# Replace refs are never pushed, and in a separate clone they can't affect other worktrees.
git clone https://github.com/Revotech-Networks/clawsweeper.git /tmp/clawsweeper-sync && cd /tmp/clawsweeper-sync
git remote add upstream https://github.com/openclaw/clawsweeper.git && git fetch upstream main
git remote set-url --push upstream DISABLED
git replace --graft 213617f230 fd3f6ff32c
git merge-base origin/main upstream/main            # must print fd3f6ff32c...
git switch -c sync/upstream-$(date +%Y%m%d) origin/main
git merge upstream/main                             # resolve, then: pnpm install --frozen-lockfile && pnpm run check
git commit                                          # finish the merge
git replace -d 213617f230
git push origin HEAD                                 # then open a PR to main; merge it with a merge commit, not squash
```

Merge the sync PR with a **merge commit**. A squash merge drops the
`upstream/main` parent, and the next sync would hit the same problem again.
Don't use `git replace a07fc1f942 fd3f6ff32c`: it keeps the id `a07fc1f942`,
so git still can't see a shared commit and picks the older base `e3ebdc80ba`,
which gives 23 conflicts.

After the first merge lands, `upstream/main` is an ancestor of our `main`.
From then on, a plain `git merge upstream/main` (not `--ff-only`) on a sync
branch works, and the graft isn't needed again.

What to expect (a preview on 2026-11-01 showed 19 conflicted files):

- **`config/target-repositories.json`**: keep upstream's version and re-add our
  three entries from [section 1](#1-revotech-target-profiles-config).
- **`.github/workflows/dashboard.yml`, `pages.yml`**: merge cleanly. Check that
  each `deploy` job still has `if: github.repository == 'openclaw/clawsweeper'`.
- **modify/delete conflicts**: upstream split `src/repair/` into new modules.
  `apply-result.ts`, `post-flight.ts`, `issue-implementation-intake.ts`,
  `requeue-job.ts`, `review-results.ts`, `self-heal-failed-runs.ts` and their
  tests no longer exist upstream. For each fix in
  [section 3](#3-correctness-and-security-fixes-code), find where upstream moved
  the logic and check whether the bug is still there. Re-apply the fix only
  where it is, and take upstream's deletion.
- **`src/clawsweeper.ts`, `src/limits.ts`, `scripts/*.ts`,
  `src/repair/comment-router*.ts`**: content conflicts. Prefer upstream's
  structure and re-apply our change only if the behaviour is still missing.
- **Keep** `QA-HARDENING-REPORT.md`, `FORK.md` and the `<!-- fork:start -->`
  block in `AGENTS.md`. Update section 3 of this file to match whatever
  survives the sync.

Don't change upstream-owned docs (`README.md`, `CONTRIBUTING.md`, `docs/`,
`AGENTS.md` outside the fork block). Leaving them as-is keeps every sync free
of doc conflicts.

`revo-claude-worker/scripts/update_openclaw_forks.sh` runs
`merge --ff-only upstream/main`. That can't work for this repo, even after the
first merge lands: our `main` has commits upstream lacks, so a fast-forward is
never possible. Sync this fork with the PR flow above. Changing the updater is
a `revo-claude-worker` change, not a change in this repo.

## Upstream docs that still apply

For everything not listed above, follow the upstream docs. Read them with
these substitutions for this fork:

- **"Peter"** in `AGENTS.md` is the upstream maintainer. Here, Chris
  approves live apply or close commands and anything that touches secrets or
  deployment.
- **The `AGENTS.md` "GitHub Checks" probes** use `--repo openclaw/clawsweeper`.
  Use `--repo Revotech-Networks/clawsweeper` to check this fork's Actions.
- **`openclaw/clawsweeper-state`** and the dashboard state belong to
  upstream. This fork has no state repo, so ignore instructions to check it
  unless you're reading upstream's live data.

| Read | When |
| --- | --- |
| `AGENTS.md` | Always. It has the repo rules, the safety rules (no live apply or close unless asked) and the command list. |
| `README.md` "How It Works", "Local Run", "Checks" | You need the lanes, the CLI commands (`plan`, `review`, `apply-*`, `audit`, `reconcile`) or local run flags. |
| `README.md` "Maintainer Commands" | You're touching `/clawsweeper` comment commands or the command router. |
| `README.md` "GitHub Actions Setup" | You're wiring secrets, the GitHub App or the state repository. This fork has none of these. |
| `docs/target-repositories.md` | You're changing `config/target-repositories.json` or debugging `Unsupported target repo`. |
| `docs/limits.md` | You're changing concurrency, batch or shard limits (`src/limits.ts`, `scripts/check-limits.ts`). |
| `docs/scheduler.md`, `docs/orchestration.md` | You're changing review scheduling or the order workflows run in. |
| `docs/repair/README.md`, `docs/repair/operations.md`, `docs/repair/automerge-flow.md` | You're touching `src/repair/`: repair jobs, post-flight, automerge, gates. |
| `docs/pr-review-comments.md` | You're changing review comment markers or repair markers. |
| `docs/live-dashboard.md`, `docs/triage-dashboard.md` | You're touching `dashboard/` or the dashboard workflows. |
