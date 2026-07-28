# Deployment

Preferred MVP targets (`ARCHITECTURE.md` §10, **ADR-0021**):

| Surface                                    | Host                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| **Primary customer website / product UI**  | Existing **WordPress** site + `aipro-platform-bridge`                        |
| **AIPro backend API** (headless)           | **Vercel** or container host (Q6) — API only, not the main customer login UI |
| **Application database**                   | **Neon** PostgreSQL (EU) — **not** merged with the WordPress database        |
| Object storage                             | Cloudflare R2                                                                |
| Identity (login, password reset, sessions) | **WordPress only** — no Auth.js / Clerk / Supabase Auth                      |

Detailed runbooks land in later phases. WordPress Multisite vs single-site is a founder/admin configuration question.
