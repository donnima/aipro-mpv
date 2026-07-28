# T-005 — Tenant Isolation Gate

## Task ID

`T-005` · Phase 1 · Depends on **T-004 approved** · **This task is the Phase 1 gate**

## Objective

Build a reusable, adversarial tenant-isolation and authorization test harness that proves — not asserts — that Organization B cannot reach any of Organization A's data through any route, action, or file path. Fix whatever it finds. Then the gate opens.

## Business Reason

The operating system is unambiguous: _"Do not build product projects until tenant isolation is verified."_ T-004 implemented isolation; this task attempts to break it. The distinction matters — a developer testing their own design tends to test the paths they already thought about. This task exists to test the paths they did not.

It also produces the harness that every later phase extends. When Phase 3 adds suppliers, adding a supplier to the fixture must automatically subject it to every isolation assertion. If that harness is designed well here, isolation stays proven for free through Phase 9. If it is designed as a one-off test file, isolation quietly degrades.

## Files or Areas Expected

```
apps/web/test/isolation/
  harness.ts             the reusable, resource-driven engine
  resources.ts           the registry every future phase appends to
  fixtures.ts            two orgs, four users, one platform admin
  routes.spec.ts         every route under /orgs/[orgSlug]
  actions.spec.ts        every Server Action
  dal.spec.ts            direct DAL-level probes
  support-grants.spec.ts
  permissions.spec.ts    role matrix across real endpoints
apps/web/test/helpers/
docs/TESTING.md
SECURITY.md              initial version
```

## Functional Requirements

1. **Fixtures.** Two organizations with no relationship. Org A: an admin, an analyst, a client viewer. Org B: an admin. Plus one platform admin with no grant. Every user has a real session.

2. **Resource registry** (`resources.ts`). A typed list describing every tenant-owned resource: its Prisma model, its route path template, its Server Actions, and a factory that creates one in a given organization. **Every future phase must append to this list; the harness derives its assertions from it.** A resource present in the schema but absent from the registry must fail a test — write that test.

3. **Route isolation.** For every route under `/orgs/[orgSlug]`, assert that Org B's admin receives **404** — never 403, never 200, never a redirect that leaks existence, and never an error page containing Org A's name or slug.

4. **Server Action isolation.** For every Server Action, invoke it directly — bypassing the UI — as Org B's user, with Org A's identifiers, and assert it fails. Also invoke with a valid Org B context but Org A's row id, and assert it fails.

5. **DAL isolation.** For every registered resource, assert `findFirst`, `findMany`, `update`, `delete`, `count`, and `aggregate` through Org B's scoped client cannot observe or affect Org A's rows.

6. **Enumeration.** Assert that response bodies, status codes, and timing do not distinguish "exists in another organization" from "does not exist at all."

7. **Permission matrix, end to end.** For every role, assert every capability is permitted or denied at the real endpoint, not merely in the matrix unit test. In particular: a `CLIENT_VIEWER` cannot create, update, or delete anything, and cannot reach settings, invitations, or the audit log.

8. **Support grants.** No grant → 404. Active grant → access plus an audit row in Org A's log. Expired grant → 404. Revoked grant → 404. Grant for Org A does not grant access to Org B.

9. **Cross-tenant references.** Attempt to create a child row in Org B referencing an Org A parent. Assert it fails at the database level, not only in application code. This is what the composite foreign keys in `DATA_MODEL.md` §12 exist to prevent.

10. **RLS still holds when the DAL is bypassed.** Using the raw client with `app.current_organization_id` set to Org B, assert Org A's rows are invisible. This proves layer 3 independently of layer 2.

11. **Session and role currency.** Removing a user from an organization mid-session revokes access on the next request. Demoting an `ORG_ADMIN` to `ANALYST` mid-session immediately removes admin capability (risk S-14).

12. **Audit integrity.** `UPDATE` and `DELETE` on `audit_logs` are rejected by database grants, not only by the DAL.

13. **`pnpm test:isolation`** runs the suite standalone and is a required, separately-named CI job — so a failure is visibly an isolation failure, not a generic test failure.

14. **Fix every finding.** If the harness finds a gap, fix it in T-004's code and add the regression test. Report each finding, its root cause, and its fix — **a task that finds nothing at all should be treated as suspicious and the harness re-examined.**

## Technical Constraints

- Tests run against a real PostgreSQL with RLS active. No mocked database, no stubbed authorization.
- The harness must be data-driven from `resources.ts`, not a hand-written test per resource. Hand-written per-resource tests do not survive nine phases.
- Do not weaken any authorization check to make a test pass. If a test fails, the code is wrong, not the test.
- No Phase 2 features. This task adds tests and fixes, not product surface.

## Security Requirements

- The harness must not depend on any test-only bypass, backdoor, or environment flag that could exist in production. It authenticates as real users through the real session mechanism.
- Fixture data must be obviously synthetic (`Org A Test`, `analyst-a@example.test`) and must never resemble a real customer.
- No credential in test files. Test credentials come from the environment or are generated per run.

## Tests Required

The whole task is tests. Coverage must include, at minimum:

- Every route under `/orgs/[orgSlug]` × Org B user → 404
- Every Server Action × Org B user × Org A id → rejected
- Every registered resource × six DAL operations → isolated
- Every role × every capability → correct at a real endpoint
- Four support-grant states → correct
- Cross-tenant foreign key → rejected by the database
- RLS with the DAL bypassed → isolated
- Mid-session removal and demotion → immediate effect
- Audit `UPDATE`/`DELETE` → rejected
- A resource in the schema but missing from the registry → test fails

## Documentation Required

- `TESTING.md`: the testing strategy, how the harness works, and **how to register a new resource — required reading for every later phase**.
- `SECURITY.md`, initial version: the tenancy model, the four isolation layers, the role matrix, the support-grant policy, what is tested, and what is explicitly not yet covered.
- `ARCHITECTURE.md`: record the Phase 1 gate result.
- `CHANGELOG.md`, `KNOWN_LIMITATIONS.md`.

## Definition of Done

- [ ] Every requirement above has passing tests
- [ ] `pnpm test:isolation` passes and is a named CI job
- [ ] Every finding is fixed with a regression test, and each is reported with its root cause
- [ ] No authorization check was weakened to make a test pass — state this explicitly
- [ ] `SECURITY.md` and `TESTING.md` exist
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass
- [ ] CI green

## Commands to Run

```bash
pnpm test:isolation && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Expected Evidence

1. Full unedited output of `pnpm test:isolation` with **every test name visible** — this output is the gate artifact and will be re-read at Phase 11 hardening.
2. The resource registry quoted in full.
3. For each finding: the failing output before the fix, the diff, and the passing output after.
4. Proof of the negative controls — deliberately break isolation in one place, show the harness catches it, then revert. **A harness that has never been seen to fail has not been shown to work.**
5. `SELECT * FROM audit_logs WHERE organization_id = '<org A>'` showing the support-grant entries.
6. The CI run URL with the isolation job named separately.
7. `git diff --stat`.

## Gate Decision

On acceptance, Claude records the Phase 1 gate as **PASSED** in `ARCHITECTURE.md` and Phase 2 opens. Until then, **no product project code may be written.** If the harness cannot be completed, the gate stays closed — report that plainly rather than narrowing the harness to fit.
