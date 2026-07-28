# Known Limitations

Living list of intentional gaps and environment constraints. Updated per task.

## TASK-002 Part A

| Limitation                                                                                | Impact                                                                   | Resolution path                                                               |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Lint-based purity cannot see `fetch`, `process.env`, or `import(variable)`                | Residual I/O paths into `packages/core` remain theoretically possible    | Documented in `docs/TESTING.md`; review discipline for Phase 4+ domain code   |
| Local `gitleaks` binary not installed                                                     | Secret scan locally is pattern-based; CI `gitleaks` job remains the gate | Install gitleaks locally optional; CI already ran green on `a5655a7`          |
| 12 open Dependabot major-bump PRs not closed from this machine (`gh` / token unavailable) | Stale major PRs remain open until founder closes them                    | Founder closes PRs #1–#12; new majors ignored by updated `dependabot.yml`     |
| Part B (Prisma / RLS / schema) not started                                                | No database yet                                                          | Blocked on `DATABASE_URL` + founder answers for questions 3/4/6 before schema |

## Phase 0 / T-001

| Limitation                                                                   | Impact                                                     | Resolution path                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Playwright browser binaries are **not** installed locally (disk blocker B-1) | `pnpm test:e2e` fails locally without `playwright install` | Run E2E in CI; expand disk to ≥ 25 GB free before local browsers |
| No database, Prisma, or auth yet                                             | App is a placeholder only                                  | TASK-002 Part B (DB), TASK-003 (auth)                            |
| Content-Security-Policy is **report-only**                                   | Browser does not enforce CSP yet                           | Tighten and enforce once routes/assets stabilize (Phase 1+)      |
| No product UI / design system beyond brand CSS variables                     | Home page is a Phase 0 placeholder                         | Later phases; do not invent screens early                        |
| `packages/ui` is an empty shell                                              | No shared components yet                                   | Populate when first real screens land                            |

## Security notes for reviewers

- `.env.example` contains **empty** values only. Real credentials must never be committed.
- `.claude/settings.local.json` is git-ignored.
- Health endpoint returns `{ status, version, commit }` only — no diagnostics or connection details.
- CI run #1 for `a5655a7`: [actions/runs/30341374040](https://github.com/donnima/aipro-mpv/actions/runs/30341374040) — `conclusion: success` (F-5 closed).
