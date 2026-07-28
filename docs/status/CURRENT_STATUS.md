# CURRENT_STATUS.md — Product Intelligence Platform

**Last updated:** 2026-07-28 (TASK-006 process remediation — lock acquired)
**Branch:** `main` · **Remote:** `donnima/aipro-mpv` (public)

---

## Agent lock

| Field                           | Value                                                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Active Agent**                | `Cursor`                                                                                                                                                                                              |
| **Write Lock Owner**            | `Cursor`                                                                                                                                                                                              |
| **Active Task**                 | `TASK-006`                                                                                                                                                                                            |
| **Authoritative Commit**        | `6a7fde9`                                                                                                                                                                                             |
| **Allowed Paths**               | `docs/tasks/`, `docs/decisions/`, `docs/status/`, `docs/reviews/`, `docs/process/`                                                                                                                     |
| **Forbidden Paths**             | `apps/`, `packages/`, `prisma/`, database files, migrations                                                                                                                                           |
| **Next Action**                 | Cursor remediates Agent Lock process debt for the Q3/Q4/Q6 extraction: commit `docs/tasks/TASK-006-founder-decisions-extraction.md`, align status/self-review to TASK-XXX, then release the lock. |
| **Authoritative Review**        | `docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md` (committed)                                                                                                                                           |
| **Authoritative Review Commit** | `780e627`                                                                                                                                                                                             |
| **Cursor Action Permitted**     | `yes` — founder-authorized documentation-only process remediation for TASK-006; no Prisma, schema, RLS, auth, or application changes                                                                  |
| **Founder Authorization**       | Founder directed Cursor to verify and fix Agent Lock process issues on the Q3/Q4/Q6 extraction (committed status grant in this update)                                                                |

---

## Status block

| Field               | Value                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Current Task**    | TASK-002 Part B                                                                                                                                                |
| **Previous Task**   | TASK-002 Part A                                                                                                                                                |
| **Previous Status** | **APPROVED WITH FOLLOW-UP** (`docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md`) — follow-ups A-1–A-4 closed on `ba2b5f3` and independently re-verified by Claude |
| **Current Status**  | **BLOCKED**                                                                                                                                                    |
| **Blocking Reason** | Founder architecture decisions and `DATABASE_URL` are required before database implementation. Agent Lock Protocol is now in force.                            |

**No Part B task is issued.** Per `docs/tasks/TASK-002.md`, the next implementation task will not be created until the founder answers the open architecture questions below **and** status grants Cursor the write lock.

---

## Where the project stands

Phase 0 tooling baseline: accepted. TASK-002 Part A: accepted; follow-ups closed and verified. Agent Lock Protocol in force. Blocking founder questions Q3/Q4/Q6 extracted to `docs/decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md` (awaiting founder answers). No database, authentication, tenancy, or product surface exists yet.

---

## Task ledger

| Task            | Title                                     | Status                                                       | Review                                                                                                                              |
| --------------- | ----------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| TASK-001        | Repository and tooling baseline           | APPROVED WITH FOLLOW-UP                                      | [TASK-001-CLAUDE-REVIEW.md](../reviews/TASK-001-CLAUDE-REVIEW.md)                                                                   |
| TASK-002 Part A | Purity boundary, CI, Dependabot hardening | **APPROVED WITH FOLLOW-UP — follow-ups closed**              | [TASK-002-PART-A-CLAUDE-REVIEW.md](../reviews/TASK-002-PART-A-CLAUDE-REVIEW.md) (includes post-review re-verification of `ba2b5f3`) |
| TASK-002 Part B | Database foundation and tenancy schema    | **BLOCKED** — no `DATABASE_URL`; founder Q3/Q4/Q6 unanswered | —                                                                                                                                   |
| TASK-003        | Authentication                            | Draft, blocked on Part B                                     | —                                                                                                                                   |
| TASK-004        | Organizations, memberships, tenant DAL    | Draft, blocked on Part B                                     | —                                                                                                                                   |
| TASK-005        | Tenant isolation gate                     | Draft, blocked on Part B                                     | —                                                                                                                                   |

---

## Part A follow-up disposition

Confirmed by Claude directly against `ba2b5f3` — fresh adversarial probes, not accepted from either self-review.

| #   | Item                                                                              | Disposition                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | Dynamic `import()` bypass                                                         | Closed (TASK-002 Part A)                                                                                                                                               |
| F-2 | Unlisted bare Node builtins                                                       | Closed (TASK-002 Part A)                                                                                                                                               |
| F-3 | Dependabot unconstrained majors                                                   | Closed in config (TASK-002 Part A)                                                                                                                                     |
| F-4 | CI missing `permissions:`                                                         | Closed (TASK-002 Part A)                                                                                                                                               |
| F-5 | CI run #1 conclusion unconfirmed                                                  | Closed — run `30341374040`, `success`, independently fetched                                                                                                           |
| A-1 | Unanchored dynamic-import selector (false positives on `./costs`, `./path-utils`) | **Closed on `ba2b5f3`** — selectors anchored `^…$`; re-verified with a fresh probe (0 errors)                                                                          |
| A-2 | `@aipro/db` and other workspace I/O packages not banned                           | **Closed on `ba2b5f3`** — `@aipro/db`, `@aipro/web`, `@aipro/ui`, `@aipro/config` banned, `@aipro/types` allow-listed; re-verified with a fresh probe (all four error) |
| A-3 | Dependabot missing tailwind major ignores                                         | **Closed on `ba2b5f3`**                                                                                                                                                |
| A-4 | Document A-2 resolution in `docs/TESTING.md`                                      | **Closed on `ba2b5f3`**                                                                                                                                                |
| A-5 | Close Dependabot PRs #1–#12 without merging                                       | **Open — founder action required**                                                                                                                                     |

---

## Blocked on the founder

| #   | Item                                                        | Blocks                                                                                                       |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| —   | `DATABASE_URL` + `DATABASE_URL_UNPOOLED` (Neon)             | TASK-002 Part B and all of Phase 1 after it                                                                  |
| Q3  | Confirm analyst-led concierge, not self-serve SaaS          | Phase 2 scope; ADR-0018 — see [FOUNDER-DECISIONS-Q3-Q4-Q6.md](../decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md)    |
| Q4  | Approve factor-weight redistribution (Demand 17, Margin 18) | Phase 5; ADR-0007 — see [FOUNDER-DECISIONS-Q3-Q4-Q6.md](../decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md)          |
| Q5  | Confirm Critical-risk override is `ORG_ADMIN`+              | TASK-004; ADR-0019                                                                                           |
| Q6  | Vercel Pro vs container hosting                             | Phase 8 PDF path; ADR-0015 — see [FOUNDER-DECISIONS-Q3-Q4-Q6.md](../decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md) |
| Q7  | Confirm Amazon US + Shopify/DTC only for v1                 | Phase 5 readiness templates                                                                                  |
| Q8  | Data controller for EU leads pre-incorporation              | Track B privacy policy                                                                                       |
| A-5 | Close Dependabot PRs #1–#12 without merging                 | Hygiene only, not a gate                                                                                     |
| —   | Rename repo `aipro-mpv` → `aipro-mvp`?                      | Housekeeping, free while empty                                                                               |

**All 20 ADRs remain `Proposed`.** Nothing built so far conflicts with them.

---

## Quality gates — last verified 2026-07-28 (Founder Decisions Extraction, Cursor)

| Gate                       | Result                                   |
| -------------------------- | ---------------------------------------- |
| `pnpm validate:agent-lock` | pass                                     |
| `pnpm format:check`        | pass                                     |
| `pnpm lint`                | pass                                     |
| `pnpm typecheck`           | pass                                     |
| `pnpm test`                | pass — **25** tests, 4 files             |
| `pnpm build`               | pass — Next.js 15.5.22                   |
| CI run for `a5655a7`       | success — run `30341374040` (historical) |

---

## Phase gates

| Gate                                    | Condition                                               | Status                                              |
| --------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| Phase 0                                 | Baseline builds, lints, typechecks, tests, CI runs      | **PASSED**                                          |
| TASK-002 Part A                         | F-1…F-5 and A-1…A-4 closed and verified                 | **PASSED**                                          |
| Agent Lock Protocol                     | Write-lock fields + validator                           | **PASSED** (`c7b32a9`)                              |
| Founder Decisions Extraction (Q3/Q4/Q6) | Brief in `docs/decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md` | **DONE** — awaiting founder answers                 |
| TASK-002 Part B                         | Schema + RLS proven                                     | **BLOCKED** on `DATABASE_URL` and founder decisions |
| **Phase 1 isolation gate (TASK-005)**   | **Tenant isolation proven by the adversarial harness**  | Not started — **no product data until this passes** |

---

## Process note (resolved)

The concurrent-edit sequencing issue (Cursor consuming an undelivered Claude review draft) is addressed by the Agent Lock Protocol in `docs/process/AGENT-WORKFLOW.md`, `AGENTS.md`, and `CLAUDE.md`. Drafts live under `docs/drafts/` or `*.draft.md`. `pnpm validate:agent-lock` enforces the status lock block.
