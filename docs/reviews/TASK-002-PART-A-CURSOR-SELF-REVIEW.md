# TASK-002 Part A — Cursor Self-Review Evidence

**Reviewer:** Cursor (self-review)  
**Date:** 2026-07-28  
**Commit reviewed:** `a5f7def` — `fix: harden repository boundaries and CI controls`

---

## Files changed

```
.github/dependabot.yml
.github/workflows/ci.yml
CHANGELOG.md
KNOWN_LIMITATIONS.md
apps/web/package.json
docs/TESTING.md
docs/reviews/TASK-002-IMPLEMENTATION.md
docs/status/CURRENT_STATUS.md
package.json
packages/config/eslint/core.js
packages/core/src/purity.test.ts
pnpm-lock.yaml
```

12 files, +460 / −119. No Prisma / schema / RLS / product code.

---

## Commands run

| Command                                      |   Exit | Result                                                                                          |
| -------------------------------------------- | -----: | ----------------------------------------------------------------------------------------------- |
| `pnpm format:check` (full tree)              |  **1** | Fail caused by **untracked** `docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md` (not in `a5f7def`) |
| `prettier --check` on each file in `a5f7def` |  **0** | All 12 commit paths OK                                                                          |
| `pnpm lint`                                  |  **0** | Pass                                                                                            |
| `pnpm typecheck`                             |  **0** | Pass                                                                                            |
| `pnpm test`                                  |  **0** | 3 files, **10** tests passed (8 purity + 2 prior)                                               |
| `pnpm build`                                 |  **0** | Next.js 15.5.22                                                                                 |
| Secret pattern scan (non-docs app/config)    | **1*** | No credential matches (`rg` exit 1 = no hits)                                                   |
| Inspect CI `permissions:`                    |      — | `contents: read` present at workflow level                                                      |
| Inspect `@types/node` pins                   |      — | root + web = `~22.20.1`                                                                         |

\* Exit 1 from `rg` with empty output means no matches — treated as **pass** for secret scanning.

---

## Adversarial probes

Temporary files under `packages/core/src/`, linted, then deleted (tree clean afterward).

| Probe                                                                                                                                                                                  | Expected | Actual                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| Banned forms (`next`, `next/server`, `dns`, `zlib`, `buffer`, `util`, `tls`, `vm`, `node:path`, `import("next/server")`, `import("crypto")`, `require("fs")`, `export * from "react"`) | non-zero | **EXIT=1**, **15** errors (`no-restricted-imports` + `no-restricted-syntax` + `no-require-imports`) |
| Allowed relative import (`./index`)                                                                                                                                                    | 0        | **EXIT=0**                                                                                          |

**F-1 / F-2 checks observed in probe output:** dynamic `import()` flagged by `no-restricted-syntax`; bare builtins (`dns`, `zlib`, `buffer`, `util`, `tls`, `vm`) flagged.

---

## Possible remaining risks

1. **Dependabot PRs #1–#12 still open** — config ignores future majors; founder must close without merging (F-3 incomplete operationally).
2. **Lint boundary blind spots** — `fetch`, `process.env`, `import(variable)` still invisible (`docs/TESTING.md`).
3. **Internal Node modules filtered** — names starting with `_` excluded from the ban list (68 builtins → 54 bare public names). Low practical risk; not in TASK probe set.
4. **DoD item “fails when rule is removed”** — not re-executed in this self-review (negative-control proof missing from this evidence set).
5. **Full-tree `format:check` noise** — fails on unrelated untracked Claude review file; does not indicate `a5f7def` formatting drift.

---

## Recommendation

**Recommend Claude APPROVE Part A** (or APPROVED WITH FOLLOW-UP for Dependabot PR closure + optional negative-control purity test).

Part A quality gates for the commit itself pass. Part B remains blocked on credentials; no database work is present in `a5f7def`.
