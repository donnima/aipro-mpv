# Changelog

All notable changes to this project are documented here. Completed phases also update this file per the operating system documentation contract.

## [Unreleased]

### Phase 0 — Repository and tooling baseline (T-001)

- pnpm workspace monorepo with `apps/web` and `packages/{config,core,types,ui}`.
- Next.js 15 App Router placeholder home page and `GET /api/health`.
- Shared ESLint (flat), Prettier, TypeScript strict presets, Tailwind brand tokens.
- Vitest workspace tests; Playwright configured (CI-only browsers).
- GitHub Actions CI: format → lint → typecheck → test → build → gitleaks (+ E2E job).
- Dependabot weekly updates for npm and GitHub Actions.
- Security headers in `next.config.ts` (CSP report-only).
- Documentation: `README.md`, `docs/DEVELOPMENT.md`, `KNOWN_LIMITATIONS.md`.
