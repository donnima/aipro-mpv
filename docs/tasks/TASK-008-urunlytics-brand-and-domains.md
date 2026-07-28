# TASK-008 — Record Urunlytics Brand and Domains

**Task ID:** `TASK-008` · Documentation only  
**Depends on:** TASK-007 (ADR-0021 Accepted)  
**Blocks:** Clarifies production hostnames for WordPress bridge and API; does **not** unblock Part B alone

## Founder authorization

The founder supplied:

| Field             | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Brand             | Urunlytics                                            |
| Product           | AI Product & Market Opportunity Intelligence Platform |
| Primary domain    | urunlytics.com                                        |
| WordPress website | urunlytics.com                                        |
| Backend API       | api.urunlytics.com                                    |

## Objective

Record brand and domain configuration in authoritative committed docs. Update status blockers. Do not implement DNS, TLS, plugin, or Prisma.

## In scope

- `docs/decisions/FOUNDER-BRAND-AND-DOMAINS.md`
- Cross-links in architecture / deployment / README / `.env.example`
- Status lock release; Next Action for remaining founder inputs

## Out of scope

- Neon credentials
- Multisite vs single-site determination (still open)
- TASK-002 Part B implementation
- Live DNS or Vercel project creation

## Definition of done

- [x] Brand/domain doc committed
- [x] Status updated; lock released
- [x] Remaining blockers listed (Neon, Multisite, Part B auth)
