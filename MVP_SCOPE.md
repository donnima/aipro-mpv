# MVP_SCOPE.md — Product Intelligence Platform

**Status:** Draft — awaiting founder approval
**Owner:** Founder
**Last updated:** 2026-07-28
**Authority:** This file defines the MVP boundary. Anything not listed as **In Scope** is out of scope until this file is amended and the amendment is recorded in `DECISIONS.md`.

---

## 1. What the MVP Proves

One thing only:

> A human analyst can take a product idea from raw inputs to an evidence-backed, source-cited, confidence-labelled **Go / Test / Research More / Reject** decision, export it as a versioned report, and later record what actually happened.

If a feature does not move a project along that chain, it is not in the MVP.

The chain:

```
Product Project → Product & Target Market → Market Evidence → Competitors
→ Suppliers & Quotes → Unit Economics → Opportunity Score → Risk Flags
→ Channel Readiness → Launch Blueprint → Growth Blueprint → Analyst Review
→ Report Export → Actual Performance
```

---

## 2. Delivery Model (must be settled before Phase 2)

The operating system document describes the offer as a **"software-enabled service supported by a concierge SaaS MVP"** (§4) but then specifies **28 application screens** (§21) and a ~60-entity domain model (§10). These are not the same product.

**This scope document resolves the contradiction as follows:**

- The MVP is an **internal analyst tool with a client-facing read-only surface**.
- The **analyst** (initially the founder) is the primary user. The analyst gets full editing screens.
- The **client** gets: sign-in, project list, read-only project view, approved report view, comments, and file upload. Nothing else.
- Screens exist to make the analyst fast and the output defensible — not to let a self-serve customer run the whole workflow unaided.

This cuts the screen count from 28 to **19 for v1** (see §6) without losing a single item from the §5 MVP Success Definition.

**Decision required from founder:** confirm the concierge/analyst-led model. If the intent is genuine self-serve SaaS, Phases 2–10 roughly double in cost and the onboarding, help, and error-recovery surface must be scoped in.

---

## 3. In Scope — v1

### 3.1 Identity & Tenancy

- Passwordless sign-in (email magic link) + Google OAuth.
- Create an organization; be invited into an organization.
- Four roles: `PLATFORM_ADMIN`, `ORG_ADMIN`, `ANALYST`, `CLIENT_VIEWER`.
- Invitations with expiry, single use, and email binding.
- Every tenant record scoped by `organization_id`, enforced server-side.
- Append-only audit log for material actions.

### 3.2 Product Projects

- Create / edit / archive a Product Project.
- Product profile: name, category, description, key attributes, HS code (free text, **not** a compliance determination), physical dimensions and weight.
- Target markets: one or more destination countries (US + selected EU only).
- Target channels per market: Amazon US, Shopify/DTC. _(See §4 — third channel deferred.)_
- Status lifecycle: `DRAFT → DATA_COLLECTION → ANALYSIS → ANALYST_REVIEW → APPROVED → ARCHIVED`, with validated transitions.

### 3.3 Evidence

- Reusable `DataSource` records carrying the full §11 provenance contract.
- Citations linking any metric, competitor, supplier, or conclusion to one or more sources.
- Market evidence entries (demand signals, price points, volume estimates).
- Competitors + competitor metrics.
- Suppliers + supplier quotes, side-by-side comparison.
- File attachments (quotes, spec sheets, certificates) with type/size limits and access-controlled retrieval.
- Visible warning wherever a metric has **no** source citation.

### 3.4 Unit Economics

- Cost scenarios per project (e.g. "Air freight / 500 units", "Sea freight / 2000 units").
- All §12 cost categories as line items.
- Calculated: landed cost/unit, gross profit/unit, gross margin, contribution profit/unit, contribution margin, break-even units, initial inventory investment, total initial capital, profit at selected volumes.
- Scenario comparison.
- Every result exposes formula, inputs, units, currency, assumptions, estimated-vs-actual label, and calculation version.
- **Decimal arithmetic only.** No IEEE floating point anywhere in the money path.

### 3.5 Opportunity Scoring, Confidence & Risk

- Ten weighted, versioned, configurable factors (see §5 below for the change to the §13 table).
- Each factor score stores raw inputs, normalized 0–100, weight, weighted contribution, rationale, source references, confidence, rule version, analyst override + override reason.
- **Confidence engine, computed separately from attractiveness**, producing a 0–100 score and a Low/Medium/High band.
- Risk rules producing risk flags at Info/Low/Medium/High/Critical.
- An unresolved **Critical** risk blocks `GO`. Override requires an explicit reason, is restricted to `ORG_ADMIN` or `PLATFORM_ADMIN`, and is audit-logged.
- Deterministic decision thresholds stored in the database, never hard-coded at call sites.

### 3.6 Channel Readiness

- Configurable readiness templates for Amazon US and Shopify/DTC.
- Item statuses: `READY`, `PARTIALLY_READY`, `NOT_READY`, `REQUIRES_SPECIALIST_REVIEW`.
- Readiness summary feeds the Channel Readiness scoring factor and the risk engine.
- **No claim of legal or regulatory compliance approval anywhere in the UI or report.**

### 3.7 AI Drafting & Governance

- Provider abstraction with Anthropic and OpenAI adapters behind one interface.
- Versioned prompt templates.
- Permitted tasks only (§17): summarize evidence, summarize competitor patterns, compare suppliers, draft risk explanations, draft opportunity rationale, draft launch blueprint, draft growth blueprint, draft executive narrative, identify missing data.
- Structured output validated against Zod schemas; invalid output rejected then retried once, then failed visibly.
- Full execution log: provider, model, template id, prompt version, input hash, structured output, tokens, estimated cost, duration, timestamp, success/failure, fallback used, human review status.
- **AI output is `DRAFT` until an analyst approves it. It is never shown to a client viewer in draft state.**
- Uploaded and user-entered content is treated as untrusted and never placed in the system prompt.
- Per-organization AI spend cap and rate limit.

### 3.8 Blueprints & Analyst Review

- Launch blueprint + milestones; growth blueprint + actions.
- Analyst edits the AI draft; edit history preserved.
- Review comments.
- Approval transitions the artifact to `APPROVED` and versions it.

### 3.9 Reporting

- All 20 §18 sections.
- HTML web preview as the single source of truth.
- PDF export rendered from the same HTML.
- Version history; each version is an immutable snapshot.
- Data-source and assumption appendix.
- Draft versions carry a visible `DRAFT — NOT ANALYST APPROVED` watermark.
- Generated files served only via short-lived signed URLs, org-scoped.

### 3.10 Actual Performance / Learning Loop

- Record actual costs and actual commercial outcomes against a project.
- Estimate-vs-actual comparison computed against the approved report snapshot.
- Deviation notes.
- Actual data is visually and structurally distinct from estimates.

### 3.11 Public Validation Website

- Landing page, problem statement, target customer, sample report preview.
- Early-access form and product-opportunity survey (all §19 fields).
- Diagnostic meeting CTA.
- Privacy consent captured and stored with timestamp, IP, policy version.
- The six §19 analytics events.
- Rate limiting and bot mitigation on all public forms.
- Lead export (CSV).
- **No traction metrics, logos, testimonials, or customer counts that do not exist.**

### 3.12 Demo Workspace

- One fully populated fictional organization and project covering every screen.
- Every record labelled `Sample — Illustrative — Not verified commercial traction`.
- Documented demo script.

---

## 4. Explicitly Out of Scope for v1

### 4.1 From the operating system's non-goals (§6) — confirmed excluded

ERP, CRM, payment processing, public supplier marketplace, public product marketplace, logistics platform, Amazon operations suite, mobile app, no-code workflow builder, all-countries support, all-channels support, autonomous regulatory decisions, scraping, AI influencer generator, content studio, marketing automation, microservices.

### 4.2 Additional exclusions decided in Phase 0

| Excluded                                              | Reason                                                                                     | Revisit                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Third channel template (EU marketplace)               | §6 forbids "all sales channels"; two templates prove configurability                       | Phase 6+ once a pilot customer names a specific EU channel |
| `Workspace` as a second tenancy level                 | Undefined in the source document; a second nesting level doubles every authorization check | Only if a customer needs sub-teams                         |
| Custom//user-defined roles (`Role` as a table)        | Four fixed roles are specified; a role table invites permission drift                      | Post-MVP                                                   |
| Automated FX rate feeds (`CurrencyRateSnapshot`)      | Adds a vendor dependency and a scheduled job for a value a user can type                   | Phase 10+                                                  |
| `FeatureFlag` table                                   | Environment configuration is sufficient at one deployment                                  | When there are paying tenants on different tiers           |
| Redis / dedicated worker service                      | §7 forbids Redis in Phase 1; Postgres-backed jobs cover MVP needs                          | Only if PDF or AI genuinely need durable async             |
| Self-serve billing / subscriptions                    | Pre-revenue, pre-incorporation; contracts will be manual                                   | After first paid pilot                                     |
| Real-time collaboration, notifications, email digests | Not on the decision chain                                                                  | Post-MVP                                                   |
| SSO / SAML / SCIM                                     | No enterprise customer exists yet                                                          | On first enterprise request                                |
| Data import from marketplaces or supplier directories | Licensing and ToS risk; §6 forbids unauthorized scraping                                   | Only with a licensed data agreement                        |
| Multi-language UI                                     | Target markets are US/EU-English for v1                                                    | Post-validation                                            |

---

## 5. Scope Contradictions Found and How They Are Resolved

These are contradictions **inside the source operating system document**. Each is resolved here and recorded as an ADR.

| #    | Contradiction                                                                                                                                                                                                                                                       | Resolution                                                                                                                                                                                                | ADR      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| C-1  | §13 makes **Confidence a scoring factor worth 5 points**, while §14 requires confidence be **separate from attractiveness** and forbids presenting a high score with low confidence as a strong Go. A factor inside the composite cannot also be independent of it. | Confidence is **removed from the composite score**. Its 5 points are redistributed. Confidence is computed by its own engine and displayed as a second, equal-weight dimension. Decision rules read both. | ADR-0007 |
| C-2  | §13 thresholds overlap. A score of 80 with low confidence matches both `Go (75–100)` and `Research More (…or low confidence)`. Precedence is undefined.                                                                                                             | Decision is evaluated as an **ordered, deterministic rule chain** with hard gates first. Fully specified in `ARCHITECTURE.md` §7.                                                                         | ADR-0008 |
| C-3  | §13 gives **Channel Readiness a 10-point weight** in Phase 5 scoring, but Channel Readiness is not built until Phase 6. Phase 5 cannot pass its own acceptance criteria.                                                                                            | Channel Readiness is **pulled into Phase 5**. Phases 5 and 6 are merged.                                                                                                                                  | ADR-0017 |
| C-4  | §4 promises a **concierge, software-enabled service**; §21 and §10 specify a full self-serve SaaS.                                                                                                                                                                  | Resolved in §2 above: analyst-led tool with a read-only client surface. 19 screens for v1.                                                                                                                | ADR-0018 |
| C-5  | §10 says **"avoid JSON blobs for core domain entities"**; §11 requires **13 provenance fields on every important metric**. Literal compliance means duplicating 13 columns across a dozen tables.                                                                   | Provenance lives in a normalized `DataSource` table plus a polymorphic `SourceCitation` join. Neither duplicated columns nor JSONB.                                                                       | ADR-0009 |
| C-6  | §10 lists both **`AuditLog` and `ActivityEvent`** with no stated boundary — two overlapping event stores.                                                                                                                                                           | One `AuditLog` (append-only, security and material actions). Product analytics events go to the analytics provider, **not** the application database.                                                     | ADR-0012 |
| C-7  | §15 says a Critical risk blocks Go **"unless an analyst overrides it"**, but §9 gives Analysts no stated override authority and does not say who may.                                                                                                               | Override restricted to `ORG_ADMIN` and `PLATFORM_ADMIN`. Reason mandatory. Audit-logged. Shown on the report face.                                                                                        | ADR-0019 |
| C-8  | §10 lists **`Role` as an entity** while §9 defines exactly **four fixed roles**. Table implies custom roles; §6 non-goals imply not.                                                                                                                                | `Role` is a Postgres enum, not a table.                                                                                                                                                                   | ADR-0011 |
| C-9  | §5 lets **any user create an organization**, while §9 gives Platform Admin **cross-organization support access**. Together: an open tenancy-creation endpoint plus a built-in cross-tenant read path.                                                               | Org creation is rate-limited and audit-logged. Platform-admin cross-org access requires an explicit, time-boxed, reason-bearing impersonation grant and is logged on every request. Never silent.         | ADR-0020 |
| C-10 | §7 forbids Redis and defers workers, but §17 (AI drafting) and §18 (PDF export) are both long-running operations.                                                                                                                                                   | Both run inline on a Node runtime with a raised duration limit. If durable async becomes necessary, use `pg-boss` on the existing Postgres — not Redis.                                                   | ADR-0014 |
| C-11 | §19 collects EU personal data (name, business email, company, budget, timeline) but no lawful basis, retention period, processor list, or privacy policy is specified.                                                                                              | GDPR obligations are scoped explicitly into Phase 11 and gated in Phase 13. Leads are **platform-owned**, stored outside the tenant tables.                                                               | ADR-0016 |

---

## 6. Screens — v1 (19)

**Analyst / Org Admin (13):** Sign in · Accept invitation · Organization selector · Project list · Project workspace (tabbed: Profile · Target Market · Evidence · Competitors · Suppliers & Quotes · Cost Scenarios · Unit Economics · Opportunity · Risks · Channel Readiness) · Blueprints (launch + growth) · Analyst review · Report preview · Actual performance · Organization settings · Audit log · AI usage log · Admin scoring configuration

**Client Viewer (2):** Assigned project (read-only) · Approved report

**Public (3):** Landing page · Survey · Privacy policy

**Reduction rationale:** §21's items 7–17 are eleven separate screens over a single project. They become tabs of one project workspace. Same functionality, one navigation model, far less code.

---

## 7. MVP Success Definition — Traceability

Every one of the 18 criteria in §5 of the operating system maps to a phase. None is dropped.

|   # | §5 Criterion                                     | Phase                  |
| --: | ------------------------------------------------ | ---------------------- |
|   1 | User can sign in                                 | 1                      |
|   2 | Create or join an organization                   | 1                      |
|   3 | Analyst creates a Product Project                | 2                      |
|   4 | Product and target-market data entered           | 2                      |
|   5 | Competitors and suppliers added manually         | 3                      |
|   6 | Supplier quotes compared                         | 3                      |
|   7 | Cost scenarios created                           | 4                      |
|   8 | Unit economics reproducible                      | 4                      |
|   9 | Factors scored with visible weights + rationales | 5                      |
|  10 | Risk flags generated                             | 5                      |
|  11 | Channel readiness assessed                       | 5 (merged)             |
|  12 | AI drafts launch + growth blueprint              | 7, 8                   |
|  13 | Analyst revises and approves                     | 8                      |
|  14 | Versioned report exported                        | 9                      |
|  15 | Actual outcomes recorded                         | 10                     |
|  16 | Tenant isolation and permissions tested          | 1 (gate), re-tested 13 |
|  17 | Validation landing page captures interest        | Track B (parallel)     |
|  18 | Deployable with documented instructions          | 14                     |

---

## 8. Definition of MVP-Ready

Unchanged from §32 of the operating system. The product is MVP-ready only when the golden workflow runs end to end, scoring and economics are reproducible, AI output is reviewable, reports export, actual outcomes can be recorded, tenant isolation is tested, deployment is documented, demo data is labelled, and **no unsupported customer or traction claim exists anywhere in the product or the marketing site.**

---

## 9. Change Control

Adding anything to §3 requires: (a) a written justification tied to the decision chain in §1, (b) a named phase, (c) an ADR entry in `DECISIONS.md`, (d) founder approval. Scope added without all four is scope creep and must be rejected at review.
