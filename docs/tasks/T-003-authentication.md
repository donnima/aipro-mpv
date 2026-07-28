# T-003 — Authentication

## Task ID

`T-003` · Phase 1 · Depends on **T-002 approved** · Blocked until the founder supplies auth and email credentials

## Objective

Implement passwordless authentication with Auth.js v5 using database sessions: email magic link plus Google OAuth, sign-in and sign-out screens, session retrieval on the server, and route protection. No organizations yet — that is T-004.

## Business Reason

`MVP_SCOPE.md` success criterion 1 is "a user can sign in," and every subsequent authorization check depends on a trustworthy session. Splitting authentication (who you are) from authorization (what you may access, T-004) keeps each reviewable on its own; combining them is how tenancy bugs hide inside login code.

## Files or Areas Expected

```
apps/web/server/auth/
  config.ts              Auth.js configuration
  index.ts               auth(), signIn(), signOut() exports
  session.ts             requireUser() / getOptionalUser()
apps/web/app/(auth)/sign-in/page.tsx
apps/web/app/(auth)/verify-request/page.tsx
apps/web/app/(auth)/auth-error/page.tsx
apps/web/app/api/auth/[...nextauth]/route.ts
apps/web/middleware.ts
apps/web/server/email/                 provider adapter for magic links
packages/db/prisma/schema.prisma       Auth.js adapter alignment only
.env.example
```

## Functional Requirements

1. Auth.js v5 with the Prisma adapter and **database sessions, not JWT** (ADR-0005).
2. Providers: Email magic link (Resend or Postmark) and Google OAuth. **No credentials provider. No password field anywhere.**
3. Sign-in page styled with the §20 brand tokens: background `#F6F1EA`, text `#1F1F1F`, CTA `#B8906F`. Both providers offered.
4. `verify-request` page ("check your email") and an `auth-error` page with a non-technical message.
5. `requireUser()` — server-side helper returning the session user or redirecting to sign-in. `getOptionalUser()` for public pages.
6. Middleware protecting everything except `/`, `/sign-in`, `/verify-request`, `/auth-error`, `/api/auth/*`, `/api/health`, and static assets. **The public allow-list must be an explicit array with a comment stating it is a security-review item** (risk S-17).
7. Sign-out invalidates the database session row, not just the cookie.
8. New users are created on first sign-in with no memberships. A signed-in user with no organization sees a placeholder page — T-004 replaces it.
9. Session lifetime 30 days with rolling refresh; absolute maximum 90 days.

## Technical Constraints

- Auth.js v5 App Router patterns. No `getServerSession` from v4.
- Session access on the server only. **Never expose the session object or user email to a client component that does not need it.**
- No `useSession` polling; prefer server components.
- Do not add an authorization or role concept in this task. Roles arrive in T-004.
- Do not modify the Phase 1 schema beyond what the Auth.js adapter requires; those tables already exist from T-002.

## Security Requirements

- Cookies: `httpOnly`, `secure` in production, `sameSite: lax`, `__Secure-` prefix in production.
- `AUTH_SECRET` from the environment, minimum 32 bytes. Never committed, never logged.
- Auth.js CSRF protection enabled and not weakened.
- Magic link tokens: single use, 10-minute expiry, invalidated on use.
- Rate limit sign-in requests per email and per IP (Postgres-backed fixed window — no Redis, ADR-0014).
- **Email enumeration:** the sign-in flow must return an identical response and identical timing whether or not the email exists.
- OAuth: exact `redirect_uri` allow-list; no open redirect after sign-in — validate any `callbackUrl` against a same-origin allow-list.
- Errors are generic to the client; detail goes to the server log with a correlation id (S-20).
- Audit-log `auth.signed_in`, `auth.signed_out`, and `auth.sign_in_failed` with IP and user agent. `organization_id` is null at this stage.

## Tests Required

Integration:

1. Magic-link sign-in creates a user and a session row.
2. A used magic-link token is rejected on second use.
3. An expired magic-link token is rejected.
4. Sign-out deletes the session row; the cookie no longer authenticates.
5. An unauthenticated request to a protected route redirects to sign-in.
6. An authenticated request to a protected route succeeds.
7. Rate limiting triggers after the configured threshold.
8. A `callbackUrl` pointing to an external origin is rejected.
9. Sign-in responses for an existing and a non-existent email are indistinguishable in status and body.

Unit: 10. The middleware public allow-list matches the documented list exactly — this test fails if someone adds a public route without updating the documentation.

E2E (Playwright, CI only): 11. Golden path: visit protected route → redirected → sign in via a test-mode magic link → land on the protected route.

## Documentation Required

- `docs/AUTHENTICATION.md`: providers, session strategy, lifetime, the public route allow-list, and how to obtain credentials.
- `.env.example`: `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `EMAIL_FROM`, and the email provider key — all empty, each commented.
- `README.md`: sign-in setup for a new developer.
- `KNOWN_LIMITATIONS.md`: update.

## Definition of Done

- [ ] Sign-in works with both providers against real credentials
- [ ] Sign-out invalidates the database session
- [ ] Protected routes redirect when unauthenticated
- [ ] All eleven tests pass
- [ ] No password field, no credentials provider anywhere in the codebase
- [ ] No secret committed; `gitleaks` green
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass
- [ ] CI green

## Commands to Run

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm --filter web test:e2e
```

## Expected Evidence

1. Full unedited output of the command above.
2. Screenshots: sign-in page, verify-request page, and the authenticated placeholder page.
3. `SELECT id, "userId", expires FROM sessions` before and after sign-out, showing the row removed.
4. Response headers from a sign-in showing the cookie flags.
5. Terminal output of the token-reuse and expiry tests.
6. Two sign-in responses — existing and non-existent email — shown side by side, demonstrating they are indistinguishable.
7. `git diff --stat`.

If either provider cannot be tested because a credential is missing, **say so explicitly and state which test was not run**. Do not mark it passing.
