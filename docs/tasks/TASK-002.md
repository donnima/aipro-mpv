# TASK-002 — Database Foundation and Tenancy Schema

**Supersedes** the Phase 0 draft `docs/tasks/T-002-database-foundation-and-tenancy-schema.md`, which was written before T-001 existed. Where the two differ, **this file wins**.

## Task ID

`TASK-002` · Phase 1 · Depends on **TASK-001 — APPROVED WITH FOLLOW-UP** (`docs/reviews/TASK-001-CLAUDE-REVIEW.md`)

**Blocked until the founder supplies `DATABASE_URL` and `DATABASE_URL_UNPOOLED`** (Neon), and answers open questions 3, 4 and 6 in `ARCHITECTURE.md` §15. Question 3 (concierge vs self-serve) and question 4 (factor weights) do not affect this task's schema; question 6 (hosting) does not either. **Part A below may proceed immediately** — it needs no credentials.

## Objective

Two parts, in order.

**Part A — close the TASK-001 follow-up.** Make the `packages/core` purity boundary un-bypassable and tighten CI and dependency hygiene.

**Part B — stand up the database.** PostgreSQL via Prisma, the complete Phase 1 schema from `DATA_MODEL.md` §4, Row-Level Security on every tenant-owned table, and tests that _prove_ RLS blocks cross-tenant access at the database level.

No authentication, no application features, no UI.

## Business Reason

Tenant isolation is the hard gate for the whole project — `MVP_SCOPE.md` and the operating system both forbid building product data before it is verified. The database is the last line of defence (risk S-1). Building RLS now, with eight tables and zero query paths, is cheap; retrofitting it after Phase 3 means auditing every query that already exists.

Part A is here rather than deferred because `packages/core` is currently fourteen lines of constants. There is nothing yet that could violate the boundary, so closing the gap costs minutes. Once Phase 4 puts the economics engine behind it, the same fix means auditing real code.

## Files or Areas Expected

```
# Part A
packages/config/eslint/core.js          add dynamic-import + full-builtin coverage
packages/core/src/purity.test.ts        NEW — the boundary is now self-testing
.github/workflows/ci.yml                add permissions block
.github/dependabot.yml                  constrain majors / group updates

# Part B
packages/db/
  package.json                          name: @aipro/db
  prisma/schema.prisma
  prisma/migrations/
  prisma/seed.ts
  src/internal/client.ts                raw PrismaClient — import-restricted
  src/rls.ts                            SET LOCAL session-variable helper
  src/index.ts                           public exports (no raw client)
  eslint.config.js
  tsconfig.json
packages/config/eslint/base.js          raw-client import ban
apps/web/app/api/health/route.ts        extend with a DB reachability check
apps/web/app/api/health/route.test.ts   update
.github/workflows/ci.yml                add a postgres service container
docs/DEVELOPMENT.md                     database setup section
.env.example                            already lists both DB vars — verify only
```

## Functional Requirements

### Part A — follow-up from TASK-001

1. **Close F-1.** The purity rule must reject dynamic `import()`. Add `no-restricted-syntax` targeting `ImportExpression` whose source matches the banned set. Verify with `await import("next/server")` inside `packages/core`.
2. **Close F-2.** The purity rule must reject **every** Node builtin, bare or `node:`-prefixed. Enumerate from `module.builtinModules` rather than a hand-written list, or invert to an allow-list. Verify with `dns`, `zlib`, `buffer`, `util`, `tls`, `vm`.
3. **Make the boundary self-testing.** Add `packages/core/src/purity.test.ts` that lints fixture snippets through the ESLint Node API and asserts each banned form produces an error. This replaces the manual "demonstrate then revert" step and means the boundary cannot silently regress. Cover at minimum: static import, `node:` import, bare builtin, dynamic import, `require()`, and `export * from`.
4. **Close F-4.** Add `permissions: contents: read` at workflow level in `ci.yml`; widen only per-job where a job demonstrably needs more.
5. **Close F-3.** Constrain Dependabot: `ignore` major updates for `typescript`, `@types/node`, `@eslint/js`, `globals`, and the ESLint plugins, or `groups` them into a single PR. Pin `@types/node` to the Node 22 major line to match `engines`. Then **close or rebase the 12 open Dependabot PRs** — do not merge major bumps as part of this task.
6. **Close F-5.** Confirm CI run #1 concluded green, or report its actual conclusion. Do not assume.

### Part B — database

7. Prisma 6 against PostgreSQL 16 in a new workspace package `@aipro/db`. Local development uses a **Neon development branch — no Docker, no local Postgres** (ADR-0013, blocker B-2).
8. Implement **exactly** the eleven Phase 1 tables in `DATA_MODEL.md` §4: `users`, `accounts`, `sessions`, `verification_tokens`, `organizations`, `memberships`, `invitations`, `support_grants`, `audit_logs`. **Create no Phase 2+ table.**
9. UUID v7 primary keys. All `DATA_MODEL.md` §1 conventions: `timestamptz` audit columns, `citext` for emails and slugs, `numeric(18,6)` reserved for money (none in this task — but introduce no `float` anywhere).
10. Enums needed by Phase 1: `Role`, `InvitationStatus`.
11. Enable RLS on `organizations`, `memberships`, `invitations`, `audit_logs`, with policies reading `current_setting('app.current_organization_id', true)`.
12. Two database roles: an application role (RLS enforced; `INSERT` and `SELECT` only on `audit_logs`) and a migration role (RLS bypass). Document both in `docs/DEVELOPMENT.md`.
13. `packages/db/src/rls.ts` exports a helper that opens a transaction and issues `SET LOCAL app.current_organization_id = $1`. **`SET LOCAL`, never `SET`** — a pooled connection must not carry the value into the next request.
14. Constraints and indexes per `DATA_MODEL.md` §12, **including the composite `(id, organization_id)` unique keys** that later phases need to prevent cross-tenant foreign keys.
15. Idempotent seed creating two unrelated organizations with distinct users — the fixture TASK-005's isolation harness will consume.
16. Extend `/api/health` with a database reachability boolean and the applied migration count. It must **not** leak the connection string, host, schema names, or driver errors (S-20).

## Technical Constraints

- Forward-only migrations, checked in, named for this task.
- No code outside `packages/db` may import `PrismaClient`. Enforce with `no-restricted-imports` in `packages/config/eslint/base.js`, exempting `packages/db/src/internal` and the migration/seed scripts. CI must fail on violation.
- `packages/core` must **not** depend on `packages/db` — the ADR-0001 boundary holds, and Part A now enforces it against dynamic imports too.
- Neon **pooled** URL for the app, **direct** URL for migrations. Both already stubbed in `.env.example`.
- Keep the existing toolchain versions. Do not bump Next, TypeScript, or `@types/node` in this task.

## Security Requirements

- `DATABASE_URL` from the environment only. Never committed, never logged, never in a client-visible error.
- `audit_logs`: no `UPDATE` or `DELETE` in the schema, the DAL, or the application role's grants. Verify against `information_schema.role_table_grants` (S-13).
- `invitations.token_hash` stores a SHA-256 hash. **No column may be capable of holding a plaintext token** (S-5).
- `support_grants`: check constraint `expires_at > created_at`. The 24-hour cap is enforced in the service layer in TASK-004 (ADR-0020).
- Health endpoint returns a boolean, never diagnostics.
- `.env.example` must remain all-empty. `gitleaks` must stay green.

## Tests Required

**Part A**

1. `purity.test.ts` asserts every banned form errors — static, `node:`, bare builtin, dynamic `import()`, `require()`, `export * from`.
2. A permitted import inside `packages/core` still passes (guard against over-blocking).

**Part B** — integration tests against a real PostgreSQL (CI service container):

3. Migrations apply cleanly to an empty database; re-applying is a no-op.
4. Seed is idempotent — running twice yields identical row counts.
5. **RLS blocks cross-tenant reads.** With `app.current_organization_id` set to Org A, `SELECT *` on `memberships` returns only Org A rows. Assert at the SQL level, bypassing the ORM entirely.
6. **RLS blocks cross-tenant writes.** Inserting a row whose `organization_id` differs from the session variable fails.
7. **The session variable does not leak across transactions on a reused pooled connection.** Run two sequential transactions with different org ids on one connection and assert isolation.
8. The application role cannot `UPDATE` or `DELETE` `audit_logs` — assert the statement raises.
9. `/api/health` returns 200 with the database reachable, and its body contains no connection details.

**Test 7 catches the most dangerous real-world bug in this design. Do not skip it, and do not weaken it to make it pass.**

## Documentation Required

- `DATA_MODEL.md` — mark Phase 1 tables implemented; document any deviation and why.
- `docs/DEVELOPMENT.md` — Neon setup, obtaining a branch URL, migration commands, the two database roles.
- `docs/TESTING.md` — **new**; how database tests run, and the limits of the lint-based purity boundary (it cannot see `fetch` or `process.env`).
- `DECISIONS.md` — a new ADR only if you deviate from ADR-0004 or ADR-0013.
- `CHANGELOG.md`, `KNOWN_LIMITATIONS.md` — update.
- **`docs/reviews/TASK-002-IMPLEMENTATION.md` — required.** Use the §29 format: `## Task Completed · ## Files Changed · ## Database Changes · ## Functional Behavior · ## Security and Authorization · ## Tests Added · ## Commands Executed · ## Results · ## Known Limitations · ## Review Notes`. TASK-001 shipped without this; it is not optional again.

## Definition of Done

- [ ] F-1 closed — dynamic `import()` of a banned module errors
- [ ] F-2 closed — every Node builtin errors, bare and prefixed
- [ ] `purity.test.ts` passes and fails when the rule is removed
- [ ] F-3, F-4 closed; F-5 answered with the actual CI conclusion
- [ ] Migrations apply to a clean database
- [ ] Schema matches `DATA_MODEL.md` §4 exactly, or deviations are documented
- [ ] RLS enabled and **verified** on all four tenant tables
- [ ] All nine tests pass, including the pooled-connection test
- [ ] The raw-client import ban fails on a deliberate violation
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] CI green, including the Postgres service container
- [ ] Implementation report written

## Commands to Run

```bash
pnpm --filter @aipro/db exec prisma migrate deploy && pnpm --filter @aipro/db exec prisma db seed && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Expected Evidence

1. Full unedited output of the command above.
2. `\d+ memberships` and `\d+ audit_logs` from `psql` — columns, indexes, constraints.
3. `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` — proving RLS is on.
4. `SELECT * FROM pg_policies` — the actual policy definitions.
5. Test output for tests 5–8 with assertion messages visible.
6. `information_schema.role_table_grants` for `audit_logs`, showing no UPDATE/DELETE for the application role.
7. Output of `purity.test.ts`, plus proof it fails when the rule is disabled.
8. The CI run URL and its conclusion.
9. `git diff --stat`.

**Do not claim RLS works because it is configured.** Show the query that returns zero rows for the wrong tenant. If a step cannot be run because a credential is missing, say which one and stop — do not mark it passing.
