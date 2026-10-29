# ClawSweeper audit and hardening report

Status: in progress. Two P1 repairs are merged and verified; their canonical
report publication completes when this report update merges. Coverage is partial.

## Scope and ownership

- Repository: `Revotech-Networks/clawsweeper`.
- Tracking issue: https://github.com/Revotech-Networks/clawsweeper/issues/1.
- Target: `main`.
- Starting target: `213617f23092562b3c2b7b879bd584d05aa0567b`.
- Last verified target: `d7c00a7da34208ce87c04e8614f30fb9271d3f55`.
- Start date: 2026-10-29 UTC.
- Accountable repository thread: `mcp:79b391bb-735c-4f22-b5c4-de62b5253e89`.
- Portfolio coordinator: `d4ba2482-746c-4bf0-a13d-667f3134c71f`.
- Coordinator branch: `audit/ponytail-20261029-c6fe948e`.

The audit includes tracked first-party source, tests, manifests, configuration,
workflows, prompts, schemas, and durable documentation at the starting revision.
The initial inventory has 271 tracked files. Generated state, dependencies,
build output, caches, and binary assets are excluded. No existing audit report,
issue, or pull request was found in the initial complete repository readback.
The checkout was clean and T3 listed no competing repository thread.

Excellence findings require demonstrated P0, P1, F0, or F1 impact. Verified
ponytail simplifications use the same ownership and evidence but have separate
counts. Fifty completed qualifying issues is a search target, not a quota.

## Product contract

ClawSweeper reviews repository issues, pull requests, and selected commits. It
stores durable Markdown decisions, synchronizes review comments, and applies
policy-allowed closures only after checking current GitHub state. Maintainer
commands can enter guarded repair and automerge workflows. The dashboard and
webhook expose status and acknowledge commands.

The critical boundaries are untrusted repository and comment content, read-only
model execution, separately authorized GitHub mutations, exact-head merge checks,
flat per-repository state records, and provider credentials. Review proposals
alone cannot authorize closure or repair. Interrupted jobs, stale snapshots,
locked issues, repeated delivery, and failed publication require safe recovery.

The inherited live targets and state store belong to OpenClaw. This sprint does
not deploy, run live apply or close commands, mutate upstream repositories, send
external notifications, or execute paid model work. Synthetic local checks do
not establish live GitHub App, Codex proxy, Cloudflare, or OpenClaw integration
acceptance. Those paths remain coverage gaps until an authorized test environment
is available.

## Baseline

Environment: Linux, Node `v26.12.1`, pnpm `10.33.2`. The existing cached pnpm
executable supplied the package manager. Repository dependencies were installed
with `pnpm install --frozen-lockfile --ignore-scripts`; no global installation
or privileged command was used.

`pnpm run check` at the starting revision passed active-source checks, automation
limit checks, all three builds, and all four lint commands. The unit stage passed
411 of 413 tests and failed these two assertions:

- `apply-decisions does not promote unrelated linked open PRs`.
- `apply-decisions does not promote unrelated linked merged PRs`.

Both reported `true !== false`: the helper retained Markdown F ratings despite D
front-matter overrides, activating stale-F policy as the fixtures aged. The
separate repair baseline passed 434/435 tests; its fanout fixture assumed two
owners while the repository inventory now has three. Baseline formatting passed.

The non-counting prerequisite https://github.com/Revotech-Networks/clawsweeper/issues/2
is repaired in https://github.com/Revotech-Networks/clawsweeper/pull/3 at
`141f62fe6a452a0babcf370727d0a74b742de06d`. Focused tests passed 3/3 and full
`pnpm run check` passed: 413 unit tests, 435 repair tests, 848 combined coverage
tests, builds, lint, coverage thresholds and formatting. Independent adversarial
review approved that exact head with no blockers. Hosted Code/Security review,
CI run `40825105092`, and CodeQL run `40825107883` passed. The normal squash merge
is `c2a974610455ae15e7724f70f256a8108b67fe6c`; its fetched tree matches the
verified head and all three affected regressions pass. Issue 2 is closed.
No deployment workflow was dispatched.

## Coverage

| Area                                                      | Current evidence                                                                                                                        | Remaining work                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Core sweeper, CLI, profiles, review and apply guards      | Discovery complete for named support modules and targeted main/test sections; baseline diagnosed                                        | Reproduce safety candidates and complete main-file coverage             |
| Repair, automerge, persistence, interruption and recovery | Discovery and independent validation of selected mutation boundaries; bounded intake, import, planner and result-review slices complete | Runtime proofs, remaining large-file sections and notification coverage |
| Dashboard, webhook, operator UI and API                   | Dashboard/webhook source discovery complete; no admitted P1                                                                             | Policy-drift proof, browser/accessibility and bounded-load coverage     |
| Workflows, actions, configuration and scripts             | Root owns inspection; remote triggers and credential names checked                                                                      | Complete source and delivery-effect assessment                          |
| Documentation, prompts, schemas and tests                 | Included with owning implementation slices                                                                                              | Resolve material contradictions and record rejections                   |
| Live provider and production journeys                     | Not executed                                                                                                                            | Authorized non-production provider environment required                 |

Each worker has read-only ownership. The root owns candidate admission,
deduplication, issue publication, Git, report edits, reviews, integration, and
merges. No worker may run live automation or claim acceptance.

Recorded full source reads include the core support modules for arguments, text,
command execution, Codex environment, commit checks/classification/sweeping,
GitHub JSON/retries, limits, PR coverage proof/surface statistics, repository
profiles and stable JSON. The large `src/clawsweeper.ts` and its test file received
targeted inspection; neither has complete line-by-line coverage.

Repair coverage includes complete reads of the planner, result reviewer, worker,
configuration, shared library, security signals, target validation, source-PR
checkout, Git publication, capacity, temporary-gate helpers, post-flight and
selected execution policies. The latest intake slice read commit-finding,
issue-implementation, spam-comment, Gitcrawl cluster and low-signal importers,
job creation/intent and security-boundary modules. Both repair schemas and all
five repair prompts were read. Large executor, applicator and comment-router
files remain partially inspected, as do most notification renderers and tests.

Both dashboard files and their assigned tests/scripts were read, along with the
hydrator, limits checker and setup-state action. Associated documentation was
read selectively. Browser/accessibility, bounded load, deployment network
controls and actual provider journeys remain unverified. Unlisted files and
unread sections of tracked first-party files remain coverage gaps; the inventory
alone is not evidence of inspection. No completed unchanged audit is repeated.

## Delivery boundaries

Live metadata shows Actions enabled, 23 active workflows, no repository secrets,
no inherited organization secrets, no repository variables, and no environments.
No settings other than enabling the repository's Issues feature were changed.

`pages.yml` deploys on main changes to `docs/**`, its workflow, or the docs build
script. `dashboard.yml` deploys on main changes to dashboard code, package files,
its workflows, and selected dashboard scripts. These paths need an explicit
delivery resolution before a push, PR, or merge could trigger deployment.
Ordinary source, test, and top-level report changes do not match those filters.

Issue and PR events also trigger the GitHub activity workflow. Its hook requires
a URL, token, and Discord target; all are absent in the inspected repository and
organization metadata. The hook resolver returns no configuration when any is
missing. No external notification is authorized by this sprint.

## Findings and disposition

Accepted excellence findings:

- P1: https://github.com/Revotech-Networks/clawsweeper/issues/4 — local hydration
  paths can overlap and erase source state before reporting success. Synthetic
  CLI reproductions and independent source review establish the cause. Defaults
  are safe; no remote or production state loss is claimed. Root owns
  `fix/4-hydration-overlap` in its isolated worktree. Candidate
  `08441db842062768328824a40f5136ddfd9649b7` passed its full check, but hosted
  review found a P1 omission: canonical-only checks permit deleting a symlink
  needed to reach an external source. That head was not merged. Correction 1
  retains lexical, canonical and intermediate source access paths; the original
  issue, PR and correction history remain intact. Corrected head
  `1b9fd6fdc3fb351152540544cc6f3ae13abbcaea` in
  https://github.com/Revotech-Networks/clawsweeper/pull/7 includes current main.
  Real CLI tests pass for eight unsafe and four supported layouts, including
  chained aliases. The new regression fails on the previous candidate. Focused
  lint, formatting and diff checks pass. Fresh CI run `40832904622`, CodeQL run
  `40832907727` and both hosted review components are running. Merge and
  fetched-target verification remain pending; earlier gates do not approve this
  correction.
- P1: https://github.com/Revotech-Networks/clawsweeper/issues/6 — a review that
  writes no decision can reuse a previous decision as current. The actual
  production-function reproduction returned an old close decision after a
  synthetic invocation exited 1 without writing. Candidate
  `3187139b1683bdf08704d35613bc4de218cd3dc4` in `fix/6-fresh-review-output`
  clears only the prior scratch output before launch. Three focused tests pass:
  no-output exits 0 and 1 reject old output, while fresh output from a nonzero
  exit remains accepted. Core build and formatting pass.
  https://github.com/Revotech-Networks/clawsweeper/pull/9 is merged.
  Full `pnpm run check` passed, including 415 unit, 435 repair and
  850 combined coverage tests, with zero failures or cancellations. CI run
  `40828017798` and CodeQL run `40828020362` passed at that exact head. Hosted
  Code/Security review completed without findings. Normal squash merge
  `d7c00a7da34208ce87c04e8614f30fb9271d3f55` retains the exact reviewed source
  and test files. Fresh compilation on fetched main and all three affected
  regressions pass; integration also passes all 16 intake tests and the limits
  checker. Issue 6 is closed.
- P1: https://github.com/Revotech-Networks/clawsweeper/issues/10 — both enabled
  issue-implementation intake kinds abort before job creation because the PR
  search uses POST instead of GET. Independent validation confirmed the supported
  caller chain and impact; production feature-flag state is not claimed. Candidate
  `ea5483516f1a21e97edb929cfa332b6c107c7e41` in
  https://github.com/Revotech-Networks/clawsweeper/pull/11 adds explicit GET to the
  existing call. Fresh source compilation and all 16 intake tests pass, including
  both kinds preparing a job/audit, blocking duplicates and blocking search errors.
  The two new regressions fail on freshly compiled baseline source. Focused lint,
  format and diff checks pass. Full CI run `40831230107` passed: 413 unit,
  437 repair and 850 combined coverage tests, with zero failures/cancellations.
  CodeQL run `40831233304` passed and hosted Code/Security review completed without
  findings at that head. Normal squash merge
  `a716ebedf76d10ba6c18d06286d0d85dbc9b802e` has the same fetched tree as the
  tested head. Fresh merged-source compilation, all 16 intake tests and the limits
  checker pass. Issue 10 is closed.

Accepted ponytail finding:

- https://github.com/Revotech-Networks/clawsweeper/issues/5 — reuse canonical
  automation-limit derivation in the documentation checker. Independent
  validation supports the duplication finding; 28 synthetic configurations
  produced matching values. Candidate `2a281e7e562c4f975b1ac6050bd56b2eddd9a205`
  in `fix/5-canonical-limits` removes 70 duplicated lines and adds one import.
  The unbuilt CLI succeeds on current documentation; original and candidate both
  reject synthetic derived-value and additional-config-field documentation drift.
  Focused lint/format checks pass.
  https://github.com/Revotech-Networks/clawsweeper/pull/8 is merged.
  Full `pnpm run check` passed, including 413 unit, 435 repair and
  848 combined coverage tests, with zero failures or cancellations. CI run
  `40828008840` and CodeQL run `40828011678` passed at that exact head. Hosted
  Code/Security review completed without findings. Normal squash merge
  `f154849dc1abb6d6299b803370fbd910dbfe46de` has the same fetched tree as the
  reviewed head. On the merged revision, the unbuilt CLI passes unchanged docs
  and rejects both derived-value and extra raw-config-field drift in disposable
  fixtures. Issue 5 is closed. No current correctness mismatch or excellence
  classification is claimed.

Other safety candidates remain unadmitted pending runtime proof and appropriate
disclosure handling. Targeted source reviews do not establish full coverage.
GitHub reports two critical Tinypool dependency alerts through the development
formatter; application reachability and severity are not yet established here.
No dependency update is admitted solely from those labels.

Planner/result-schema and intake/import discovery completed their bounded slices;
their remaining candidates still need runtime proof and admission. The admitted
intake transport reproduction used the production preparation CLI and installed
GitHub CLI against a loopback mock with a synthetic token and isolated config.
Both enabled intake kinds sent POST to the GET search endpoint and aborted before
job creation. Adding explicit GET in the disposable candidate restored both kinds
and retained the duplicate-PR blocker. Initial proof used prior compiled output;
subsequent fresh source compilation and committed CLI regressions establish
candidate build provenance. One independently validated
P1 has separate private draft-advisory tracking; its sensitive evidence and repair
design remain outside this public report. It has not completed a lifecycle. No
vulnerability-reporting setting or upstream resource was changed.

The portfolio owner is deciding whether two upstream-only deployment-job guards
may be added to this fork. Affected dashboard/docs delivery stays held; ordinary
source/test/script repairs continue. No guard edit is approved or implemented.
Large local suites have used the portfolio's finite capacity coordination;
candidate full checks ran in hosted CI. Focused compilation and CLI proofs were
bounded local work. No recurring resource watcher or competing updater was added.

Qualifying repairs merged, verified and closed: **2 P1**. Their final lifecycle
step is this report's repository merge; until that completes, completed qualifying
lifecycles remain **0**. P0, F0 and F1 completed counts are **0**.
Completed ponytail repairs: **1**. Merged repair/prerequisite PRs: **4**, comprising
two P1 repairs, the non-counting baseline prerequisite and the ponytail repair.
Closed non-counting baseline issues: **1**. Report-only PRs do not count as findings.

Open candidates, rejected leads, exact review heads, merged commits, and
post-merge verification will be recorded here as evidence becomes available.
The sprint is not exhausted, and the tracking issue remains open. The latest
paginated readback found open tracking issue 1 and hydration issue 4, with PR7
awaiting corrected-head gates; issues 2, 5, 6 and 10 are closed after verification.
PRs 3, 8, 9 and 11 are merged. The private finding remains open in private tracking.
