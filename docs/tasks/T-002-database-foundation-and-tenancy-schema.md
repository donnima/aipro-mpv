# T-002 — Database Foundation and Tenancy Schema

## Task ID
`T-002` · Phase 1 · Depends on **T-001 approved** · Blocked until the founder supplies `DATABASE_URL`

## Objective
Stand up PostgreSQL with Prisma, implement the complete Phase 1 schema from `DATA_MODEL.md` §4, enable Row-Level Security on every tenant-owned table, and prove RLS actually blocks cross-tenant reads at the database level. No application features, no auth, no UI.

## Business Reason
Tenant isolation is the hard gate for the entire project — `MVP_SCOPE.md` and the operating system both forbid building product data before it is verified. The database is the last line of defence (risk S-1). Building RLS now, while there are eight tables and zero query paths, is cheap; retrofitting it after Phase 3 means auditing every query that already exists. This task creates the foundation the next three tasks build on and must not be rushed.

## Files or Areas Expected
```
packages/db/
  prisma/schema.prisma
  prisma/migrations/
  prisma/seed.ts
  src/internal/client.ts        raw PrismaClient — import-restricted
  src/rls.ts                    session-variable helpers
  src/index.ts                  public exports (no raw client)
apps/web/app/api/health/route.ts    extend with a DB check
packages/config/eslint/            add the import restriction rule
.github/workflows/ci.yml           add a Postgres service container
docs/DEVELOPMENT.md                database setup section
```

## Functional Requirements
1. Prisma 6 in `packages/db` against PostgreSQL 16. Local development uses a Neon development branch — **no Docker, no local Postgres** (ADR-0013).
2. Implement exactly the eleven Phase 1 tables in `DATA_MODEL.md` §4: `users`, `accounts`, `sessions`, `verification_tokens`, `organizations`, `memberships`, `invitations`, `support_grants`, `audit_logs`. Do not create any Phase 2+ table.
3. UUID v7 primary keys. All `DATA_MODEL.md` §1 conventions applied.
4. All enums from `DATA_MODEL.md` §3 that Phase 1 needs: `Role`, `InvitationStatus`.
5. Enable RLS on `organizations`, `memberships`, `invitations`, `audit_logs` with policies reading `current_setting('app.current_organization_id', true)`.
6. Two database roles: the application role (RLS enforced, `INSERT`/`SELECT` only on `audit_logs`) and a migration role (RLS bypass). Document both in `docs/DEVELOPMENT.md`.
7. `packages/db/src/rls.ts` exports a helper that opens a transaction, issues `SET LOCAL app.current_organization_id = $1`, and runs a callback. **`SET LOCAL`, never `SET`** — a pooled connection must not carry the value into the next request.
8. Constraints and indexes per `DATA_MODEL.md` §12, including the composite `(id, organization_id)` unique keys that later phases need for cross-tenant foreign key prevention.
9. Idempotent seed creating two organizations with distinct users — the fixture the isolation tests in T-005 will use.
10. Extend `/api/health` to report database connectivity and the applied migration count. It must **not** leak the connection string, host, or schema details.

## Technical Constraints
- Forward-only migrations. Every migration checked in and named after this task.
- No application code outside `packages/db` may import `PrismaClient`. Enforce with an ESLint `no-restricted-imports` rule; CI fails on violation.
- `packages/core` must not depend on `packages/db` — the ADR-0001 boundary holds.
- Connection pooling configured for a serverless host (Neon pooled connection string for the app, direct connection for migrations).
- Money columns are `numeric(18,6)` wherever they appear later — no money columns in this task, but do not introduce `float` anywhere.

## Security Requirements
- `DATABASE_URL` comes from the environment only. Never committed, never logged, never in an error message returned to a client.
- `audit_logs`: no `UPDATE` or `DELETE` in the schema, the DAL, or the application role's grants. Verify the grant with `information_schema.role_table_grants` (risk S-13).
- `invitations.token_hash` stores a SHA-256 hash. There must be no column capable of holding a plaintext token (S-5).
- `support_grants.expires_at` has a check constraint requiring it to exceed `created_at`; the 24-hour cap is enforced in the service layer in T-004 (ADR-0020).
- The health endpoint returns a boolean, not diagnostics (S-20).

## Tests Required
Integration tests against a real Postgres (CI service container):
1. Migrations apply cleanly to an empty database, and re-applying is a no-op.
2. Seed is idempotent — running twice produces the same row counts.
3. **RLS blocks cross-tenant reads.** With `app.current_organization_id` set to Org A, a `SELECT *` on `memberships` returns only Org A's rows. This must be tested at the SQL level, bypassing the ORM entirely.
4. **RLS blocks cross-tenant writes.** Inserting a row with a different `organization_id` than the session variable fails.
5. The session variable does not leak between transactions on the same pooled connection — run two sequential transactions with different org ids on one connection and assert isolation.
6. The application role cannot `UPDATE` or `DELETE` `audit_logs` — assert the statement raises.
7. `/api/health` returns 200 with the database reachable.

Test 5 is the one that catches the most dangerous real-world bug in this design. Do not skip it.

## Documentation Required
- `DATA_MODEL.md`: mark Phase 1 tables as implemented; record any deviation and why.
- `docs/DEVELOPMENT.md`: Neon setup, obtaining a branch URL, migration commands, the two database roles.
- `DECISIONS.md`: append an ADR only if you deviate from ADR-0004 or ADR-0013.
- `KNOWN_LIMITATIONS.md`: update.

## Definition of Done
- [ ] Migrations apply to a clean database
- [ ] Schema matches `DATA_MODEL.md` §4 exactly, or deviations are documented and justified
- [ ] RLS enabled and verified on all four tenant tables
- [ ] All seven tests pass, including the connection-reuse test
- [ ] The ESLint import restriction fails on a deliberate violation — demonstrate, then revert
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] CI green with the Postgres service container

## Commands to Run
```bash
pnpm --filter @aipro/db prisma migrate deploy && pnpm --filter @aipro/db prisma db seed && pnpm test && pnpm lint && pnpm typecheck && pnpm build
```

## Expected Evidence
1. Full unedited output of the command above.
2. `\d+ memberships` and `\d+ audit_logs` from `psql` showing columns, indexes, and constraints.
3. `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` — proving RLS is on.
4. `SELECT * FROM pg_policies` — the actual policy definitions.
5. Test output for the RLS tests, with the assertion messages visible.
6. Output of `information_schema.role_table_grants` for `audit_logs` showing no UPDATE/DELETE for the application role.
7. Terminal output of the ESLint restriction failing on a deliberate `PrismaClient` import, and the revert.
8. `git diff --stat`.

**Do not claim RLS works because it is configured.** Show the query that returns zero rows for the wrong tenant.
