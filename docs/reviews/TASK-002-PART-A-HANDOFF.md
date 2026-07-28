# TASK-002 Part A — Compact Claude Handoff

**Full review:** `docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md` (includes post-review re-verification of `ba2b5f3`)
**Decision:** APPROVED WITH FOLLOW-UP → follow-ups closed and independently re-verified

## 1. Task Objective

Close TASK-001's five carried-forward findings (F-1–F-5): the `packages/core` purity boundary (ADR-0001's binding mitigation), CI token permissions, Dependabot major-version hygiene, and confirmation of TASK-001's CI conclusion. No database, auth, or product code in scope.

## 2. Commit Hash

`a5f7def` — _fix: harden repository boundaries and CI controls_ (reviewed commit)
`ba2b5f3` — _fix: close Part A boundary follow-ups before database work_ (post-review, independently re-verified — see full review's Post-Review Note)

## 3. Files Changed

`packages/config/eslint/core.js` · `packages/core/src/purity.test.ts` · `.github/dependabot.yml` · `.github/workflows/ci.yml` · `package.json` / `apps/web/package.json` (`@types/node` pin) · `docs/TESTING.md` · `docs/status/CURRENT_STATUS.md` · `CHANGELOG.md` · `KNOWN_LIMITATIONS.md`. No `packages/db`, no schema, no auth — confirmed by inspecting the diff, not assumed.

## 4. Findings F-1–F-5 and Resolution

| #   | Finding                                                 | Resolution                                                                       |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| F-1 | Dynamic `import()` invisible to `no-restricted-imports` | `no-restricted-syntax` added on `ImportExpression`/`require()` call selectors    |
| F-2 | Bare Node builtins outside a hand-written list uncaught | Builtins enumerated from `module.builtinModules` at config load, not hand-listed |
| F-3 | Dependabot unconstrained on majors — 12 PRs open        | `ignore` on semver-major for the toolchain; `groups` added; PR limit 10→5        |
| F-4 | CI workflow had no `permissions:` block                 | `permissions: contents: read` at workflow level                                  |
| F-5 | TASK-001's CI run #1 conclusion unconfirmed             | Fetched directly: run `30341374040`, commit `a5655a7`, conclusion **success**    |

Two new findings surfaced by adversarial probing (not requested, found by testing beyond the spec): **A-1** (unanchored selector regex caused false positives on `./costs`, `./path-utils`) and **A-2** (`@aipro/db` and other workspace I/O packages were not banned, leaving ADR-0001's boundary open exactly where TASK-002 Part B creates the gap). Both were fixed on `ba2b5f3` and independently re-verified — see §7.

## 5. Verification Commands

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Plus reviewer-authored adversarial ESLint probes (written, run, deleted — not reused from any implementation report): banned forms (static/dynamic/`require`/`export from`, every builtin, workspace packages) must error; permitted forms (relative imports, `@aipro/types`) must not.

## 6. Final Command Results

All five gates pass on `ba2b5f3`: format, lint, typecheck clean; **14/14 tests pass** (3 files); production build succeeds (Next.js 15.5.22). Adversarial probes: every banned form errors, every permitted form passes, zero over-blocking. CI run for `a5655a7` independently confirmed `success`.

## 7. Remaining Risks

- **A-5 open:** Dependabot PRs #1–#12 (major bumps) remain open on GitHub — config now prevents recurrence but does not retract existing PRs. Founder action, not a code gate.
- **Lint-boundary blind spots**, documented in `docs/TESTING.md`: the `fetch` global, `process.env` reads, and runtime-computed `import(variable)` are structurally invisible to any import rule. The boundary is necessary, not sufficient.
- **Concurrent-editing pattern:** Cursor read this review's in-progress, uncommitted draft off disk and fixed A-1/A-2 before the review was delivered or committed, folding the review file into its own commit. Outcome verified correct, but the sequencing bypassed propose→approve→implement for those findings. Flagged in `CURRENT_STATUS.md` for founder awareness.

## 8. Items Requiring Claude Judgment

- **Part B remains BLOCKED**, not just on `DATABASE_URL` but on three unanswered founder architecture questions (Q3 concierge-vs-self-serve, Q4 factor weights, Q6 hosting) — Q3 and Q4 don't strictly block schema work, Q6 doesn't either, so a founder could unblock Part A→B technically today by supplying only credentials. Judgment call: still holding the task-spec's original gate rather than relaxing it, since starting schema work under still-`Proposed` ADRs risks rework.
- **Whether the concurrent-editing pattern needs a process fix** (e.g., Cursor should not act on files under `docs/reviews/` until they're committed) is a founder decision, not something to unilaterally enforce from here.
- **A-5 (Dependabot PR closure)** requires GitHub write access this environment doesn't have — cannot be resolved by either agent without founder or `gh` CLI action.
