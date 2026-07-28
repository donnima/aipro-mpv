# WordPress Plugin Technical Spec — `aipro-platform-bridge`

**Status:** Planning (founder-approved architecture)  
**Last updated:** 2026-07-28  
**Does not ship PHP in this task** — specification only

---

## 1. Purpose

Production-minded custom WordPress plugin that bridges WordPress identity/UI to the AIPro headless backend.

**Working name:** `aipro-platform-bridge`

---

## 2. Responsibilities

1. WordPress user authentication bridge
2. WordPress role and capability mapping
3. Secure server-to-server communication with AIPro backend
4. Shortcodes and/or Gutenberg blocks for product screens
5. WordPress dashboard and frontend page integration
6. API error handling
7. Secure token management
8. CSRF protection
9. WordPress nonce validation
10. Authorization checks
11. User and organization mapping
12. Logout / session invalidation support
13. Optional webhook or synchronization handlers
14. WordPress admin configuration screen
15. Health-check and connection-test tools
16. Audit-friendly integration logs without sensitive secrets

---

## 3. Environment

| Item             | Requirement                                                      |
| ---------------- | ---------------------------------------------------------------- |
| WordPress        | Document supported LTS at implementation time (plan for WP 6.4+) |
| PHP              | Document supported version (plan for PHP 8.1+)                   |
| Coding standards | WordPress Coding Standards (PHPCS)                               |
| Multisite        | Optional — detect/configure; do not assume                       |

---

## 4. Package layout (planned)

```
aipro-platform-bridge/
  aipro-platform-bridge.php          bootstrap, activation hooks
  uninstall.php
  composer.json / vendor/            PSR-4 autoload
  includes/
    Auth/
    Tokens/
    Api/
    Mapping/
    Admin/
    Frontend/
    Rest/
    Logging/
  assets/
    dist/                            bundled React (Option B)
    src/
  blocks/
  languages/
  readme.txt
```

**Namespace (suggested):** `AIPro\PlatformBridge\`

---

## 5. Lifecycle

| Hook         | Behavior                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------ |
| Activation   | Register capabilities; create default options; flush rewrite rules if custom routes used   |
| Deactivation | Flush rewrites; leave options/mappings unless uninstall                                    |
| Uninstall    | Remove plugin options and local logs; **do not** delete Neon data; document key revocation |

---

## 6. Settings (admin)

Stored via WordPress Options API (autoload false for secrets):

- Backend base URL (HTTPS only)
- WordPress site identifier
- Token issuer settings / public key registration reference
- Signing key material (server-only; never echoed to UI after save)
- Capability → AIPro role mapping table
- Feature flags (webhooks on/off)
- Log retention

Admin UI: connection test, health check, last successful handshake, redacted recent errors.

---

## 7. Capabilities

Register (suggested):

- `aipro_access_platform`
- `aipro_manage_organization`
- `aipro_manage_projects`
- `aipro_analyze_projects`
- `aipro_review_reports`
- `aipro_view_assigned_projects`
- `aipro_upload_project_data`
- `aipro_manage_integration`

Map to AIPro roles via admin configuration — not by WP role slug alone.

---

## 8. Frontend integration (Option B)

- Register shortcodes e.g. `[aipro_dashboard]`, `[aipro_project list]`
- Register Gutenberg blocks where useful
- Enqueue bundled assets only on authenticated product pages
- Inherit theme chrome; no second domain; **no iframe by default**
- Accessibility: keyboard focus, ARIA on dynamic regions, respect WP a11y patterns
- Caching plugins: mark product pages as never-cache for authenticated users; vary by cookie
- CDN / reverse proxy: do not cache authenticated HTML; purge on logout when possible

---

## 9. REST routes (WordPress)

Under `aipro/v1/`:

- Proxy or bootstrap endpoints that require `is_user_logged_in()`, capability, and nonce
- Health: plugin-side connectivity check to backend `/api/v1/health`
- Mapping read for current user (server-resolved org — not client-chosen)

Input sanitization and output escaping on all paths.

---

## 10. HTTP client to backend

- TLS required; validate certificates
- Timeouts (connect + total) mandatory
- Limited retries with backoff for idempotent GETs only
- Translate backend structured errors to WP-safe messages
- Secure CORS: browser talks to WordPress origin, not directly to backend with secrets

---

## 11. Tokens

- Issue short-lived signed tokens (RS256 or EdDSA) in PHP only
- Claims: `jti`, `iss`, `aud`, `exp`, `wp_site_id`, `wp_user_id`, `org_id`, `role`, `scopes`
- Private key in server config; rotation supported
- On `wp_logout` / `clear_auth_cookie`: stop issuance; clear any plugin user cache

---

## 12. Logging

- Integration logs: request id, endpoint, status, duration, WP user id, site id
- Redact: Authorization headers, cookies, tokens, passwords, PII beyond ids
- Translation-ready strings (`text domain`: `aipro-platform-bridge`)

---

## 13. Compatibility notes

- Compatible with common caching plugins via explicit no-cache headers on product routes
- Compatible with reverse proxies when WordPress detects HTTPS correctly (`FORCE_SSL_ADMIN` etc. — document)
- Secure CORS policy favoring same-origin WP REST

---

## 14. Out of scope for plugin

- Storing AIPro domain data in WP DB beyond mapping/config/logs
- Implementing Auth.js or application passwords
- Serving as customer-facing second login domain
