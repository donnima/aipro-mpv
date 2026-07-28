# CURRENT_STATUS.md — Product Intelligence Platform

**Last updated:** 2026-07-28 (TASK-002 Part A implementation)
**Branch:** `main` · **Remote:** `donnima/aipro-mpv` (public)
**Status:** **READY_FOR_CLAUDE_REVIEW**

---

## Where the project stands

Phase 0 tooling baseline is accepted. **TASK-002 Part A** (purity boundary, CI permissions, Dependabot constraints, F-5 CI confirmation) is implemented and awaiting Claude review.

**Do not start Part B** until Claude accepts Part A **and** the founder supplies `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (and answers open questions 3, 4, 6 before schema work).

---

## Task ledger

| Task     | Title                                  | Status                                           | Review                                                              |
| -------- | -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| TASK-001 | Repository and tooling baseline        | **APPROVED WITH FOLLOW-UP**                      | [TASK-001-CLAUDE-REVIEW.md](../reviews/TASK-001-CLAUDE-REVIEW.md)   |
| TASK-002 | Database foundation and tenancy schema | **Part A implemented — READY_FOR_CLAUDE_REVIEW** | [TASK-002-IMPLEMENTATION.md](../reviews/TASK-002-IMPLEMENTATION.md) |
| TASK-003 | Authentication                         | Draft                                            | —                                                                   |
| TASK-004 | Organizations, memberships, tenant DAL | Draft                                            | —                                                                   |
| TASK-005 | Tenant isolation gate                  | Draft                                            | —                                                                   |

---

## Open follow-up from TASK-001 → Part A disposition

| #   | Item                            | Disposition                                                                |
| --- | ------------------------------- | -------------------------------------------------------------------------- |
| F-1 | Dynamic `import()` bypass       | **Closed** — `no-restricted-syntax` on `ImportExpression`                  |
| F-2 | Unlisted bare Node builtins     | **Closed** — `module.builtinModules` enumeration                           |
| F-3 | Dependabot unconstrained majors | **Closed in config** — ignore majors + groups; open PRs need founder close |
| F-4 | CI missing `permissions:`       | **Closed** — `permissions: contents: read`                                 |
| F-5 | CI #1 conclusion unconfirmed    | **Closed** — run 30341374040 `conclusion: success` on `a5655a7`            |

---

## Blocked on the founder

| #   | Question                                                        | Blocks                                        |
| --- | --------------------------------------------------------------- | --------------------------------------------- |
| 2   | Neon + Vercel; `DATABASE_URL` and `DATABASE_URL_UNPOOLED`       | TASK-002 Part B                               |
| 3   | Confirm **analyst-led concierge**, not self-serve SaaS          | Phase 2 scope; ADR-0018                       |
| 4   | Approve the factor-weight redistribution (Demand 17, Margin 18) | Phase 5; ADR-0007                             |
| 5   | Confirm Critical-risk override is `ORG_ADMIN`+                  | TASK-004; ADR-0019                            |
| 6   | Vercel Pro vs container hosting                                 | Phase 8 PDF path; ADR-0015                    |
| 7   | Confirm Amazon US + Shopify/DTC only for v1                     | Phase 5 readiness templates                   |
| 8   | Data controller for EU leads pre-incorporation                  | Track B privacy policy                        |
| —   | Close Dependabot PRs #1–#12 (majors)                            | Hygiene; config already ignores future majors |
| —   | Rename repo `aipro-mpv` → `aipro-mvp`?                          | Housekeeping                                  |

**All 20 ADRs remain `Proposed`.**

---

## Quality gates — last verified 2026-07-28 (Part A implementer)

| Gate                | Result                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm format:check` | pass                                                                        |
| `pnpm lint`         | pass                                                                        |
| `pnpm typecheck`    | pass                                                                        |
| `pnpm test`         | pass — 10 tests (8 purity + 2 prior)                                        |
| `pnpm build`        | pass — Next.js 15.5.22                                                      |
| Adversarial probes  | banned EXIT=1 (15 errors); allowed EXIT=0                                   |
| CI run #1           | **success** — https://github.com/donnima/aipro-mpv/actions/runs/30341374040 |

---

## Phase gates ahead

| Gate        | Condition                                          | Status                                              |
| ----------- | -------------------------------------------------- | --------------------------------------------------- |
| Phase 0     | Baseline builds, lints, typechecks, tests, CI runs | **PASSED**                                          |
| TASK-002 A  | F-1…F-5 closed                                     | **READY_FOR_CLAUDE_REVIEW**                         |
| TASK-002 B  | Schema + RLS proven                                | Blocked on credentials                              |
| **Phase 1** | **Tenant isolation proven by TASK-005**            | Not started — **no product data until this passes** |
