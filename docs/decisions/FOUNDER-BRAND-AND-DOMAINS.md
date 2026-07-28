# Founder Brand and Domains — Urunlytics

**Status:** Recorded 2026-07-28 (founder-supplied)  
**Task:** [TASK-008](../tasks/TASK-008-urunlytics-brand-and-domains.md)  
**Architecture:** ADR-0021 (WordPress-owned identity and presentation)

---

## Brand

| Field                        | Value                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| **Brand**                    | Urunlytics                                                                          |
| **Product**                  | AI Product & Market Opportunity Intelligence Platform                               |
| **Internal / repo codename** | AIPro MVP (monorepo packages remain `@aipro/*` unless a later rename is authorized) |

---

## Domains (production)

| Role                                           | Hostname             | Notes                                                            |
| ---------------------------------------------- | -------------------- | ---------------------------------------------------------------- |
| **Primary domain**                             | `urunlytics.com`     | Brand apex                                                       |
| **WordPress website (customer UI + identity)** | `urunlytics.com`     | Login, registration, product screens via `aipro-platform-bridge` |
| **Backend API (headless)**                     | `api.urunlytics.com` | Versioned AIPro API (`/api/v1/…`); **not** the customer login UI |

WordPress remains the primary customer-facing website. The API host must not be marketed or used as a second customer portal (ADR-0021).

---

## Logical mapping

```
https://urunlytics.com          → WordPress + aipro-platform-bridge
https://api.urunlytics.com      → AIPro backend (Neon-backed)
```

Suggested env alignment (values empty in `.env.example` until provisioned):

- `AIPRO_API_PUBLIC_URL` → `https://api.urunlytics.com` (production)
- `WORDPRESS_SITE_ID` → configured against the live `urunlytics.com` install (exact site id TBD)
- JWT `aud` / issuer strings should name the Urunlytics API audience when implemented

---

## Still open (founder / admin)

1. **WordPress single-site vs Multisite** for `urunlytics.com`
2. **Neon** `DATABASE_URL` + `DATABASE_URL_UNPOOLED`
3. Explicit authorization to start **revised TASK-002 Part B**
4. DNS / TLS for `api.urunlytics.com` when the API is first deployed (later phase)

---

## Non-goals of this record

- Renaming the GitHub repository or `@aipro/*` packages (separate decision)
- Inventing credentials, customers, or traction claims
