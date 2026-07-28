# CURRENT_STATUS.md — Product Intelligence Platform

**Last updated:** 2026-07-28 (TASK-008 Urunlytics brand/domains recorded — lock released)
**Branch:** `main` · **Remote:** `donnima/aipro-mpv` (public)

---

## Agent lock

| Field                           | Value                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Active Agent**                | `none`                                                                                                                   |
| **Write Lock Owner**            | `none`                                                                                                                   |
| **Active Task**                 | `none`                                                                                                                   |
| **Authoritative Commit**        | `ca01d8b` (update to TASK-008 commit SHA after land)                                                                     |
| **Allowed Paths**               | `none` — no agent holds the lock                                                                                         |
| **Forbidden Paths**             | `*` — all product/process writes require acquiring the lock first                                                        |
| **Next Action**                 | Founder confirms WordPress single-site vs Multisite, supplies Neon credentials, then authorizes revised TASK-002 Part B. |
| **Authoritative Review**        | `docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md` (committed)                                                              |
| **Authoritative Review Commit** | `780e627`                                                                                                                |
| **Cursor Action Permitted**     | `no`                                                                                                                     |
| **Founder Authorization**       | `none` — idle (TASK-008 recorded Urunlytics brand/domains from founder)                                                  |

---

## Status block

| Field               | Value                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Current Task**    | TASK-002 Part B (revised under ADR-0021)                                                                                        |
| **Previous Task**   | TASK-008 — Urunlytics brand and domains                                                                                         |
| **Previous Status** | **COMPLETE** — brand/domains recorded                                                                                           |
| **Current Status**  | **BLOCKED**                                                                                                                     |
| **Blocking Reason** | Neon `DATABASE_URL` / `DATABASE_URL_UNPOOLED`, WordPress Multisite vs single-site, and founder authorization for revised Part B |

**No Part B task is issued until** Multisite confirmation + Neon credentials are supplied and status grants Cursor the write lock for revised Part B per ADR-0021 schema.

---

## Where the project stands

Phase 0 tooling baseline: accepted. TASK-002 Part A: accepted. Agent Lock Protocol in force. TASK-006 extracted Q3/Q4/Q6. TASK-007 / ADR-0021 Accepted. **Brand:** Urunlytics — WordPress `urunlytics.com`, API `api.urunlytics.com` ([FOUNDER-BRAND-AND-DOMAINS.md](../decisions/FOUNDER-BRAND-AND-DOMAINS.md)). Neon and Multisite confirmation still required before Part B.

---

## Task ledger

| Task             | Title                                            | Status                                                | Review                                                                                                              |
| ---------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TASK-001         | Repository and tooling baseline                  | APPROVED WITH FOLLOW-UP                               | [TASK-001-CLAUDE-REVIEW.md](../reviews/TASK-001-CLAUDE-REVIEW.md)                                                   |
| TASK-002 Part A  | Purity boundary, CI, Dependabot hardening        | **APPROVED WITH FOLLOW-UP — follow-ups closed**       | [TASK-002-PART-A-CLAUDE-REVIEW.md](../reviews/TASK-002-PART-A-CLAUDE-REVIEW.md)                                     |
| TASK-006         | Founder decisions extraction (Q3/Q4/Q6)          | **COMPLETE**                                          | [FOUNDER-DECISIONS-EXTRACTION-CURSOR-SELF-REVIEW.md](../reviews/FOUNDER-DECISIONS-EXTRACTION-CURSOR-SELF-REVIEW.md) |
| TASK-007         | WordPress identity and presentation architecture | **COMPLETE** (docs only)                              | [WORDPRESS-ARCHITECTURE-CURSOR-SELF-REVIEW.md](../reviews/WORDPRESS-ARCHITECTURE-CURSOR-SELF-REVIEW.md)             |
| TASK-008         | Urunlytics brand and domains                     | **COMPLETE**                                          | [TASK-008-URUNLYTICS-BRAND-CURSOR-SELF-REVIEW.md](../reviews/TASK-008-URUNLYTICS-BRAND-CURSOR-SELF-REVIEW.md)       |
| TASK-002 Part B  | Database foundation (WP identity mappings)       | **BLOCKED** — Neon + Multisite + Part B authorization | —                                                                                                                   |
| TASK-003 / T-003 | Auth.js authentication                           | **SUPERSEDED** by ADR-0021                            | —                                                                                                                   |
| TASK-004         | Organizations, memberships, tenant DAL           | Draft — UI path via WordPress (ADR-0021)              | —                                                                                                                   |
| TASK-005         | Tenant isolation gate                            | Draft, blocked on Part B                              | —                                                                                                                   |

---

## Blocked on the founder

| #   | Item                                                        | Blocks                                                                                                    |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| —   | `DATABASE_URL` + `DATABASE_URL_UNPOOLED` (Neon)             | TASK-002 Part B and all of Phase 1 after it                                                               |
| —   | WordPress single-site vs Multisite for `urunlytics.com`     | Auth bridge site-id mapping                                                                               |
| —   | Authorize revised TASK-002 Part B (ADR-0021 schema)         | Database implementation                                                                                   |
| Q3  | Confirm analyst-led concierge, not self-serve SaaS          | Phase 2 scope; ADR-0018 — see [FOUNDER-DECISIONS-Q3-Q4-Q6.md](../decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md) |
| Q4  | Approve factor-weight redistribution (Demand 17, Margin 18) | Phase 5; ADR-0007 — see [FOUNDER-DECISIONS-Q3-Q4-Q6.md](../decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md)       |
| Q5  | Confirm Critical-risk override is `ORG_ADMIN`+              | TASK-004; ADR-0019                                                                                        |
| Q6  | Vercel Pro vs container hosting (API host)                  | Phase 8 PDF path; ADR-0015 — WordPress remains primary UI                                                 |
| Q7  | Confirm Amazon US + Shopify/DTC only for v1                 | Phase 5 readiness templates                                                                               |
| Q8  | Data controller for EU leads pre-incorporation              | Track B privacy policy                                                                                    |
| A-5 | Close Dependabot PRs #1–#12 without merging                 | Hygiene only, not a gate                                                                                  |

**Recorded:** Brand Urunlytics; WordPress `https://urunlytics.com`; API `https://api.urunlytics.com` — [FOUNDER-BRAND-AND-DOMAINS.md](../decisions/FOUNDER-BRAND-AND-DOMAINS.md).

**ADR-0021 is Accepted.** ADR-0005 is **Superseded**. Other ADRs remain `Proposed` except as noted.

---

## Quality gates — last verified 2026-07-28 (TASK-008, Cursor)

| Gate                       | Result |
| -------------------------- | ------ |
| `pnpm validate:agent-lock` | pass   |
| `pnpm format:check`        | pass   |

---

## Phase gates

| Gate                                  | Condition                                              | Status                                              |
| ------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Phase 0                               | Baseline builds, lints, typechecks, tests, CI runs     | **PASSED**                                          |
| TASK-002 Part A                       | F-1…F-5 and A-1…A-4 closed and verified                | **PASSED**                                          |
| Agent Lock Protocol                   | Write-lock fields + validator                          | **PASSED** (`c7b32a9`)                              |
| TASK-007 WordPress architecture       | ADR-0021 + companion docs                              | **COMPLETE**                                        |
| TASK-008 Brand and domains            | Urunlytics brand/domain record                         | **COMPLETE**                                        |
| TASK-002 Part B                       | Schema + RLS proven (WP identity mappings)             | **BLOCKED**                                         |
| **Phase 1 isolation gate (TASK-005)** | **Tenant isolation proven by the adversarial harness** | Not started — **no product data until this passes** |

---

## Process note (resolved)

The concurrent-edit sequencing issue is addressed by the Agent Lock Protocol. Drafts live under `docs/drafts/` or `*.draft.md`. `pnpm validate:agent-lock` enforces the status lock block.
