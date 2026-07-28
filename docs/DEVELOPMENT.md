# Development

## Local setup (Windows Server)

1. Ensure Node.js 22 is on `PATH` (`C:\Program Files\nodejs`).
2. Ensure Git is on `PATH` (`C:\Program Files\Git\cmd`).
3. Enable pnpm via Corepack:

```powershell
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm --version
```

4. From the repository root:

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

5. Verify health:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Line endings are forced to LF via `.gitattributes` (`* text=auto eol=lf`) so Windows `core.autocrlf` does not churn diffs against Linux CI.

## Known environment blockers

Recorded in `ARCHITECTURE.md` §1.4. Status as of T-001:

| ID  | Blocker                    | T-001 status                                                                                                                                                 |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B-1 | Low free disk              | **Mitigated locally:** Playwright browsers are **not** installed on this machine. E2E runs in CI only. Free space should be monitored before large installs. |
| B-2 | No Docker / local Postgres | Deferred to T-002 — Neon hosted branch (ADR-0013).                                                                                                           |
| B-3 | Git identity               | Cleared at repo level (`user.name` / `user.email` in `.git/config`).                                                                                         |
| B-4 | CRLF                       | Cleared via `.gitattributes`.                                                                                                                                |
| B-5 | No git remote / GitHub     | **Remote present:** `origin` → `https://github.com/donnima/aipro-mpv.git`. Push + PR still required to prove CI green.                                       |
| B-6 | Secrets                    | Not required for T-001. Listed empty in `.env.example`.                                                                                                      |
| B-7 | Branch / `.gitignore`      | Cleared: branch is `main`; `.gitignore` excludes `.env*` and `.claude/settings.local.json`.                                                                  |

## Quality gates

From the repository root:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## `packages/core` purity boundary

`packages/core` must not import `next`, `react`, `@prisma/client`, or Node built-ins (ADR-0001). Enforced by ESLint (`@aipro/config/eslint/core`). A deliberate `import "next"` inside `packages/core` must fail lint.

## Playwright

Configured under `apps/web/playwright.config.ts`. **Do not run `playwright install` on this machine until disk free space is ≥ ~25 GB** (or accept CI-only E2E). The `pnpm test:e2e` script exists for CI.

## Database (from T-002)

Not part of T-001. Local development will use a Neon development branch URL in `DATABASE_URL` — no Docker Compose on the critical path.
