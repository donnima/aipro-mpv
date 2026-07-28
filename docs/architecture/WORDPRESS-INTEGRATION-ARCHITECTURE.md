# WordPress Integration Architecture

**Status:** Accepted (founder-approved 2026-07-28)  
**ADR:** [ADR-0021](../../DECISIONS.md#adr-0021)  
**Companions:** [Plugin technical spec](../integration/WORDPRESS-PLUGIN-TECHNICAL-SPEC.md) · [API contract](../integration/WORDPRESS-BACKEND-API-CONTRACT.md) · [Threat model](../security/WORDPRESS-AUTH-BRIDGE-THREAT-MODEL.md)

---

## 1. Summary

The initial brand website is an **existing WordPress website**. WordPress is the authoritative system for public pages, registration, login, password reset, session management, account/profile management, roles and capabilities, menus, and **all customer-facing and analyst-facing product screens**.

The AIPro application does **not** create a separate authentication system. The standalone Next.js app acts as a **headless product-intelligence backend and API layer**. Neon/PostgreSQL remains the application database and is never merged with the WordPress database.

---

## 2. Target logical architecture

```
WordPress Website
  → AIPro WordPress Integration Plugin (aipro-platform-bridge)
    → Secure AIPro Backend API (/api/v1/)
      → PostgreSQL / Neon
      → AI and reporting services
```

| Layer                            | Owns                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| WordPress                        | Identity, sessions, profile, capabilities, page presentation, navigation                            |
| Plugin (`aipro-platform-bridge`) | Auth bridge, capability mapping, short-lived tokens, shortcodes/blocks, admin config, health checks |
| AIPro backend                    | Organizations, memberships, product intelligence domain, authorization, audit, AI logs              |
| Neon                             | Application data only — never WordPress credentials or session cookies                              |

Vercel may host the backend API or internal services. **Vercel hosting does not change WordPress ownership of UI and identity.** Do not expose a second application domain as the main customer interface.

---

## 3. Integration mode recommendation (MVP)

| Option | Description                                                                                                                          | Verdict                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **A**  | Plugin renders native PHP pages and calls backend APIs                                                                               | Viable but slower UI iteration                                                                                       |
| **B**  | Plugin loads a **bundled React frontend** inside authenticated WordPress pages; WordPress owns auth; backend provides versioned APIs | **Recommended for MVP**                                                                                              |
| **C**  | Plugin proxies selected Next.js-rendered fragments                                                                                   | Extra hop; harder caching/CDN story                                                                                  |
| **D**  | iframe embedding                                                                                                                     | **Rejected by default** — only with founder approval if a documented constraint makes native integration impractical |

**Default: Option B.** Users experience one website, one login, one account, one navigation system.

---

## 4. Data ownership boundaries

```mermaid
flowchart LR
  subgraph WP["WordPress (authoritative)"]
    ID[Identity / login / session]
    PROF[Profile / contact]
    CAP[Roles and capabilities]
    UI[Pages / menus / theme]
  end
  subgraph MAP["Mapping only in Neon"]
    UIM[identity_mappings]
    MEM[memberships]
  end
  subgraph AIPRO["AIPro backend / Neon (authoritative)"]
    ORG[organizations]
    PROJ[product projects and domain]
    AUD[audit / AI logs / reports]
  end
  ID --> UIM
  CAP --> MEM
  UIM --> ORG
  MEM --> ORG
  ORG --> PROJ
  PROJ --> AUD
```

**WordPress authoritative fields:** authentication identity, login session, display name/profile (source of truth), basic contact info, site-level roles/capabilities, page presentation, navigation.

**AIPro authoritative fields:** organizations, memberships (application roles), all product-intelligence records, commercial analysis, supplier data, calculations, reports, AI outputs, audit events, project-specific permissions.

**Cached (non-authoritative) in AIPro:** email and display name only when needed for product operation, with WordPress remaining source of truth. Prefer reference mapping over duplicated user data. Avoid bidirectional sync unless required.

**Never store in Neon:** WordPress passwords, password hashes, password reset tokens, WordPress session cookies.

---

## 5. Authentication flow

```mermaid
sequenceDiagram
  participant U as User
  participant WP as WordPress
  participant P as aipro-platform-bridge
  participant API as AIPro Backend
  participant DB as Neon

  U->>WP: Login (WP form)
  WP->>WP: Validate credentials / session
  U->>WP: Open product page
  WP->>P: Verify WP user + capabilities
  P->>P: Issue short-lived signed token
  P->>API: API call + Bearer token (server-side)
  API->>API: Validate signature, iss, aud, exp, site, user, org, role, scopes
  API->>DB: Org-scoped query
  DB-->>API: Data
  API-->>P: Structured response
  P-->>WP: Render inside theme
  WP-->>U: One-site UX
```

Rules:

- Never send a permanent backend secret to the browser.
- Never use WordPress passwords outside WordPress.
- Never copy WordPress password hashes into AIPro.
- Never trust a role or organization ID provided only by the browser.

---

## 6. Token issuance flow

```mermaid
flowchart TD
  A[WP session valid] --> B[Plugin checks capability]
  B --> C{Mapped org + role?}
  C -->|no| D[Deny / prompt admin assignment]
  C -->|yes| E[Sign short-lived token RS256 or EdDSA]
  E --> F[Claims: jti, iss, aud, exp, wp_site_id, wp_user_id, org_id, role, scopes]
  F --> G[Server-side call to /api/v1/...]
  G --> H[Backend validates all claims]
```

Preferred characteristics: RS256 or EdDSA; short expiration; issuer and audience validation; key rotation; unique `jti`; WordPress site ID; WordPress user ID; application organization ID; mapped role; explicit scopes. No long-lived static JWTs. Private keys never in browser JavaScript.

---

## 7. WordPress → backend request flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant WP as WordPress REST / page
  participant P as Plugin
  participant API as Backend

  B->>WP: Cookie auth + WP REST nonce
  WP->>WP: Capability check + sanitize
  WP->>P: Trusted server context
  P->>API: TLS + short-lived token
  Note over P,API: Timeouts, no secret logging
  API-->>P: Structured JSON / errors
  P-->>WP: Translate errors
  WP-->>B: Escaped HTML / JSON via WP
```

Browser→WordPress: WP auth cookies, REST nonces, capability checks, sanitization, escaping.  
WordPress→backend: server-side signed/short-lived tokens, TLS, cert validation, timeouts, redacted logs.

---

## 8. Role and capability mapping

```mermaid
flowchart LR
  WC[WP capabilities] --> PM[Plugin mapping config]
  PM --> AR[AIPro Role enum]
  AR --> BE[Backend permission matrix]

  WC1[aipro_access_platform] --> R1[CLIENT_VIEWER+]
  WC2[aipro_manage_organization] --> R2[ORG_ADMIN]
  WC3[aipro_analyze_projects] --> R3[ANALYST]
  WC4[aipro_manage_integration] --> R4[PLATFORM_ADMIN path]
```

Initial AIPro roles: `PLATFORM_ADMIN`, `ORG_ADMIN`, `ANALYST`, `CLIENT_VIEWER`.

Do **not** rely only on WordPress role names. Use capabilities or plugin-controlled mapping. Backend **independently** enforces permissions; WordPress checks alone are not sufficient.

Suggested capabilities: `aipro_access_platform`, `aipro_manage_organization`, `aipro_manage_projects`, `aipro_analyze_projects`, `aipro_review_reports`, `aipro_view_assigned_projects`, `aipro_upload_project_data`, `aipro_manage_integration`.

---

## 9. Organization mapping

```mermaid
flowchart TD
  U[WP user] --> M[Trusted mapping record]
  M --> O[organization_id in Neon]
  O --> Q[All queries org-scoped]
  B[Browser-supplied org id] -->|rejected| X[Ignored]
```

Organization mapping is resolved through trusted WordPress user mapping, server-side membership lookup, or administrator-approved assignment. The browser must not select an arbitrary organization ID.

---

## 10. Logout and token expiration

```mermaid
sequenceDiagram
  participant U as User
  participant WP as WordPress
  participant P as Plugin
  participant API as Backend

  U->>WP: Logout
  WP->>WP: Destroy WP session
  WP->>P: Session invalid
  P-->>P: Stop issuing tokens
  Note over API: Existing short-lived tokens expire quickly
  P->>P: Bust user-specific caches
  U->>WP: Hit product page
  WP-->>U: Redirect to WP login (not app login)
```

---

## 11. Product page rendering flow (Option B)

```mermaid
flowchart TD
  A[WP page with shortcode/block] --> B{User logged in?}
  B -->|no| C[Redirect to WP login]
  B -->|yes| D[Plugin bootstraps bundled React app]
  D --> E[App requests data via WP proxy or server-issued token path]
  E --> F[Backend /api/v1]
  F --> G[Render inside WP theme chrome]
```

Planned screens (inherit WordPress theme): product dashboard, project list, create product project, product profile, target market, market evidence, competitors, suppliers, supplier quotes, cost scenarios, unit economics, opportunity score, confidence, risk flags, channel readiness, launch blueprint, growth blueprint, analyst review, report preview, actual performance, account-linked project access.

---

## 12. Multisite

**Do not assume Multisite.** Whether the existing install is single-site or Multisite is a **founder/administrator configuration question** (not detectable from this repository).

| Mode        | Site identifier                                            | User mapping                                     |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------ |
| Single-site | Configured `wp_site_id` / site URL hash in plugin settings | `(wp_site_id, wp_user_id)` → `identity_mappings` |
| Multisite   | Blog/site ID from WordPress + network domain               | Same composite key; membership may be per-site   |

---

## 13. Backend ownership (domain)

The AIPro backend owns: organizations, organization membership mapping, product projects, product profiles, target markets, market evidence, competitors, suppliers and quotes, unit economics, opportunity assessments, confidence assessments, risk flags, channel readiness, launch/growth blueprints, analyst reviews, reports, actual performance, AI execution logs, audit logs.

API prefix: `/api/v1/`. See [WORDPRESS-BACKEND-API-CONTRACT.md](../integration/WORDPRESS-BACKEND-API-CONTRACT.md).

---

## 14. Explicit non-goals

Do **not** implement: separate login/registration pages, password storage/reset in AIPro, Auth.js, Clerk, Supabase Auth, custom application passwords, duplicate credentials, a second customer account system, customer-facing Vercel UI as the primary interface, iframe embedding without founder approval.
