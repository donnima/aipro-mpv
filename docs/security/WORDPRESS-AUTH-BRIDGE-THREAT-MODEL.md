# WordPress Auth Bridge — Threat Model

**Status:** Accepted companion to ADR-0021  
**Last updated:** 2026-07-28  
**Scope:** Documentation only — no production auth code yet

---

## 1. Assets

| Asset                                               | Sensitivity | Location                                             |
| --------------------------------------------------- | ----------- | ---------------------------------------------------- |
| WordPress credentials and sessions                  | Critical    | WordPress only                                       |
| Plugin signing private key / backend shared secrets | Critical    | Plugin server config / secrets store — never browser |
| Short-lived access tokens                           | High        | Memory / Authorization header — short TTL            |
| Organization-scoped product data                    | Critical    | Neon via backend                                     |
| Capability → role mapping config                    | High        | WP options (admin-protected)                         |
| Integration audit logs                              | Medium      | WP + Neon (redacted)                                 |

---

## 2. Trust boundaries

```
[Browser] --WP cookies+nonce--> [WordPress + Plugin]
                                      |
                                      | TLS + short-lived signed token
                                      v
                               [AIPro Backend]
                                      |
                                      v
                                    [Neon]
```

Untrusted: browser, any client-supplied role/org claims, cached UI state.  
Trusted for identity presentation: WordPress session after WP validation.  
Trusted for authorization decisions: **backend only**, after independent membership/role lookup.

---

## 3. Threats and mitigations

| ID   | Threat                                              |   Severity   | Mitigation                                                                 |
| ---- | --------------------------------------------------- | :----------: | -------------------------------------------------------------------------- |
| W-1  | Browser forges `organization_id` or role            | **Critical** | Org/role from server-side mapping + membership; ignore browser claims      |
| W-2  | Stolen permanent API secret in browser JS           | **Critical** | Secrets only on WordPress server; browser never receives signing keys      |
| W-3  | Token replay after logout                           |   **High**   | Short TTL; stop issuance on WP logout; optional `jti` denylist             |
| W-4  | Cross-tenant data via IDOR                          | **Critical** | Four-layer tenant isolation still mandatory (ADR-0004)                     |
| W-5  | CSRF on WP → plugin REST routes                     |   **High**   | WP nonces; capability checks; SameSite cookies                             |
| W-6  | SSRF / open proxy through plugin                    |   **High**   | Allow-listed backend base URL; no user-controlled host                     |
| W-7  | Log leakage of tokens/passwords                     |   **High**   | Redaction; never log Authorization, cookies, WP passwords                  |
| W-8  | Capability confusion (WP role name trusted alone)   |   **High**   | Map capabilities explicitly; backend re-checks Role enum                   |
| W-9  | Bidirectional sync creating credential copies       | **Critical** | Mapping rows only; no password/hash/session storage in Neon                |
| W-10 | iframe clickjacking / dual-domain UX                |  **Medium**  | Prefer Option B native embed; iframe only with founder approval            |
| W-11 | Stale cached API responses after logout             |  **Medium**  | Cache bust on logout; no-store for authenticated fragments                 |
| W-12 | Weak or static JWT without rotation                 |   **High**   | RS256/EdDSA; short exp; key rotation; unique jti                           |
| W-13 | MITM to backend                                     |   **High**   | TLS; validate certificates; pin where feasible                             |
| W-14 | Privilege escalation via invitation in wrong system |   **High**   | Prefer WP for identity invites; AIPro membership assignment admin-approved |
| W-15 | Multisite site-id confusion                         |   **High**   | Explicit `wp_site_id` in token and mapping uniqueness                      |

---

## 4. Explicitly rejected patterns

- Auth.js / NextAuth as customer identity
- Clerk, Supabase Auth
- Application-stored passwords or password reset
- Long-lived static JWTs
- Trusting WordPress checks without backend enforcement
- Customer-facing Vercel UI as primary login surface

---

## 5. Residual risks (founder/ops)

1. WordPress site compromise implies bridge compromise — harden WP (updates, least privilege, WAF).
2. Multisite vs single-site misconfiguration — must be confirmed before production keys are issued.
3. Email/display name cache drift — treat as non-authoritative display data only.

---

## 6. Verification expectations (future implementation)

- Adversarial tests: forged org/role claims rejected
- Expired and wrong-audience tokens rejected
- Logout stops new tokens; old tokens fail after TTL
- Isolation harness (TASK-005) still gates product data
- No Auth.js tables or password columns in Prisma schema
