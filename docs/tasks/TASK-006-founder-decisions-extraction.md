# TASK-006 — Founder Decisions Extraction (Q3 / Q4 / Q6)

## Task ID

`TASK-006` · Process (documentation only) · Depends on **TASK-002 Part A — APPROVED** and Agent Lock Protocol (`c7b32a9`)

## Founder authorization

The founder explicitly directed Cursor to:

1. Acquire a documentation-only write lock and extract unresolved questions Q3, Q4, and Q6 that block issuing TASK-002 Part B.
2. After process findings, verify and remediate Agent Lock Protocol gaps in that extraction (missing task spec, non-TASK-XXX Active Task label, stale Authoritative Commit, Allowed Paths / directory clarity).

Lock grants for this task are recorded in committed `docs/status/CURRENT_STATUS.md` (fields **Cursor Action Permitted** and **Founder Authorization**). Chat alone is not authoritative; the status commit is.

## Objective

Produce a founder-facing decision brief for Q3, Q4, and Q6 **without** deciding on the founder’s behalf, and without any database or application implementation.

## Why this task exists

`docs/tasks/TASK-002.md` and `CURRENT_STATUS.md` treat Q3/Q4/Q6 as process blockers before Part B is issued. Extracting them into a single committed brief unblocks founder review. The work must be a formal **TASK-XXX** with a committed spec under `docs/tasks/` (AGENTS.md authority item 4; AGENT-WORKFLOW.md Active Task = task id or `none`).

## Scope

### In scope

- Create `docs/decisions/` if absent (listing a path under **Allowed Paths** permits creating that directory).
- Write `docs/decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md` with exact §15 wording and decision-support sections.
- Write Cursor self-review under `docs/reviews/`.
- Update `docs/status/CURRENT_STATUS.md` lock fields; release lock when done.
- Process remediation: ensure Active Task uses `TASK-006`, task file is committed, Authoritative Commit points at the landed extraction baseline.

### Out of scope

- Accepting or rejecting ADRs
- Answering Q3/Q4/Q6 for the founder
- Prisma, schema, migrations, RLS, auth, `apps/`, `packages/`
- TASK-002 Part B implementation
- Supplying or inventing `DATABASE_URL`

## Deliverables

| Path                                                              | Role                              |
| ----------------------------------------------------------------- | --------------------------------- |
| `docs/tasks/TASK-006-founder-decisions-extraction.md`             | This spec (authoritative task id) |
| `docs/decisions/FOUNDER-DECISIONS-Q3-Q4-Q6.md`                    | Founder decision brief            |
| `docs/reviews/FOUNDER-DECISIONS-EXTRACTION-CURSOR-SELF-REVIEW.md` | Cursor self-review                |

## Status

| Milestone                       | Commit / note                                    |
| ------------------------------- | ------------------------------------------------ |
| Extraction brief landed         | `6a7fde9`                                        |
| Process remediation (this file) | Follow-up under founder-authorized TASK-006 lock |

## Acceptance

- [x] Q3/Q4/Q6 extracted with exact wording from `ARCHITECTURE.md` §15
- [x] No founder decisions recorded as final
- [x] No product/database code changed
- [x] Committed task spec uses id `TASK-006` (this file)
- [x] `CURRENT_STATUS.md` Active Task uses `TASK-006` while locked or `none` when idle
- [x] Authoritative Commit / ledger reference landed extraction and remediation
