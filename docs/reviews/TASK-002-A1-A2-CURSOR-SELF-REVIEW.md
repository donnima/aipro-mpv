# TASK-002 A-1/A-2 — Cursor Self-Review

**Commit scope:** Part A Claude follow-ups A-1, A-2 (+ A-3/A-4), agent operating docs  
**Date:** 2026-07-28

## Objective

Close Claude Part A findings A-1 (anchor esquery selectors) and A-2 (ban workspace I/O / allow `@aipro/types`) before Part B. Add `AGENTS.md` / `CLAUDE.md` for milestone-lead workflow.

## Files changed

- `packages/config/eslint/core.js` — anchored selectors; workspace ban/allow; `src/**` scope
- `packages/core/src/purity.test.ts` — A-1/A-2 regression cases (12 tests)
- `.github/dependabot.yml` — A-3 tailwind major ignores
- `docs/TESTING.md` — A-4
- `AGENTS.md`, `CLAUDE.md` — new operating model
- `docs/status/CURRENT_STATUS.md`, `CHANGELOG.md`, `KNOWN_LIMITATIONS.md`
- `docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md` — commit untracked Claude review

## Commands / results

| Command             |         Exit |
| ------------------- | -----------: |
| `pnpm format:check` |            0 |
| `pnpm lint`         |            0 |
| `pnpm typecheck`    |            0 |
| `pnpm test`         | 0 — 14 tests |
| `pnpm build`        |            0 |

## Security / tenancy

No auth or tenant surface. Boundary strengthened: `@aipro/db` blocked before the package exists; relative dynamic imports no longer false-positive.

## Known limitations / blockers

- **Part B blocked:** no `DATABASE_URL` / `DATABASE_URL_UNPOOLED` on disk.
- Dependabot PRs #1–#12 still need founder close (A-5).
- Lint still cannot see `fetch` / `process.env` / `import(variable)`.

## Recommendation

Accept A-1/A-2 closure. Do not start Part B until Neon credentials are supplied.
