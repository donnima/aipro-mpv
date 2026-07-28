# Known Limitations

Living list of intentional gaps and environment constraints. Updated per task.

## TASK-007 — WordPress identity architecture

| Limitation                                 | Impact                                   | Resolution path                                      |
| ------------------------------------------ | ---------------------------------------- | ---------------------------------------------------- |
| WordPress single-site vs Multisite unknown | Site ID / user mapping config incomplete | Founder/admin confirms installation mode             |
| WordPress plugin not yet implemented       | No live auth bridge                      | Later task per `WORDPRESS-INTEGRATION-FOUNDATION.md` |
| Neon credentials still missing             | Part B cannot start                      | Founder supplies `.env.local` URLs                   |

## TASK-002 Part A follow-ups

| Limitation                              | Impact                                             | Resolution path                       |
| --------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| Part B blocked — no Neon `DATABASE_URL` | Cannot create Prisma schema, migrate, or prove RLS | Founder supplies pooled + direct URLs |
| Dependabot PRs #1–#12 still open (A-5)  | Stale major PRs                                    | Founder closes without merging        |

## TASK-002 Part A

| Limitation                                                                                | Impact                                                                   | Resolution path                                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Lint-based purity cannot see `fetch`, `process.env`, or `import(variable)`                | Residual I/O paths into `packages/core` remain theoretically possible    | Documented in `docs/TESTING.md`; review discipline for Phase 4+ domain code |
| Local `gitleaks` binary not installed                                                     | Secret scan locally is pattern-based; CI `gitleaks` job remains the gate | Install gitleaks locally optional; CI already ran green on `a5655a7`        |
| 12 open Dependabot major-bump PRs not closed from this machine (`gh` / token unavailable) | Stale major PRs remain open until founder closes them                    | Founder closes PRs #1–#12; new majors ignored by updated `dependabot.yml`   |
| Part B (Prisma / RLS / schema) not started                                                | No database yet                                                          | Blocked on `DATABASE_URL` + WP details + revised Part B authorization       |

## Phase 0 / T-001

| Limitation                                                                   | Impact                                                     | Resolution path                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Playwright browser binaries are **not** installed locally (disk blocker B-1) | `pnpm test:e2e` fails locally without `playwright install` | Run E2E in CI; expand disk to ≥ 25 GB free before local browsers |
| No database / Prisma yet; Auth.js plan superseded                            | App is API placeholder; identity moves to WordPress        | TASK-002 Part B (DB); WordPress bridge tasks (not T-003 Auth.js) |
| Content-Security-Policy is **report-only**                                   | Browser does not enforce CSP yet                           | Tighten and enforce once routes/assets stabilize (Phase 1+)      |
| No product UI in this repo beyond placeholder                                | Customer UI is WordPress-hosted (ADR-0021)                 | Plugin + Option B bundles; do not build a second portal          |
| `packages/ui` is an empty shell                                              | No shared components yet                                   | Populate when first real screens land (may ship via WP bundle)   |
