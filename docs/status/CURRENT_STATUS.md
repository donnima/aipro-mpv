# CURRENT_STATUS.md — Product Intelligence Platform

**Last updated:** 2026-07-28 (after TASK-001 review)
**Branch:** `main` · **Remote:** `donnima/aipro-mpv` (public) · **HEAD:** `a5655a7`

---

## Where the project stands

Phase 0 is documented and the tooling baseline is built, reviewed, and accepted. No database, no authentication, no tenancy, no product surface exists yet. The application is a placeholder that builds, lints, typechecks, tests, and deploys as a shell.

**Next action: TASK-002 Part A** (purity boundary, CI, Dependabot) — unblocked, needs no credentials.
**Then TASK-002 Part B** (database) — blocked on `DATABASE_URL`.

---

## Task ledger

| Task     | Title                                  | Status                                    | Review                                                            |
| -------- | -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| TASK-001 | Repository and tooling baseline        | **APPROVED WITH FOLLOW-UP**               | [TASK-001-CLAUDE-REVIEW.md](../reviews/TASK-001-CLAUDE-REVIEW.md) |
| TASK-002 | Database foundation and tenancy schema | **Issued — Part A ready, Part B blocked** | —                                                                 |
| TASK-003 | Authentication                         | Draft                                     | —                                                                 |
| TASK-004 | Organizations, memberships, tenant DAL | Draft                                     | —                                                                 |
| TASK-005 | Tenant isolation gate                  | Draft                                     | —                                                                 |

**Naming convention.** `TASK-NNN.md` is an _issued, authoritative_ specification. `T-00N-*.md` are the Phase 0 forward drafts written before any code existed. `TASK-002.md` supersedes the `T-002-*` draft; drafts for T-003 through T-005 remain useful but will be reissued as `TASK-00N.md` when their turn comes.

---

## Open follow-up from TASK-001

Carried into TASK-002. None blocking.

| #   | Item                                                               | Severity | Owner           |
| --- | ------------------------------------------------------------------ | -------- | --------------- |
| F-1 | `packages/core` purity rule misses dynamic `import()`              | Medium   | TASK-002 Part A |
| F-2 | Purity rule misses bare-specifier Node builtins not on the list    | Medium   | TASK-002 Part A |
| F-3 | Dependabot unconstrained on majors — 12 PRs open, several breaking | Low      | TASK-002 Part A |
| F-4 | CI workflow declares no `permissions:` block                       | Low      | TASK-002 Part A |
| F-5 | CI run #1 conclusion not independently confirmed                   | Info     | TASK-002 Part A |

---

## Blocked on the founder

**These block schema work.** Full context in `ARCHITECTURE.md` §15.

| #   | Question                                                           | Blocks                      |
| --- | ------------------------------------------------------------------ | --------------------------- |
| 2   | Neon + Vercel accounts; `DATABASE_URL` and `DATABASE_URL_UNPOOLED` | TASK-002 Part B             |
| 3   | Confirm **analyst-led concierge**, not self-serve SaaS             | Phase 2 scope; ADR-0018     |
| 4   | Approve the factor-weight redistribution (Demand 17, Margin 18)    | Phase 5; ADR-0007           |
| 5   | Confirm Critical-risk override is `ORG_ADMIN`+                     | TASK-004; ADR-0019          |
| 6   | Vercel Pro vs container hosting                                    | Phase 8 PDF path; ADR-0015  |
| 7   | Confirm Amazon US + Shopify/DTC only for v1                        | Phase 5 readiness templates |
| 8   | Data controller for EU leads pre-incorporation                     | Track B privacy policy      |
| —   | Rename repo `aipro-mpv` → `aipro-mvp`? Free now, auto-redirects    | Housekeeping                |

**All 20 ADRs remain `Proposed`.** Nothing built so far conflicts with them, so no rework is implied — but they should be ratified before the schema lands.

---

## Environment

| Item                          | State                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Node / pnpm                   | 22.13.1 / 9.15.4 — verified working                                                                        |
| Disk (blocker B-1)            | **8.03 GB free of 39.9 GB.** Improved from 5.3 GB. Still tight — Playwright browsers are CI-only           |
| Docker / local Postgres (B-2) | Not installed, and not required — Neon per ADR-0013                                                        |
| Git identity                  | Repo-local: `Pellika <pellika.eticaret@gmail.com>`. **Author name is a placeholder — correct it if wrong** |
| Secrets provisioned           | **None.** `.env.example` is all-empty and must stay that way                                               |

---

## Quality gates — last verified 2026-07-28 by the reviewer

| Gate                | Result                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| `pnpm format:check` | pass                                                                          |
| `pnpm lint`         | pass                                                                          |
| `pnpm typecheck`    | pass                                                                          |
| `pnpm test`         | pass — 2 tests                                                                |
| `pnpm build`        | pass — Next.js 15.5.22, 4 routes                                              |
| CI run #1           | ran on `a5655a7` (3m 24s); conclusion badge not independently confirmed (F-5) |

---

## Phase gates ahead

| Gate        | Condition                                           | Status                                                           |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Phase 0     | Baseline builds, lints, typechecks, tests, CI runs  | **PASSED**                                                       |
| **Phase 1** | **Tenant isolation proven by the TASK-005 harness** | Not started — **no product data may be built until this passes** |
| Phase 2+    | Sequential per `ARCHITECTURE.md` §14                | Not started                                                      |

---

## Process notes

- TASK-001 shipped without a §29 implementation report. **TASK-002 requires one** at `docs/reviews/TASK-002-IMPLEMENTATION.md`.
- TASK-001 was implemented before Phase 0 approval. Not harmful in this instance; the Phase 1 isolation gate is not one to run ahead of.
- Track B (public validation site) is independent of Phases 1–9 and can start any time after the founder answers question 8. It is the fastest route to market evidence.
