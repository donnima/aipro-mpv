# WORDPRESS-INTEGRATION-FOUNDATION — Integration Foundation Task Spec

## Task ID

`TASK-007` companion / Phase 1+ foundation · Depends on **ADR-0021 Accepted** · Documentation landed under TASK-007

**Implementation of the WordPress plugin and API bridge is a later task.** This file is the durable specification those tasks must follow.

## Objective

Establish WordPress as the sole customer-facing identity and presentation layer, with AIPro as a headless product-intelligence backend.

## Authoritative documents

| Document                                                                                                           | Role                           |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| [`ADR-0021`](../../DECISIONS.md#adr-0021)                                                                          | Accepted architecture decision |
| [`docs/architecture/WORDPRESS-INTEGRATION-ARCHITECTURE.md`](../architecture/WORDPRESS-INTEGRATION-ARCHITECTURE.md) | System architecture + diagrams |
| [`docs/security/WORDPRESS-AUTH-BRIDGE-THREAT-MODEL.md`](../security/WORDPRESS-AUTH-BRIDGE-THREAT-MODEL.md)         | Threat model                   |
| [`docs/integration/WORDPRESS-PLUGIN-TECHNICAL-SPEC.md`](../integration/WORDPRESS-PLUGIN-TECHNICAL-SPEC.md)         | Plugin `aipro-platform-bridge` |
| [`docs/integration/WORDPRESS-BACKEND-API-CONTRACT.md`](../integration/WORDPRESS-BACKEND-API-CONTRACT.md)           | `/api/v1/` contract            |

## Must implement (future tasks)

1. Custom plugin `aipro-platform-bridge` with auth bridge, capability mapping, short-lived token minting, shortcodes/blocks, admin config, health check, CSRF/nonce, redacted logs.
2. Backend token validation (signature, iss, aud, exp, site id, user id, org id, role) + independent Neon membership enforcement.
3. Option B UI: bundled React (or WP-native screens) inside WordPress — **no iframe** without founder approval.
4. Logout: stop token issuance; short TTL; no stale user-specific cache; redirect to **WordPress** login only.
5. Phase 1 schema per revised `DATA_MODEL.md` §4 (no Auth.js tables).

## Must not implement

- Separate login/registration/password-reset pages in AIPro
- Auth.js, Clerk, Supabase Auth, application passwords
- Duplicate credentials or WordPress password hashes in Neon
- Second customer portal domain as primary UI
- Trusting browser-provided role or organization id alone

## Founder / admin inputs still required

- WordPress single-site vs Multisite
- Production WordPress site URL and admin access path for plugin install
- Neon `DATABASE_URL` + `DATABASE_URL_UNPOOLED`
- JWT signing key material (server-side only)

## Related superseded plans

- ADR-0005 (Auth.js) → Superseded by ADR-0021
- `docs/tasks/T-003-authentication.md` → Superseded
- Standalone Vercel customer UI as primary surface → Superseded (Vercel may host API only)
