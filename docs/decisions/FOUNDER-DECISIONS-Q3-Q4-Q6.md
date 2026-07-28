# Founder Decisions — Q3, Q4, Q6

**Status:** Awaiting founder answers. No decision is recorded here.  
**Task:** [`TASK-006`](../tasks/TASK-006-founder-decisions-extraction.md)  
**Prepared by:** Cursor (documentation-only lock)  
**Date:** 2026-07-28  
**Authoritative sources:** `ARCHITECTURE.md` §15; `MVP_SCOPE.md`; `DECISIONS.md` (ADR-0007, ADR-0015, ADR-0018); `docs/tasks/TASK-002.md`; `docs/tasks/TASK-006-founder-decisions-extraction.md`; `docs/status/CURRENT_STATUS.md`

This brief extracts the three open architecture questions that the process gate treats as blockers for issuing **TASK-002 Part B**. It does **not** accept or reject any ADR on the founder's behalf.

**Process vs schema note.** `docs/tasks/TASK-002.md` states that questions 3, 4, and 6 do **not** change the Part B Prisma schema. Status and the task header nonetheless require founder answers before Part B is issued, to avoid starting database work under still-`Proposed` ADRs that reshape later phases. This document preserves that gate; it does not relax it.

Neon `DATABASE_URL` / `DATABASE_URL_UNPOOLED` remain a separate founder credential blocker and are out of scope for this brief.

---

## Q3 — Delivery model (C-4)

### Exact wording

> 3. **Delivery model (C-4):** confirm analyst-led concierge, not self-serve SaaS.

### Source file and section

- Primary: `ARCHITECTURE.md` §15 — Open Questions for the Founder, item 3
- Context: `MVP_SCOPE.md` §2 (Delivery Model) and contradiction C-4
- Proposed resolution: `DECISIONS.md` — [ADR-0018](../../DECISIONS.md#adr-0018) (status: **Proposed**)

### Why it blocks TASK-002 Part B

Part B's Phase 1 tables (`users`, `organizations`, `memberships`, etc.) do not encode screen count or self-serve vs concierge UX. The block is a **process gate**: TASK-002 and `CURRENT_STATUS.md` refuse to issue Part B until Q3 is answered, so Phase 1 does not proceed under an unresolved product-shape decision that would force Phase 2+ rework (and potentially role/surface assumptions that follow tenancy).

### Available options

1. **Analyst-led concierge** — Internal analyst tool; client surface is read-only (project view, approved report, comments, upload). ~19 screens for v1 (`MVP_SCOPE.md` §2 / ADR-0018).
2. **Genuine self-serve SaaS** — Customer runs the workflow unaided; onboarding, empty states, guidance, error recovery, and help content are in scope; ~28 screens and roughly doubled Phases 2–9.

### Recommended MVP option

**Option 1 (analyst-led concierge / ADR-0018)** — recommendation only, not a founder decision. Matches §4 commercial reality (founder delivers first engagements) and “narrowest coherent system.”

### Security implications

- Concierge keeps privileged write paths on analyst/`ORG_ADMIN` roles and a narrow `CLIENT_VIEWER` surface — fewer unauthenticated or low-trust write flows.
- Self-serve expands attack surface: onboarding, invitations at scale, self-service project creation, and more IDOR/authorization edges to prove at each phase.
- Neither option changes Phase 1 RLS design by itself; both still require the four-layer isolation gate (TASK-005).

### Migration implications

- No Part B schema change for either option.
- Self-serve later may add tables/workflows (onboarding state, help content, richer client write paths) that are absent from the current Phase 1–2 model.
- Switching after Phase 2 UI exists is costly in product code, not primarily in forward-only SQL migrations.

### Operational implications

- Concierge: founder/analyst capacity is the throughput limit; ops stay service-shaped.
- Self-serve: support, docs, and empty-state quality become product requirements; Phase schedule roughly doubles for Phases 2–9.

### Reversibility

- **Concierge → self-serve later:** additive (screens, help, onboarding); ADR-0018 would be superseded.
- **Self-serve → concierge later:** harder — shipping self-serve UX then narrowing it strands customers and code. Prefer deciding before Phase 2 UI.

### Required ADR or documentation updates

After the founder answers:

- Accept or supersede **ADR-0018**.
- Update `MVP_SCOPE.md` §2 / C-4 if the answer differs from the proposed resolution.
- Reflect the answer in `ARCHITECTURE.md` §15 (mark Q3 resolved) and `CURRENT_STATUS.md` “Blocked on the founder.”

### What the founder must decide

Confirm whether v1 is **analyst-led concierge** or **self-serve SaaS**. Until that answer is committed, agents must not treat ADR-0018 as Accepted.

---

## Q4 — Factor-weight redistribution (C-1)

### Exact wording

> 4. **Weights (C-1):** approve redistributing Confidence's 5 points to Demand (+2) and Margin (+3), or specify a different redistribution.

### Source file and section

- Primary: `ARCHITECTURE.md` §15 — Open Questions for the Founder, item 4
- Context: contradiction C-1 (Confidence as both a score factor and an independent gate)
- Proposed resolution: `DECISIONS.md` — [ADR-0007](../../DECISIONS.md#adr-0007) (status: **Proposed**)
- Data shape: `DATA_MODEL.md` §7 — `opportunity_factor_definitions` (Confidence **not** among scoring factors)

### Why it blocks TASK-002 Part B

Part B does **not** create `opportunity_factor_definitions` (Phase 5). The block is a **process gate**: starting the database foundation under an unsettled scoring ADR risks later seed/rule-version churn and documentation conflict. Schema independence does not remove the TASK-002 / status requirement to answer Q4 before Part B is issued.

### Available options

1. **ADR-0007 redistribution** — Remove Confidence from the composite; add +2 to Demand (→ 17) and +3 to Margin (→ 18); total remains 100. Confidence is a separate engine/dimension.
2. **Different redistribution** — Still remove Confidence from the composite (to satisfy §14), but allocate the 5 points across other factors differently; weights must still sum to 100.
3. **Keep Confidence inside the composite** — Conflicts with `ARCHITECTURE.md` / §14 and ADR-0007's rationale; would require an explicit superseding ADR and acceptance of the C-1 contradiction.

### Recommended MVP option

**Option 1 (ADR-0007)** — recommendation only. Protects “high score + low confidence ≠ strong Go”; Demand and Margin are the factors most evidenced by collected workflow data. Weights are versioned seed rows, changeable without a code change once Phase 5 exists.

### Security implications

- Weight choice is not a tenancy or auth control.
- Incorrect composite design can mislead Go decisions (product integrity / customer harm), which is why §14 separates confidence from attractiveness.
- Overrides and audit of factor scores remain governed by later ADRs/roles (see Q5 / ADR-0019 — out of scope here).

### Migration implications

- Part B: none.
- Phase 5: seed `opportunity_factor_definitions` with the approved weights; changing weights later is a new `rule_version` / seed update, not a destructive migration of assessment history if assessments store the version used.

### Operational implications

- Analysts and reports must present **score and confidence as a pair**.
- Decision chain (ADR-0008) already assumes independent confidence gating.
- Wrong weights are tunable via seed; wrong _architecture_ (confidence inside composite) is a design defect.

### Reversibility

- Redistributing among non-confidence factors: high (new rule version + seed).
- Putting Confidence back into the composite after assessments ship: low — historic scores become incomparable without dual-engine support.

### Required ADR or documentation updates

After the founder answers:

- Accept, amend, or supersede **ADR-0007**.
- Align `ARCHITECTURE.md` §7.1 weight table and `DATA_MODEL.md` §7 seed description.
- Mark Q4 resolved in `ARCHITECTURE.md` §15 and `CURRENT_STATUS.md`.

### What the founder must decide

Either **approve Demand 17 / Margin 18** (Confidence out of composite), or **specify an alternate redistribution** that still sums to 100 — or explicitly reject ADR-0007 with a written alternative that resolves C-1.

---

## Q6 — Hosting (§10)

### Exact wording

> 6. **Hosting (§10):** accept Vercel Pro (~$20/user/mo), or prefer container hosting?

### Source file and section

- Primary: `ARCHITECTURE.md` §15 — Open Questions for the Founder, item 6
- Context: `ARCHITECTURE.md` §10 — Deployment (Vercel `fra1`, Neon, named Pro cost for `maxDuration`)
- Related ADR: `DECISIONS.md` — [ADR-0015](../../DECISIONS.md#adr-0015) (PDF via headless Chromium; Pro duration limit; container fallback) (status: **Proposed**)

### Why it blocks TASK-002 Part B

Hosting choice does **not** alter Phase 1 Postgres/RLS schema. The block is a **process gate**: TASK-002 and status require Q6 answered before Part B so the long-term deploy target (and PDF path assumptions in ADR-0015) are not silently assumed while the database foundation lands. `ARCHITECTURE.md` §10 notes the cost decision is needed before Phase 9 in product terms; the task/status gate still holds it before Part B issuance.

### Available options

1. **Vercel Pro** — Keep web app on Vercel (EU `fra1`); pay ~$20/user/month so AI drafting and PDF routes can raise `maxDuration` above free-tier limits.
2. **Container hosting for the whole app** — e.g. Railway or Fly.io; one deployment model without Vercel Pro; Chromium/PDF may be more natural in a container (ADR-0015 fallback becomes primary).

### Recommended MVP option

**Option 1 (Vercel Pro)** — recommendation only, unless the founder rejects the subscription cost. Retain the scheduled Phase 8 Chromium spike and the documented container fallback in ADR-0015.

### Security implications

- Region choice (EU) is already fixed for data residency; switching host must preserve EU residency for app + DB + object storage assumptions.
- Container hosts change the secrets, networking, and least-privilege IAM model versus Vercel env/project isolation — still must never commit `DATABASE_URL` or provider keys.
- PDF/Chromium path is a high-risk runtime surface (resource abuse, SSRF if misconfigured); hosting choice affects how that spike is hardened, not Phase 1 RLS.

### Migration implications

- Part B / Neon schema: none.
- App deploy config, CI deploy steps, and possibly PDF worker topology change if Option 2 is chosen — documentation and ops, not Prisma Phase 1 migrations.

### Operational implications

- **Vercel Pro:** ongoing subscription; serverless duration limits remain a product constraint; PDF reliability is the primary Phase 8 risk.
- **Containers:** ops ownership of process lifetime, scaling, and Chromium deps; may simplify long-running PDF; loses Vercel-native preview ergonomics unless replaced.

### Reversibility

- Early (pre–Phase 8 PDF): moderate — redeploy target before Chromium is production-critical.
- After PDF and AI routes depend on a specific `maxDuration`/runtime: lower — requires a cutover project and regression of export paths.

### Required ADR or documentation updates

After the founder answers:

- Accept or amend **ADR-0015** and `ARCHITECTURE.md` §10.
- If containers win: document the chosen provider, region, and whether Vercel is dropped entirely.
- Mark Q6 resolved in `ARCHITECTURE.md` §15 and `CURRENT_STATUS.md`.

### What the founder must decide

Accept **Vercel Pro (~$20/user/mo)** for the planned serverless `maxDuration` path, or choose **container hosting** for the whole application (and name the preferred provider if known).

---

## Summary for the founder

| #   | Question                         | Recommended MVP option (not decided) | Blocks Part B because            |
| --- | -------------------------------- | ------------------------------------ | -------------------------------- |
| Q3  | Concierge vs self-serve          | ADR-0018 concierge                   | Process gate (TASK-002 / status) |
| Q4  | Confidence weight redistribution | ADR-0007 Demand 17 / Margin 18       | Process gate (TASK-002 / status) |
| Q6  | Vercel Pro vs containers         | Vercel Pro + Phase 8 spike           | Process gate (TASK-002 / status) |

**Still required separately:** Neon `DATABASE_URL` + `DATABASE_URL_UNPOOLED` in gitignored `.env.local` before any Part B implementation.

**Out of scope for this brief (still open):** Q5 (Critical-risk override), Q7 (channels), Q8 (EU data controller), A-5 (Dependabot PR closure), repo rename.
