# Changelog

All notable changes to this project are documented here. Completed phases also update this file per the operating system documentation contract.

## [Unreleased]

### TASK-002 Part A follow-ups (A-1 / A-2)

- Anchored dynamic `import()` / `require()` selectors (no false positives on `./costs`, `./path-utils`).
- Ban workspace I/O packages (`@aipro/db`, `@aipro/web`, `@aipro/ui`, `@aipro/config`); allow `@aipro/types`.
- Purity rule scoped to `packages/core/src/**` so `eslint.config.js` can load the shared config.
- Dependabot major ignores for `tailwind-merge` and `prettier-plugin-tailwindcss`.
- Added `AGENTS.md` / `CLAUDE.md` for milestone-lead Cursor + end-of-milestone Claude audits.

### TASK-002 Part A — Repository boundary and CI hardening

- `packages/core` purity rule now blocks dynamic `import()` and `require()` of banned modules (`no-restricted-syntax`).
- Node builtins banned from `module.builtinModules` (bare + `node:`), not a hand-written subset.
- `packages/core/src/purity.test.ts` self-tests the boundary via the ESLint Node API.
- CI workflow declares `permissions: contents: read`.
- Dependabot ignores major bumps for toolchain packages; groups updates; `@types/node` pinned to Node 22 (`~22.20.1`).
- CI run #1 on `a5655a7` confirmed **success** via GitHub API.
- `docs/TESTING.md` documents purity limits (`fetch`, `process.env`, dynamic ids).

### Phase 0 — Repository and tooling baseline (T-001)

- pnpm workspace monorepo with `apps/web` and `packages/{config,core,types,ui}`.
- Next.js 15 App Router placeholder home page and `GET /api/health`.
- Shared ESLint (flat), Prettier, TypeScript strict presets, Tailwind brand tokens.
- Vitest workspace tests; Playwright configured (CI-only browsers).
- GitHub Actions CI: format → lint → typecheck → test → build → gitleaks (+ E2E job).
- Dependabot weekly updates for npm and GitHub Actions.
- Security headers in `next.config.ts` (CSP report-only).
- Documentation: `README.md`, `docs/DEVELOPMENT.md`, `KNOWN_LIMITATIONS.md`.
