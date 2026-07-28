# WordPress ↔ AIPro Backend API Contract

**Status:** Planning (founder-approved architecture)  
**Prefix:** `/api/v1/`  
**Last updated:** 2026-07-28  
**Implementation:** deferred — contract for Part B+ and plugin work

---

## 1. Principles

The backend API must:

- Accept only trusted tokens (signed by the WordPress bridge or exchanged through it)
- Enforce tenant isolation independently
- Enforce application roles independently
- Validate every input
- Return structured errors
- Support idempotency for sensitive writes
- Create audit logs
- Never trust browser-provided WordPress role data
- Never expose database identifiers unnecessarily
- Never return another organization’s data
- Support token revocation or short expiration
- Support health checks
- Expose versioned endpoints

---

## 2. Authentication

```
Authorization: Bearer <short-lived-signed-token>
```

### Required token claims

| Claim        | Meaning                                          |
| ------------ | ------------------------------------------------ |
| `iss`        | WordPress bridge issuer id                       |
| `aud`        | AIPro API audience                               |
| `exp`        | Short expiry                                     |
| `jti`        | Unique token id                                  |
| `wp_site_id` | WordPress site identifier                        |
| `wp_user_id` | WordPress user id                                |
| `org_id`     | Mapped AIPro organization UUID (server-assigned) |
| `role`       | Mapped AIPro role enum                           |
| `scopes`     | Explicit scopes array                            |

Backend validation: signature, issuer, audience, expiration, site id, user id, org id, mapped role, scopes. Then **re-load** membership from Neon and compare — token role is a hint, membership is authoritative.

---

## 3. Common headers

| Header            | Use                                                  |
| ----------------- | ---------------------------------------------------- |
| `Authorization`   | Bearer token                                         |
| `X-Request-Id`    | Correlation (client may supply; server may generate) |
| `Idempotency-Key` | Required on sensitive POSTs/PATCHes                  |
| `Accept`          | `application/json`                                   |

---

## 4. Error shape

```json
{
  "error": {
    "code": "FORBIDDEN_ORG",
    "message": "Human-safe summary",
    "requestId": "uuid",
    "details": []
  }
}
```

No stack traces, connection strings, or cross-tenant existence leaks (prefer 404 over 403 for missing cross-tenant resources — ADR-0004).

---

## 5. Health

`GET /api/v1/health`

Returns overall status and boolean database reachability. No secrets, hosts, or schema names.

---

## 6. Identity mapping (backend)

`POST /api/v1/identity/resolve` (server-to-server from plugin)

Upsert/read mapping for `(wp_site_id, wp_user_id)` → internal user UUID + memberships. Does not accept passwords.

---

## 7. Organization-scoped resources (illustrative)

All under `/api/v1/orgs/{orgId}/...` where `{orgId}` must match token + membership:

- `GET/POST .../projects`
- `GET/PATCH .../projects/{projectId}`
- Domain resources per DATA_MODEL phases (profile, markets, evidence, competitors, suppliers, quotes, economics, assessments, risks, readiness, blueprints, reviews, reports, actuals)

Exact OpenAPI deferred to implementation tasks. This document locks **auth and tenancy rules**, not every field.

---

## 8. Audit

Sensitive mutations write `audit_logs` with actor (mapped user), organization, action, correlation id, and optional support grant id.

---

## 9. CORS

Prefer **no** permissive browser CORS to the AIPro API for customer flows. Browser → WordPress; WordPress → API. If limited direct browser calls are ever approved, they must use short-lived tokens only and a strict allow-list of WordPress origins — never long-lived secrets.

---

## 10. Versioning

Breaking changes require `/api/v2/`. Deprecation notices in response headers for sunset timelines.
