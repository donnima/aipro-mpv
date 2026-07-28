# TASK-002 Part A — Implementation Report

**Implementer:** Cursor (implementation lead)
**Date:** 2026-07-28
**Task:** `docs/tasks/TASK-002.md` — **Part A only**
**Base commit:** `a5655a7`
**Decision requested:** Claude review of Part A

---

## Task Completed

TASK-002 **Part A** — close TASK-001 follow-ups F-1 through F-5 (repository purity boundary, CI permissions, Dependabot major constraints, CI conclusion confirmation).

**Part B was not performed.** No Prisma, schema, migrations, RLS, seed, or database-dependent health changes.

---

## Files Changed

| Path                                      | Change                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/config/eslint/core.js`          | Dynamic `import()` / `require()` bans; builtins from `module.builtinModules` |
| `packages/core/src/purity.test.ts`        | **NEW** — ESLint Node API self-test of banned/allowed forms                  |
| `.github/workflows/ci.yml`                | `permissions: contents: read`                                                |
| `.github/dependabot.yml`                  | Major-update ignores + groups; lower PR limit                                |
| `package.json`                            | `@types/node` pinned to `~22.20.1`                                           |
| `apps/web/package.json`                   | `@types/node` pinned to `~22.20.1`                                           |
| `docs/TESTING.md`                         | **NEW** — purity limits documented                                           |
| `docs/reviews/TASK-002-IMPLEMENTATION.md` | **NEW** — this report                                                        |
| `docs/status/CURRENT_STATUS.md`           | Status → `READY_FOR_CLAUDE_REVIEW`                                           |
| `CHANGELOG.md`                            | Part A entry                                                                 |
| `KNOWN_LIMITATIONS.md`                    | Part A limitations + F-5 CI URL                                              |

---

## Findings Resolved

| ID      | Finding                                     | Resolution                                                                |
| ------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| **F-1** | Dynamic `import()` not flagged              | `no-restricted-syntax` on `ImportExpression[source.value=/…/]`            |
| **F-2** | Bare builtins outside hand list not flagged | Enumerate via `module.builtinModules`; ban bare + `node:` forms           |
| **F-3** | Dependabot unconstrained majors             | `ignore` semver-major for toolchain; groups; pin `@types/node` to 22      |
| **F-4** | CI missing `permissions`                    | Workflow-level `permissions: contents: read`                              |
| **F-5** | CI #1 conclusion unconfirmed                | GitHub API: run **30341374040** on `a5655a7` push → `conclusion: success` |

**Dependabot PR close (F-3 follow-through):** 12 open major PRs (#1–#12) were **not closed** from this environment (`gh` CLI and `GITHUB_TOKEN` unavailable). Config now ignores those majors going forward. Founder should close #1–#12 without merging.

---

## Database Changes

**None.** Part B not started.

---

## Functional Behavior

- `packages/core` lint rejects static imports, `export * from`, dynamic `import()`, and `require()` of Next/React/Prisma and every Node builtin.
- Relative imports and `vitest` imports still pass.
- CI jobs inherit read-only contents permission.
- Dependabot will not open new major bumps for ignored toolchain packages.

---

## Security and Authorization

- No new auth surface.
- Least-privilege CI token scope (`contents: read`).
- No secrets added; `.env.example` unchanged and empty.
- Local secret pattern scan: only prose false positive in `DECISIONS.md` (`postgres://` discussion). No credential matches in application files.
- CI gitleaks job already green on run #1 (included in conclusion success).

---

## Tests Added

- `packages/core/src/purity.test.ts` — 8 cases: static, `node:`, bare builtin, dynamic import, `require()`, `export * from`, allowed relative, allowed vitest.

---

## Commands Executed

```bash
pnpm install
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @aipro/core exec eslint src/__adversarial_probe.ts   # temporary probe
pnpm --filter @aipro/core exec eslint src/__adversarial_allowed.ts # temporary probe
```

Adversarial probe contents (then deleted):

- Banned: `next`, `next/server`, `dns`, `zlib`, `buffer`, `util`, `tls`, `vm`, `node:path`, `import("next/server")`, `import("crypto")`, `require("fs")`, `export * from "react"`
- Allowed: `import { getCoreIdentity } from "./index"`

---

## Results

| Command                   | Expected | Actual                                                                      |
| ------------------------- | -------- | --------------------------------------------------------------------------- |
| `pnpm format`             | 0        | **0**                                                                       |
| `pnpm format:check`       | 0        | **0**                                                                       |
| `pnpm lint`               | 0        | **0**                                                                       |
| `pnpm typecheck`          | 0        | **0**                                                                       |
| `pnpm test`               | 0        | **0** — 3 files, **10 tests** passed                                        |
| `pnpm build`              | 0        | **0** — Next.js 15.5.22                                                     |
| Adversarial banned probe  | non-zero | **1** — 15 errors (static, pattern, dynamic import, require)                |
| Adversarial allowed probe | 0        | **0**                                                                       |
| CI run #1 (`a5655a7`)     | success  | **success** — https://github.com/donnima/aipro-mpv/actions/runs/30341374040 |

---

## Known Limitations

- Lint boundary still cannot see `fetch`, `process.env`, or runtime-computed `import(id)` — see `docs/TESTING.md`.
- Local gitleaks binary not installed; relied on pattern scan + CI evidence.
- Dependabot PRs #1–#12 still open pending founder action.
- Part B blocked on Neon credentials.

---

## Review Notes

- No product feature work.
- No database / Prisma / RLS / migration work.
- `@types/node` remains on the Node 22 line (`~22.20.1`) matching `engines.node: >=22 <23`.
- Ready for Claude Part A review. **Do not authorize Part B until credentials and founder answers for Q3/Q4/Q6 are in place.**
