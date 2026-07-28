# Known Limitations

Living list of intentional gaps and environment constraints. Updated per task.

## Phase 0 / T-001

| Limitation                                                                   | Impact                                                     | Resolution path                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Playwright browser binaries are **not** installed locally (disk blocker B-1) | `pnpm test:e2e` fails locally without `playwright install` | Run E2E in CI; expand disk to ≥ 25 GB free before local browsers |
| No database, Prisma, or auth yet                                             | App is a placeholder only                                  | T-002 (DB), T-003 (auth)                                         |
| Content-Security-Policy is **report-only**                                   | Browser does not enforce CSP yet                           | Tighten and enforce once routes/assets stabilize (Phase 1+)      |
| Git remote exists but T-001 app commit not yet pushed (B-5 follow-up)        | CI green-on-PR not yet proven from this implementation     | Push branch / open PR against `origin` (`donnima/aipro-mpv`)     |
| No product UI / design system beyond brand CSS variables                     | Home page is a Phase 0 placeholder                         | Later phases; do not invent screens early                        |
| `packages/ui` is an empty shell                                              | No shared components yet                                   | Populate when first real screens land                            |
| gitleaks runs in CI only                                                     | Local pre-commit secret scan not wired                     | Optional local hook later; CI remains the gate                   |

## Security notes for reviewers

- `.env.example` contains **empty** values only. Real credentials must never be committed.
- `.claude/settings.local.json` is git-ignored.
- Health endpoint returns `{ status, version, commit }` only — no diagnostics or connection details.
