# ClawSweeper audit and hardening report

Status: in progress. Source delivery: **6 P1 repairs and 3 Ponytail repairs are
MERGED + TARGET-VERIFIED**. Accepted completed lifecycles are **3 P1 and
2 Ponytail**. The accepted P1 repairs remain:

- https://github.com/Revotech-Networks/clawsweeper/pull/18.
- https://github.com/Revotech-Networks/clawsweeper/pull/16.
- https://github.com/Revotech-Networks/clawsweeper/pull/23.

The separate Ponytail simplifications are:

- https://github.com/Revotech-Networks/clawsweeper/pull/22.
- https://github.com/Revotech-Networks/clawsweeper/pull/26.

P0, F0, and F1 remain zero.

The historical 3 P1 repairs and 1 Ponytail repair remain withheld because their
mandatory exact-head PR-associated CI/CodeQL receipts are absent. Their prior
completion claims remain superseded. New PR-event evidence does not restore
those counts. Coverage remains partial; the sprint is not exhausted.

## Scope and ownership

- Repository: `Revotech-Networks/clawsweeper`.
- Tracking issue: https://github.com/Revotech-Networks/clawsweeper/issues/1.
- Target: `main`.
- Starting target: `213617f23092562b3c2b7b879bd584d05aa0567b`.
- Last fetched target: `e3e53ccc93fe67e34eab7e855697e1261a3bd05f`.
- Start date: 2026-10-29 UTC.
- Accountable repository thread: `mcp:79b391bb-735c-4f22-b5c4-de62b5253e89`.
- Portfolio coordinator: `d4ba2482-746c-4bf0-a13d-667f3134c71f`.
- Coordinator branch: `audit/report-workflow-coverage-20261029`.

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
verified head and all three affected regressions pass.
https://github.com/Revotech-Networks/clawsweeper/issues/2 is closed.
No deployment workflow was dispatched.

## Coverage

| Area                                                      | Current evidence                                                                                                                        | Remaining work                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Core sweeper, CLI, profiles, review and apply guards      | Full main-file source and named support modules inspected; targeted tests and baseline assessed                                        | Reproduce retained safety candidates and assess remaining tests/docs             |
| Repair, automerge, persistence, interruption and recovery | Full executor, apply, router, notifier, publisher and assigned lifecycle/mechanical helper source reads | Runtime proofs and remaining helper, test and documentation coverage |
| Dashboard, webhook, operator UI and API                   | Dashboard/webhook source discovery complete; no admitted P1                                                                             | Policy-drift proof, browser/accessibility and bounded-load coverage     |
| Workflows, actions, configuration and scripts             | All 23 tracked workflow files read, with selected setup actions and real CLI callers | Runtime delivery effects and unlisted actions, configuration and scripts |
| Documentation, prompts, schemas and tests                 | Included with owning implementation slices                                                                                              | Resolve material contradictions and record rejections                   |
| Live provider and production journeys                     | Not executed                                                                                                                            | Authorized non-production provider environment required                 |

Discovery workers have read-only ownership; implementation workers have bounded
source/test ownership in isolated checkouts. The root owns candidate admission,
deduplication, issue publication, Git, report edits, reviews, integration, and
merges. No worker may run live automation or claim acceptance.

Recorded full source reads include the core support modules for arguments, text,
command execution, Codex environment, commit checks/classification/sweeping,
GitHub JSON/retries, limits, PR coverage proof/surface statistics, repository
profiles and stable JSON. The continuation completed a continuous read of
`src/clawsweeper.ts` lines 1 through 16,902 at `083f350b`, followed by inspection
of the reviewed helper-reuse delta. Its large test file still has targeted
source coverage only.

Repair coverage includes complete reads of the planner, result reviewer, worker,
configuration, shared library, security signals, target validation, source-PR
checkout, Git publication, capacity, temporary-gate helpers, post-flight and
selected execution policies. The latest intake slice read commit-finding,
issue-implementation, spam-comment, Gitcrawl cluster and low-signal importers,
job creation/intent and security-boundary modules. Both repair schemas and all
five repair prompts were read. The continuation completed the executor,
applicator, both comment-router files, and all five notification modules.
Matching apply/router and notification tests were read within their declared
packages. Later source-only packages completed the eight publisher modules and
eleven lifecycle helpers; the root completed nine mechanical helpers and the
workflow utility module. Exact ranges remain in the continuation records.
Unlisted helpers, tests and documentation remain unassessed.

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
its workflows, and selected dashboard scripts. Chris approved upstream-only
conditions on both entire deploy jobs. The exact two-line change merged in
https://github.com/Revotech-Networks/clawsweeper/pull/17 from
`16fad4abcfdf3786b95359cc23e5eff94c6ba607` as
`588cb4c0723affbd9d41b75dee7c4fbcec8fd465`. Both conditions are now on main.
Other publication workflows and already-running jobs are outside this guard.
Fresh premerge inventories had no in-flight runs for either workflow. On the
merged commit, Pages run `40906651429` and dashboard run `40906651337` each
completed as skipped; both deploy jobs had zero steps. No preparation, upload,
secret synchronization or deployment ran in those jobs. Nonpublishing docs
generation on fetched main passed for 22 pages; existing CI retains dashboard
compilation and tests. Ordinary source, test, and top-level report changes do
not match those deploy filters.

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
  lint, formatting and diff checks pass. Fresh CI run `40832904622` passed
  417 unit, 437 repair and 854 combined coverage tests with zero failures or
  cancellations. CodeQL run `40832907727` and both hosted review components passed
  at the corrected head. The original P1 thread was resolved with the fix/proof
  linked; its history remains retained. Normal squash merge
  `c150e001ed26d6f8e07928a553613c7932bed000` has the same source, tests, scripts
  and configuration as that head, plus the already published QA report. All twelve
  layout scenarios and the limits checker pass on fetched main.
  https://github.com/Revotech-Networks/clawsweeper/issues/4 is closed.
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
  checker. https://github.com/Revotech-Networks/clawsweeper/issues/6 is closed.
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
  checker pass. https://github.com/Revotech-Networks/clawsweeper/issues/10 is closed.

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
  fixtures. https://github.com/Revotech-Networks/clawsweeper/issues/5 is closed.
  No current correctness mismatch or excellence classification is claimed.

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

Large local suites have used the portfolio's finite capacity coordination;
candidate full checks ran in hosted CI. Focused compilation and CLI proofs were
bounded local work. No recurring resource watcher or competing updater was added.

## CI provenance correction and acceptance

The portfolio disposition on 2026-10-29 preserves **3 P1 repairs and 1 Ponytail
repair as MERGED + TARGET-VERIFIED**, but withholds all four from full-lifecycle
completion totals. Accepted lifecycles from that historical cohort remain
**0 P1 and 0 Ponytail**;
P0, F0 and F1 remain **0**. Merges, issue closures, source reviews, fetched-target
proofs and hydration correction 1 remain valid historical evidence.

The previous report statement, "Completed qualifying lifecycles are 2, becoming
3 when this update merges," and its "Completed ponytail repairs: 1" claim are
explicitly **superseded**. The tracker subsequently claimed three completed P1
lifecycles and one completed Ponytail repair; that claim is also superseded.
Publication of the earlier reports did not supply the missing CI association.

One bounded reconciliation read complete paginated live Actions inventories at
seven historical final heads and their merge commits. Applicable workflows are
**CI `287502882`** and **CodeQL `287502883`**. Both declare `pull_request` triggers
at every inspected head. The required exact-head PR-event receipts were absent,
and no applicable hosted-CI exception is documented. Docs-only source-review
classification does not waive this CI requirement.

| PR                                                       | Role                       | CI run        | CodeQL run    | Returned event evidence                                 |
| -------------------------------------------------------- | -------------------------- | ------------- | ------------- | ------------------------------------------------------- |
| https://github.com/Revotech-Networks/clawsweeper/pull/7  | P1 hydration, correction 1 | `40832904622` | `40832907727` | Both successful `workflow_dispatch`; no matching PR run |
| https://github.com/Revotech-Networks/clawsweeper/pull/8  | Ponytail limits reuse      | `40828008840` | `40828011678` | Both successful `workflow_dispatch`; no matching PR run |
| https://github.com/Revotech-Networks/clawsweeper/pull/9  | P1 fresh review output     | `40828017798` | `40828020362` | Both successful `workflow_dispatch`; no matching PR run |
| https://github.com/Revotech-Networks/clawsweeper/pull/11 | P1 intake GET              | `40831230107` | `40831233304` | Both successful `workflow_dispatch`; no matching PR run |
| https://github.com/Revotech-Networks/clawsweeper/pull/3  | Non-counting baseline      | `40825105092` | `40825107883` | Both successful `workflow_dispatch`; no matching PR run |
| https://github.com/Revotech-Networks/clawsweeper/pull/12 | Non-counting report        | `40833310467` | `40833313214` | Both successful `workflow_dispatch`; no matching PR run |
| https://github.com/Revotech-Networks/clawsweeper/pull/13 | Non-counting report        | None returned | None returned | No exact-head runs returned                             |

These **12 successful manual runs and 18 successful jobs** remain actual execution
evidence. Their `pull_requests` arrays are empty; none is relabeled as PR-event
evidence. Deleted or inaccessible historical evidence cannot be reconstructed.
The exact final heads, merges, source reviews and target proofs above remain
unchanged. The first report merge is `9fe84bb477d48f22b132e71b63b2d1c7e1db2a5a`,
with fetched-tree equality and 852 combined-source tests recorded. The second
report merge is `1763e12c38889105b513554b6db1318d39ec954f`. Report-only PRs and the
baseline prerequisite remain non-counting.

No historical repair is being reopened, repushed or rerun for this correction.
Normal PR-associated validation on a legitimate current candidate can establish
prospective integrated-state proof; it cannot retroactively change old events
or automatically restore historical completion counts. Once normal event
delivery is established, the root will submit a concrete corrective-acceptance
proposal to the portfolio owner. This local report correction will be published
only through normal applicable gates.

The accepted repository-binding finding
https://github.com/Revotech-Networks/clawsweeper/issues/14 is in
https://github.com/Revotech-Networks/clawsweeper/pull/15 at
`345f80ac9a506521f46f739475104673f22a873f`. Its full local check passed 417 unit,
461 repair and 878 combined coverage tests. Hosted Code/Security review passed;
manual CI run `40845731628` and CodeQL run `40845735014` also succeeded. Matching
PR-event runs remain absent, so merge and fetched-target acceptance are held.
Two unchanged-head close/reopen attempts produced no matching runs. No third
unchanged retrigger, settings change or CI waiver is authorized.

Open candidates, rejected leads, exact review heads, merged commits, and
post-merge verification will be recorded here as evidence becomes available.
The sprint is not exhausted, and the tracking issue remains open. Paginated live
readback and individual closeout state show these issues closed after verification:

- https://github.com/Revotech-Networks/clawsweeper/issues/2.
- https://github.com/Revotech-Networks/clawsweeper/issues/4.
- https://github.com/Revotech-Networks/clawsweeper/issues/5.
- https://github.com/Revotech-Networks/clawsweeper/issues/6.
- https://github.com/Revotech-Networks/clawsweeper/issues/10.

The corresponding merged pull requests are:

- https://github.com/Revotech-Networks/clawsweeper/pull/3.
- https://github.com/Revotech-Networks/clawsweeper/pull/7.
- https://github.com/Revotech-Networks/clawsweeper/pull/8.
- https://github.com/Revotech-Networks/clawsweeper/pull/9.
- https://github.com/Revotech-Networks/clawsweeper/pull/11.
- https://github.com/Revotech-Networks/clawsweeper/pull/12.
- https://github.com/Revotech-Networks/clawsweeper/pull/13.

https://github.com/Revotech-Networks/clawsweeper/issues/14 and
https://github.com/Revotech-Networks/clawsweeper/pull/15 remain open and uncounted.
Unapproved private findings remain in private tracking.
The approved Pages/dashboard guard is merged and verified as described above;
other disclosure decisions and publication workflows remain separate.
Unadmitted candidates and incomplete coverage remain root-owned; no audit
exhaustion is claimed.

## Current approved source delivery

The following source candidates are public after separate authenticated owner
visibility decisions. Their private tracking and reproductions remain private.
https://github.com/Revotech-Networks/clawsweeper/pull/18 completed its lifecycle
through report https://github.com/Revotech-Networks/clawsweeper/pull/19,
which merged as
`369d0bf9b2913569d3c677ed6c5cedc75b836724` from
`831dadf50da487880e0c981b4507917ccd5bd5bd`, after genuine PR-associated CI
`40901495002` and CodeQL `40901495190` passed. Its fetched tree equals the
verified candidate. This completes the report obligation for
https://github.com/Revotech-Networks/clawsweeper/pull/18 and restores no historical
count.

- https://github.com/Revotech-Networks/clawsweeper/pull/16 — exact head
  `840c4ce88690788fcc127073dc647237238f4f70`; approved source and wording unchanged.
  Local full check passed 862 combined tests. Hosted Code/Security review completed
  with no posted finding; the initial CI observation had no matching PR runs.
- https://github.com/Revotech-Networks/clawsweeper/pull/18 — exact head
  `3714cf63ee2b1bcbad4221499a8062a4a79374ba`; approved source and wording unchanged.
  Local full check passed 927 combined tests and focused tests passed 73/73.
  Ordinary scope readiness passed with a recorded current root disposition,
  preserving the measured 558-line footprint and original correction history.
  Hosted Code/Security review and genuine PR-associated CI `40898512824` and
  CodeQL `40898512806` passed on the exact head. The normal squash merge is
  `df1a924d794d42995a9a7872e1ab3ef9d3f137c1`; its fetched tree is identical to the
  reviewed candidate. Fresh repair compilation and all 73 focused regressions
  pass on that merged source, with zero failures, cancellations or timeouts.
  Private tracking is closed as remediated and remains unpublished. The unrelated
  notification job was cancelled before any steps because a newer activity request
  superseded it; GitHub's annotation confirms the repository concurrency group.

The noncounting guard https://github.com/Revotech-Networks/clawsweeper/pull/17
passed genuine `pull_request` CI `40897169396`
and CodeQL `40897169703`, bound to its exact head and PR number. Code/Security
review completed with no posted finding. The fetched merge tree matches the
premerge integration calculation, and both workflow files retain the exact
reviewed bytes. The only changes from its prior main are the two job conditions.
A fresh nonpublishing docs build passed in 0.152 seconds and generated 30 files.
These are prospective receipts, not replacements for historical manual runs.

https://github.com/Revotech-Networks/clawsweeper/pull/16 initially lacked matching
PR-associated CI and CodeQL runs. Its single
separately authorized unchanged-head close/reopen recovery succeeded. The
original missing-run evidence remains retained; the recovery and final delivery
are recorded below. The existing event-delivery stop for
https://github.com/Revotech-Networks/clawsweeper/pull/15 remains unchanged. No
further retrigger, manual-dispatch equivalence, settings change, or CI waiver
is inferred.

## Verified merge wave on 2026-10-29

The root reconciled all posted reviews, conversation comments, inline comments,
and review threads before each merge. Hosted Code and Security reviews completed
without findings on all three exact heads. Genuine `pull_request` CI and CodeQL
runs passed for the corresponding PR and head. Normal expected-head squash
merges preserved repository controls. No source correction was required.

| PR | Exact reviewed head | CI run | CodeQL run | Merge commit |
| --- | --- | --- | --- | --- |
| https://github.com/Revotech-Networks/clawsweeper/pull/16 | `840c4ce88690788fcc127073dc647237238f4f70` | `40908210113` | `40908210319` | `76e329ff65dd4fcbd0ebbc1ef04b525dd7c8e126` |
| https://github.com/Revotech-Networks/clawsweeper/pull/23 | `bbf2160cadfc07c99558b498c2bdfeb7c043ee61` | `40910606946` | `40910606638` | `4cfc7fb5da34a17211fd0dad99ffcb2e8b59e113` |
| https://github.com/Revotech-Networks/clawsweeper/pull/22 | `44d6cd1492dbc10630f4037417d908cc21a098e3` | `40909565424` | `40909565201` | `6bc6e7e07513817bb1806ed0d3dc6a58f5d3201a` |

https://github.com/Revotech-Networks/clawsweeper/pull/16 validates repair
finalization metadata. Its source and test files on fetched main match the reviewed
bytes. The complete fetched tree equals the premerge
integration calculation. Fresh `tsgo -p tsconfig.repair.json` compilation passed,
followed by all 12 tests in `test/repair/post-flight.test.ts`.

The first focused run used a scratch TMPDIR inside the repository, so its fake
CommonJS executables inherited the repository's ESM setting. An explicit
CommonJS package boundary in that scratch directory corrected the setup.
The failed log remains retained. No source changed, and the corrected run passed
12 tests in 1.416 seconds with no failures, cancellations, or timeouts.

https://github.com/Revotech-Networks/clawsweeper/pull/23 aligns low-signal policy
checks. All four changed source and test files on fetched main match the reviewed
bytes, and the complete tree equals the calculated
integration. Fresh repair compilation passed. This command passed all 64 tests
on the merged source in 41.528 seconds:

```bash
node --test --test-concurrency=1 test/repair/apply-result.test.ts test/repair/review-results.test.ts test/repair/post-flight.test.ts
```

Those tests include the 52 reviewer and applicator cases and all 12 post-flight
cases. The run had zero failures, cancellations, and timeouts. Peak child RSS
was 150,180 KiB. Private tracking for
https://github.com/Revotech-Networks/clawsweeper/pull/16 and
https://github.com/Revotech-Networks/clawsweeper/pull/23 is closed as remediated and
remains unpublished. Private reproduction and impact details remain private.

https://github.com/Revotech-Networks/clawsweeper/pull/22 is the Ponytail `delete`
finding in
https://github.com/Revotech-Networks/clawsweeper/issues/21. It removes unused
docs-builder compatibility probes, with five added lines and 39 deleted lines.
Independent original and candidate builds in the same directory produced 30
byte-identical files totaling 1,106,414 bytes. The committed script matches that
experiment. Custom global injection is outside the documented caller contract.

On fetched merge `6bc6e7e07513817bb1806ed0d3dc6a58f5d3201a`, the builder matches
the reviewed bytes. `node scripts/build-docs-site.mjs` passed without publishing
in 0.118 seconds and generated 30 files with 22 unique canonical URLs. Its
1,106,416-byte output retains the existing cwd-derived title, which differs from
the independent fixture's directory name.
https://github.com/Revotech-Networks/clawsweeper/issues/21 is closed. This
simplification has no excellence severity and is counted separately.

The local commands were focused, sequential, and bounded. No new large local
suite or installer ran during the portfolio's finite hold. Each candidate's
required full `pnpm run check` passed in hosted CI. The existing upstream-only
deployment conditions remain unchanged. No live apply, deployment, workflow
dispatch, settings change, or additional event-recovery attempt was performed.

This report's delivery completes the documentation obligation for the three
newly verified repairs. It does not complete the repository audit.
https://github.com/Revotech-Networks/clawsweeper/pull/15 and
https://github.com/Revotech-Networks/clawsweeper/issues/14 retain their existing
owner and STOP condition. The remaining source,
live-provider, browser, accessibility, and load-test coverage gaps above remain
open under this repository root.


## Canonical-reference helper reuse and source coverage continuation

https://github.com/Revotech-Networks/clawsweeper/issues/25 records a Ponytail
`reuse` opportunity. Two private helpers had identical parameter types and
bodies. Both returned the same ordered text in a fresh array. Static comparison
and caller inspection established that the canonical-link caller could use the
existing `duplicateCanonicalTexts` helper.

https://github.com/Revotech-Networks/clawsweeper/pull/26 removed the duplicate
helper and changed its one caller. The source delta is one added line and
15 deleted lines in `src/clawsweeper.ts`, a net reduction of 14 lines. No test,
dependency, configuration, or automation policy changed.

The final head was `9c3cc5ce18c91919eb69416240ecf1ad60090870`. Automatic hosted
Code Review completed at 19:05:16 UTC and Security Review at 19:05:58 UTC, with
no posted findings. Complete comments, reviews, inline comments, and review
threads were reconciled before merge. Genuine `pull_request` CI run
`40936756006` and CodeQL run `40936755749` passed on that head with an actual
association to this pull request retained before merge. Hosted
`pnpm run check` passed builds, lint, formatting, 417 unit tests, 537 repair
tests, and 954 combined coverage tests, with no failures or cancellations.

The optional observer notification was cancelled before any step ran. Its
provider annotation records supersession by a higher-priority request in the
repository activity concurrency group. Required CI and CodeQL succeeded.
GitHub's aggregate merge status was `UNSTABLE` because of that observer result;
no cancelled check was called successful or retriggered. Current branch
protection returned "Branch not protected" and the ruleset list was empty.
The normal expected-head squash merge used no override.

The merge is `7fa2e7df9757ebe63f04c6a73474425d559be47b`. Its fetched whole tree
`f4effbda230be63f5d3e043dd3818625c3688862` equals the reviewed candidate tree,
and the source bytes match. Fresh target compilation passed, followed by all
eight existing duplicate/superseded close-comment regressions. Those tests
cover canonical references, multiple URLs, ambiguous shorthand, self-links,
and malformed URLs. No new test module was needed.

The successful local proof used the repository's standard build/config/test
layout. Compilation took 0.151 seconds and the focused test command took
0.110 seconds, each within a 20-second bound. The proof process observed a
cumulative child peak RSS of 109,592 KiB. Initial timing-tool and relocated
fixture setup failures were retained and corrected without a source change.
The tests used a deny-by-default fake GitHub command and no provider access.
The issue is closed and the merged pull request is confirmed unwatched. This
report's delivery completes its documentation obligation; the simplification
has no excellence severity.

Eight bounded source-only discovery packages completed during this continuation.
The root inspected each return and its cited caller/test controls. Continuous
reads cover the full main source at the pinned revision, the 4,088-line repair
executor, the 1,697-line applicator, the 2,045-line router core, the 3,385-line
router CLI, and all five notification modules. Associated tests were read as
reported by each package; this is not a claim of whole-test-suite source
inspection. The helper-reuse delta above was assessed separately after those
reads. No unchanged completed support-module audit was repeated.

The root also read the spam scanner and its core, matching core tests and
operating documentation, its workflow, the result-publication workflow, the
job-restoration script, and the setup actions named in the retained coverage
record. These source reads establish no live installation, provider, deployment,
browser, accessibility, or load-test result.

Lower-priority observations remain task notes without issues or repair pushes.
Other caller and authority leads remain unadmitted pending offline proof and
root classification. An independent offline CLI check substantiated one additional command-routing
P1. It is privately tracked pending a scoped repair. A subsequent merge attempt
was not observed because its synthetic follow-up stopped before merge
validation. That follow-up is not repeated, and no completed lifecycle is added.
The previously recorded maintainer-policy discrepancy and private disclosure
boundaries retain their existing dispositions.

Both open Tinypool alerts affect transitive development dependency `tinypool`
2.1.0 through `oxfmt` 0.47.0. The formatter reaches the affected pool calls,
but a separate prototype-pollution entry point into its parent process was not
established. Neither alert was admitted as a repository P1, dismissed, or used
to justify a dependency update. The upstream
[worker-option advisory](https://github.com/tinylibs/tinypool/security/advisories/GHSA-5gmw-xhrv-c9v3)
and [run-option advisory](https://github.com/tinylibs/tinypool/security/advisories/GHSA-85c8-ppgw-ccpr)
describe the required pollution prerequisite. Repository exploitability remains
unproved.

This continuation does not exhaust the audit. Unread first-party helpers,
scripts, actions, configuration, tests and documentation remain
root-owned coverage gaps, alongside the live-provider, browser, accessibility
and load journeys. https://github.com/Revotech-Networks/clawsweeper/pull/15 and
https://github.com/Revotech-Networks/clawsweeper/issues/14 remain stopped under
their existing owner and consumed recovery budget. No additional retry,
workflow dispatch, settings change, deployment or private disclosure is implied.

## Report delivery and remaining workflow assessment

https://github.com/Revotech-Networks/clawsweeper/pull/27 merged from
`5b96541b5190456e708b3763eb5d444970e15b21` to
`e3e53ccc93fe67e34eab7e855697e1261a3bd05f`. Genuine PR-associated CI
`40941522645` and CodeQL `40941522726` passed on that head. The report-only
change required no new source review; all posted feedback was reconciled
without findings. Its fetched whole tree
`be1f64b5091ffd51bd834bdc3b632db934abdbeb` equals the verified candidate tree.
Only this report changed, the full-URL convention and diff checks passed, and
the watch is off. That delivery completed the documentation obligation for
https://github.com/Revotech-Networks/clawsweeper/issues/25. Completed accepted
totals are now 3 P1 and 2 Ponytail; this further report update adds no count.

The subsequent source assessment uses that identical tree. Three more discovery
packages completed: publishers, review workflows and lifecycle helpers. The root
inspected their cited callers and countercontrols. A mechanical-helper child
failed before inspection because its model was at capacity. The declared stop
and drain policy was preserved; the root completed that failed scope directly,
without a replacement child or model retry. This brings completed discovery
packages in the continuation to eleven, plus the root's separate source reads.

Additional full source coverage includes eight publisher modules, eleven
lifecycle helpers, nine mechanical helpers (1,427 source lines and 740 matching
test lines), `workflow-utils.ts` (742 lines), five thin CLI/repository helpers
(125 lines), and the small environment, timing and JSON/domain type modules.
The root filled the unassessed ranges of `workflow-utils.test.ts`; combined with
the earlier same-source package, all 886 lines have been read. No test execution
is inferred from these reads.

All 23 tracked workflow definitions now have full source reads. The fourteen
newly assessed files contain 2,221 lines: the repair worker, comment router,
cluster intake, commit-finding intake, issue-implementation intake, self-heal,
CI, CodeQL, dashboard CI, dashboard deployment, Pages, Crabbox hydration,
maintainer activity report and spam-comment intake workflows. The other nine
were covered by retained packages and root inspection. Workflow bytes are
unchanged from the earlier assessed `083f350b` pin. This establishes source
coverage, including trigger, token, gate and CLI wiring; it establishes no live
dispatch, installation, publication, deployment or provider outcome.

The finalizer's finite open-PR scan, batch dispatch ledger persistence and job
cleanup during active runs remain unadmitted leads. Their material impact was
not established. Broken optional dashboard report links, commit-review capacity
underaccounting and unstaged-path fallback parsing remain lower-priority task
notes. No issue, repair or severity increase was justified for those notes.

## Reviewed-issue dispatch permission finding

P1: https://github.com/Revotech-Networks/clawsweeper/issues/28 records a distinct
failure after successful issue preparation. The reviewed-issue workflow selects
an App token explicitly granted Actions read for its `gh workflow run` call.
That call requires Actions write under the
[GitHub workflow-dispatch contract](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).
Once eligibility, successful job publication, active-worker and capacity gates
permit dispatch, this credential cannot authorize the automatic worker launch.
The strict-bug and vision-fit intake paths share that dispatch step. Current
production enablement, a live incident and an actual HTTP failure are not
claimed.

The root deduplicated all 27 current issue/PR records and the existing private
finding identities before recording the new lead. An independent source-only
check confirmed the workflow, dispatcher, repository resolution, credential
selection and caller controls. The source and provider contract prove the
permission mismatch; no live or mocked dispatch ran. The earlier GET-search
repair in https://github.com/Revotech-Networks/clawsweeper/issues/10 and
https://github.com/Revotech-Networks/clawsweeper/pull/11 addressed preparation,
with its own accepted job/audit/output criteria. This later dispatch defect
does not reset that issue's identity, disposition or correction history.

An unapplied two-line proposal selects the existing current-repository
`GITHUB_TOKEN` for dispatch and grants that token Actions write. The owner-scoped
App token would keep Actions read. GitHub documents `workflow_dispatch` as an
exception that can create workflow runs from `GITHUB_TOKEN` in its
[workflow-trigger guidance](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow).
The proposal still expands token authority. The existing sprint grant excludes
permission changes, so implementation awaits a separate scoped human decision
owned by the portfolio coordinator. No product source, permission, credential,
App installation or setting changed; no repair PR or live dispatch exists for
this finding. The issue remains open and incomplete, with zero count credit.

The separately tracked private command-routing repair is frozen and unpublished
pending its own source/test visibility decision. The coordinator's read-only
prepublication consultation completed without a blocking finding; it provides
no formal PR review or hosted CI credit. These two decisions are separate, and
neither reuses an earlier candidate's approval. Private reproduction, impact and
advisory details remain private.

The last complete live readback at 20:06 UTC found 17 of 18 linked sprint pull
requests merged and only https://github.com/Revotech-Networks/clawsweeper/pull/15
open. https://github.com/Revotech-Networks/clawsweeper/issues/28 was subsequently
opened and the tracker updated. The stopped pull request and
https://github.com/Revotech-Networks/clawsweeper/issues/14 retain their owner,
spent recovery budget and STOP. No new recovery pair, permission waiver, manual
workflow dispatch, deployment or large local job follows from this report.
Remaining source, live-provider, browser/accessibility, load and final integration
obligations prevent an exhaustion or completed-sprint verdict.
