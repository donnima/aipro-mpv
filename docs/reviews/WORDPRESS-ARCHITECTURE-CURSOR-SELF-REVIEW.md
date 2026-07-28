# WORDPRESS-ARCHITECTURE — Cursor Self-Review

**Task:** [`TASK-007`](../tasks/TASK-007-wordpress-identity-architecture.md) / [`WORDPRESS-INTEGRATION-FOUNDATION.md`](../tasks/WORDPRESS-INTEGRATION-FOUNDATION.md)  
**Date:** 2026-07-28  
**Agent:** Cursor  
**Scope:** Documentation and architecture only  
**Lock acquire:** `55a01bc`

---

## Review Scope

Founder-approved WordPress-owned identity and presentation architecture: ADR-0021, companion specs, authority-doc updates, supersession of Auth.js / standalone-portal assumptions, Phase 1 schema plan revision. No Prisma, migrations, RLS, or production features.

## What Was Inspected

- `ARCHITECTURE.md`, `DATA_MODEL.md`, `DECISIONS.md`, `MVP_SCOPE.md`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `KNOWN_LIMITATIONS.md`, `.env.example`
- Task specs `TASK-002.md`, `T-003`, `T-004`, `WORDPRESS-INTEGRATION-FOUNDATION.md`
- `infra/deployment/README.md`, `docs/DEVELOPMENT.md`
- New docs under `docs/architecture/`, `docs/security/`, `docs/integration/`
- Repository search for Auth.js, Clerk, Supabase Auth, standalone login/registration, password reset, application passwords, separate customer portal, customer-facing Vercel UI

## Findings

1. **ADR-0021 Accepted** — WordPress owns identity and UI; AIPro is headless backend; mapping-only identity; mandatory backend authz; Option B preferred; iframe rejected by default.
2. **ADR-0005 Superseded** — Auth.js is no longer the planned customer auth path.
3. **DATA_MODEL Phase 1** revised: five tables (`users` as WP mapping, `organizations`, `memberships`, `support_grants`, `audit_logs`); no Auth.js tables; invitations deferred.
4. **T-003** marked superseded; **TASK-002 Part B** table list updated; **T-004** UI path noted as WordPress.
5. Remaining string matches in historical reviews / OS source are **explicitly superseded** with pointers — not silently deleted.
6. Multisite vs single-site recorded as founder/admin configuration question.
7. Recommended MVP UI mode: **Option B** (bundled React inside authenticated WordPress pages).

## Conflict search disposition

| Term                                   | Disposition                                                          |
| -------------------------------------- | -------------------------------------------------------------------- |
| Auth.js / NextAuth                     | Superseded by ADR-0021; ADR-0005 marked superseded; tasks updated    |
| Clerk / Supabase Auth                  | Forbidden; noted in architecture, OS supersession note, threat model |
| Standalone login/registration          | Forbidden; MVP_SCOPE / ARCHITECTURE updated                          |
| Password reset / application passwords | Owned by WordPress only; never stored in Neon                        |
| Customer-facing Vercel UI              | Superseded — Vercel may host API only                                |
| Operating system §7 Auth.js preference | Supersession note added in OS Authentication section                 |

## Explicitly not done

- Prisma schema / migrations / RLS SQL
- WordPress plugin code
- Production application features
- Final decisions on Q3/Q4/Q6 (still open)

## Commands Executed

```bash
pnpm validate:agent-lock
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Plus repository-wide conflict search (reported above).

## Results

| Command                    | Result                               |
| -------------------------- | ------------------------------------ |
| `pnpm validate:agent-lock` | **0** — OK                           |
| `pnpm format:check`        | **0**                                |
| `pnpm lint`                | **0**                                |
| `pnpm typecheck`           | **0**                                |
| `pnpm test`                | **0** — 4 files, **25** tests passed |
| `pnpm build`               | **0** — Next.js 15.5.22              |

## Lock state after commit

| Field                   | Value                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Active Agent            | `none`                                                                                                        |
| Write Lock Owner        | `none`                                                                                                        |
| Active Task             | `none`                                                                                                        |
| Cursor Action Permitted | `no`                                                                                                          |
| Next Action             | Founder supplies WordPress installation details and Neon credentials, then authorizes revised TASK-002 Part B |

## Ready for

Founder: WordPress install details + Neon credentials + Part B authorization.
