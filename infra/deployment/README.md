# Deployment

Preferred MVP targets (`ARCHITECTURE.md` §10, **ADR-0021**):

| Surface                                    | Host                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Brand**                                  | **Urunlytics**                                                                                          |
| **Primary customer website / product UI**  | **WordPress** at **https://urunlytics.com** + `aipro-platform-bridge`                                   |
| **AIPro backend API** (headless)           | **https://api.urunlytics.com** (Vercel or containers per Q6) — API only, not the main customer login UI |
| **Application database**                   | **Neon** PostgreSQL (EU) — **not** merged with the WordPress database                                   |
| Object storage                             | Cloudflare R2                                                                                           |
| Identity (login, password reset, sessions) | **WordPress only** on `urunlytics.com` — no Auth.js / Clerk / Supabase Auth                             |

Authority: [`docs/decisions/FOUNDER-BRAND-AND-DOMAINS.md`](../../docs/decisions/FOUNDER-BRAND-AND-DOMAINS.md).

Detailed runbooks land in later phases. WordPress Multisite vs single-site for `urunlytics.com` remains a founder/admin configuration question.
