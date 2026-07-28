# Urunlytics — AI Product & Market Opportunity Intelligence Platform

**Brand:** Urunlytics · **Product:** AI Product & Market Opportunity Intelligence Platform  
**Customer website (WordPress):** [https://urunlytics.com](https://urunlytics.com) · **Backend API:** [https://api.urunlytics.com](https://api.urunlytics.com)

Working repository codename: **AIPro MVP** — an analyst-led product opportunity and market-entry intelligence platform. Brand and domain authority: [`docs/decisions/FOUNDER-BRAND-AND-DOMAINS.md`](docs/decisions/FOUNDER-BRAND-AND-DOMAINS.md).

This repository is a **pnpm monorepo** with a headless Next.js API application (ADR-0001, ADR-0021). There is no FastAPI service. Customer UI and identity live on WordPress.

## Prerequisites

- Node.js **22** (see `.nvmrc`)
- **pnpm 9** via Corepack (`corepack enable`)
- Git
- A Neon PostgreSQL development branch URL — required from **T-002** onward (no local Docker/Postgres; ADR-0013)

## Setup

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env.local   # fill values as phases require — never commit real secrets
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Health: [http://localhost:3000/api/health](http://localhost:3000/api/health).

Windows notes and environment blockers: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Scripts (from repository root)

| Script                              | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                          | Start Next.js in development                           |
| `pnpm build`                        | Production build                                       |
| `pnpm lint`                         | ESLint across workspace packages                       |
| `pnpm format` / `pnpm format:check` | Prettier write / check                                 |
| `pnpm typecheck`                    | TypeScript `--noEmit` across packages                  |
| `pnpm test`                         | Vitest unit/integration tests                          |
| `pnpm test:e2e`                     | Playwright (CI only until disk blocker B-1 is cleared) |

## Architecture documents

| Document                                                                                                                   | Role                              |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [`MVP_SCOPE.md`](MVP_SCOPE.md)                                                                                             | MVP boundary — what is in and out |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                                                                                       | Stack, tenancy, phased plan       |
| [`DECISIONS.md`](DECISIONS.md)                                                                                             | Architecture Decision Records     |
| [`DATA_MODEL.md`](DATA_MODEL.md)                                                                                           | Schema conventions and entities   |
| [`AIPro_Zero_to_Production_Claude_Cursor_Operating_System.md`](AIPro_Zero_to_Production_Claude_Cursor_Operating_System.md) | Master operating system           |

## Workspace layout

```
apps/web          Next.js 15 App Router application
packages/core     Pure domain logic (no I/O — ADR-0001)
packages/db       (T-002+) Prisma schema and tenant DAL
packages/types    Shared contracts
packages/ui       Shared UI primitives
packages/config   Shared ESLint / TS / Prettier / Tailwind
```

## Sign-in (later)

Authentication is **WordPress-owned** (ADR-0021). Do not add Auth.js / standalone sign-in. Until the WordPress bridge ships, this monorepo exposes API health only. See `.env.example` for Neon and JWT verification variables (not `AUTH_*`).

## License

See [`LICENSE`](LICENSE).
