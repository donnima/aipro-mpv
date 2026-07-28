# T-004 — Organizations, Memberships, Roles, and the Tenant Data Access Layer

## Task ID
`T-004` · Phase 1 · Depends on **T-003 approved**

## Objective
Implement organizations, memberships, invitations, and the four-role permission matrix — and build the tenant-scoped data access layer that every future feature is required to go through. This task establishes the pattern all of Phases 2–9 will follow.

## Business Reason
`MVP_SCOPE.md` success criterion 2 is "create or join an organization." More importantly, this task is where the isolation architecture in `ARCHITECTURE.md` §5 becomes real code. Every table added after this one inherits whatever pattern is set here — if the DAL is right, isolation is nearly free for the rest of the project; if it is wrong, every subsequent phase inherits the defect. Review this task harder than any other.

## Files or Areas Expected
```
packages/db/src/
  tenant.ts              getTenantDb(ctx) — the scoped Prisma extension
  context.ts             TenantContext type
apps/web/server/
  authz/permissions.ts   the role → capability matrix
  authz/require.ts       requireMembership(), requireRole()
  services/organizations.ts
  services/memberships.ts
  services/invitations.ts
  services/support-grants.ts
  audit/log.ts           writeAuditLog()
apps/web/app/(app)/orgs/page.tsx                    organization selector
apps/web/app/(app)/orgs/new/page.tsx
apps/web/app/(app)/orgs/[orgSlug]/layout.tsx        resolves + verifies org context
apps/web/app/(app)/orgs/[orgSlug]/page.tsx          placeholder dashboard
apps/web/app/(app)/orgs/[orgSlug]/settings/members/page.tsx
apps/web/app/(auth)/invitations/[token]/page.tsx
packages/config/eslint/                             raw-client import ban
```

## Functional Requirements

### Tenant data access layer — the core of this task
1. `TenantContext = { organizationId, userId, role, supportGrantId? }`.
2. `getTenantDb(ctx)` returns a Prisma client extension that, for every tenant-owned model, injects `organization_id = ctx.organizationId` into every `where` on read, update, and delete, and onto every `create`. It opens a transaction and issues `SET LOCAL app.current_organization_id` so RLS applies to the same statements (T-002's `rls.ts`).
3. `findUnique` on tenant models is **not exposed**. Only `findFirst`, which always carries the org filter. An id from another tenant returns `null`, never a row.
4. The raw client remains import-banned outside `packages/db/src/internal`. Extend the ESLint rule to cover the new files.

### Organization context
5. All tenant screens live under `/orgs/[orgSlug]/…`. The layout resolves `orgSlug → Organization`, then loads the `Membership` for the session user. **No membership → `notFound()` (404), never 403** (ADR-0004).
6. The active organization is derived from the URL only. **No cookie, header, query parameter, or request body may influence which organization is served** (risk S-2). Server Actions receive `orgSlug` as an argument and re-resolve it independently — they must not trust anything from the client beyond the slug, and must re-verify membership.

### Organizations and membership
7. Create an organization: unique slug, creator becomes `ORG_ADMIN`, rate-limited per user, audit-logged (ADR-0020).
8. Organization selector listing the user's organizations. A user with none is prompted to create one.
9. Members list showing name, email, role, and join date. Visible to `ORG_ADMIN` and above.
10. Change a member's role and remove a member — `ORG_ADMIN` only. **A user cannot change their own role. The last `ORG_ADMIN` cannot be demoted or removed** (risk S-6).

### Invitations
11. `ORG_ADMIN` invites by email with a role. `PLATFORM_ADMIN` is not an assignable role.
12. Token: 256-bit random, emailed in plaintext, stored as SHA-256 only. Single use. 7-day expiry.
13. Acceptance requires the authenticated user's email to **match the invited email**. Mismatch is rejected with a clear message and audit-logged.
14. Accepting creates the membership and marks the invitation `ACCEPTED`. Re-use is rejected.
15. Pending invitations can be revoked.

### Permissions
16. Implement the capability matrix in `ARCHITECTURE.md` §5 as a single static, exhaustively typed table. `requireRole(ctx, capability)` throws a typed authorization error.
17. Every Server Action and route handler calls `requireMembership` and, where relevant, `requireRole` **independently** — UI state is never a security control (risk S-16).

### Support grants
18. `PLATFORM_ADMIN` has **no ambient cross-organization access**. Access requires an active `SupportGrant`: not revoked, not expired, max 24 hours, reason required.
19. Every request served under a grant writes an audit entry carrying `support_grant_id`, visible in the **target organization's** audit log.

### Audit log
20. `writeAuditLog()` writes within the caller's transaction — an audited action and its record commit or roll back together.
21. Audited in this task: `organization.created`, `organization.updated`, `member.invited`, `member.invitation_accepted`, `member.invitation_revoked`, `member.role_changed`, `member.removed`, `support_grant.created`, `support_grant.used`, `support_grant.revoked`.
22. Audit log viewer at `/orgs/[orgSlug]/settings/audit`, `ORG_ADMIN` and above, paginated.

## Technical Constraints
- Business logic in `server/services`, not in components or route handlers.
- Multi-step writes use a transaction.
- All input validated with Zod on the server, sharing the schema with the form.
- No client-side data fetching for tenant data in this task — Server Components and Server Actions only.
- Do not create any Phase 2 table or screen. No product projects.

## Security Requirements
Restating the risks this task owns — each must be demonstrably closed:
- **S-1** cross-tenant access: the DAL plus RLS.
- **S-2** client-supplied tenant id: org context from the URL, re-verified server-side, every time.
- **S-3** platform-admin backdoor: `SupportGrant` only, expiring, logged, customer-visible.
- **S-5** invitation tokens: hashed, single use, expiring, email-bound.
- **S-6** privilege escalation: no self role-change, no last-admin removal, no `PLATFORM_ADMIN` invitations.
- **S-13** audit integrity: no update or delete path.
- **S-14** stale authorization: role and membership read per request, never from the session token.
- **S-16** direct Server Action invocation: independent re-authorization in every action.

## Tests Required

**Unit**
1. The permission matrix, exhaustively: every role × every capability. A new capability without a test must fail to compile.
2. Last-admin protection: demotion and removal both rejected.
3. Self role-change rejected.

**Integration — tenant isolation (the substance of the task)**
4. Org B's user requesting `/orgs/org-a` receives 404.
5. Org B's user calling every Server Action with Org A's slug receives 404 or an authorization error.
6. `getTenantDb(orgB).findFirst({ where: { id: <orgA row id> } })` returns `null` for every tenant model.
7. `getTenantDb(orgB).update()` on an Org A row affects zero rows.
8. `getTenantDb(orgB).delete()` on an Org A row affects zero rows.
9. Creating a row through `getTenantDb(orgB)` while passing `organization_id: orgA` writes the row to Org B or fails — it must never write to Org A.

**Integration — invitations**
10. A valid invitation accepted by the matching email creates the membership.
11. A valid invitation accepted by a **different** email is rejected.
12. An expired invitation is rejected.
13. A used invitation is rejected on reuse.
14. Only the hash is stored — assert no column contains the plaintext token.

**Integration — support grants**
15. A platform admin with **no** grant receives 404 on Org A — identical to any other outsider.
16. A platform admin with an **active** grant can read Org A, and an audit entry with the grant id appears in **Org A's** audit log.
17. A platform admin with an **expired** grant receives 404.
18. A grant with an expiry beyond 24 hours is rejected at creation.

**Integration — audit**
19. Every action in requirement 21 writes exactly one audit row with the correct actor, organization, and target.
20. A failed transaction writes no audit row.
21. `UPDATE` and `DELETE` on `audit_logs` are rejected by the database.

## Documentation Required
- `ARCHITECTURE.md`: mark §5 as implemented; document any deviation.
- `docs/AUTHORIZATION.md`: the DAL contract, the permission matrix, the org-context rule, and **the mandatory pattern every future feature must follow** — this becomes the reference for Phases 2–9.
- `API.md`: initial version covering the organization and membership actions.
- `CHANGELOG.md`, `KNOWN_LIMITATIONS.md`.

## Definition of Done
- [ ] All 21 tests pass
- [ ] Raw Prisma client unreachable from application code; ESLint proves it
- [ ] `findUnique` on tenant models is not exposed by the DAL
- [ ] Organization context provably cannot be influenced by a cookie, header, or body — **demonstrate an attempt and show it fails**
- [ ] Platform admin has no access without a grant
- [ ] Audit entries written for all eleven actions
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass
- [ ] CI green

## Commands to Run
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Expected Evidence
1. Full unedited output of the command above.
2. Test output with **each isolation test named individually** — a summary count is not sufficient.
3. The `getTenantDb` implementation quoted in full in the summary, so the injection logic can be reviewed directly.
4. The permission matrix quoted in full.
5. A demonstration of attempting to override the organization via a forged header or body value, showing it has no effect.
6. `SELECT * FROM audit_logs` after running the golden path, showing the entries.
7. Screenshots: organization selector, members list, invitation acceptance, audit log viewer.
8. `git diff --stat`.

**This task will be reviewed line by line.** State any place where you were unsure whether a query is properly scoped, rather than assuming it is.
