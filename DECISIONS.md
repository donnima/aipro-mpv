# DECISIONS.md — Architecture Decision Record

Every architecture change must add or supersede an entry here (operating system §26).

**Status values:** `Proposed` · `Accepted` · `Superseded by ADR-XXXX` · `Rejected`
Founder-accepted decisions after Phase 0 are marked **Accepted**. Remaining Proposed ADRs await further founder approval where noted.

| ADR               | Title                                                              | Status                     |
| ----------------- | ------------------------------------------------------------------ | -------------------------- |
| [0001](#adr-0001) | Full-stack Next.js instead of Next.js + FastAPI                    | Proposed                   |
| [0002](#adr-0002) | pnpm workspace monorepo with a single application                  | Proposed                   |
| [0003](#adr-0003) | PostgreSQL with Prisma                                             | Proposed                   |
| [0004](#adr-0004) | Four-layer tenant isolation including Postgres RLS in Phase 1      | Proposed                   |
| [0005](#adr-0005) | Auth.js v5 with database sessions and passwordless sign-in         | **Superseded by ADR-0021** |
| [0006](#adr-0006) | Decimal money handling in TypeScript                               | Proposed                   |
| [0007](#adr-0007) | Confidence removed from the composite opportunity score            | Proposed                   |
| [0008](#adr-0008) | Decision is a deterministic ordered rule chain                     | Proposed                   |
| [0009](#adr-0009) | Provenance via DataSource + SourceCitation                         | Proposed                   |
| [0010](#adr-0010) | One reporting currency per project; manual FX rates                | Proposed                   |
| [0011](#adr-0011) | Role is an enum, not a table                                       | Proposed                   |
| [0012](#adr-0012) | One AuditLog; product analytics off-database                       | Proposed                   |
| [0013](#adr-0013) | Hosted Postgres branch for local development instead of Docker     | Proposed                   |
| [0014](#adr-0014) | No Redis; pg-boss on Postgres if async becomes necessary           | Proposed                   |
| [0015](#adr-0015) | PDF via headless Chromium rendering the report HTML                | Proposed                   |
| [0016](#adr-0016) | Validation site in the same repo; leads are platform-owned         | Proposed                   |
| [0017](#adr-0017) | Channel readiness merged into the scoring phase                    | Proposed                   |
| [0018](#adr-0018) | Analyst-led concierge model; 19 screens for v1                     | Proposed                   |
| [0019](#adr-0019) | Critical-risk override restricted to ORG_ADMIN and above           | Proposed                   |
| [0020](#adr-0020) | Platform-admin cross-org access requires a time-boxed SupportGrant | Proposed                   |
| [0021](#adr-0021) | WordPress-Owned Identity and Presentation Architecture             | **Accepted**               |

---

<a id="adr-0001"></a>

## ADR-0001 — Full-stack Next.js instead of Next.js + FastAPI

**Context.** The operating system (§7) defaults to a monorepo with `apps/web` (Next.js) and `apps/api` (FastAPI), permitting deviation where audit shows another approach is materially better. The repository is empty, so there is no existing code to preserve. The team is one founder, pre-revenue and pre-incorporation.

**Decision.** Build one Next.js application. No FastAPI service. No `apps/api`, no `apps/worker`.

**Rationale.**

1. Two runtimes double the authorization surface, and tenant isolation is the project's hardest gate. A split forces a service-to-service auth scheme — signing, key distribution, audience validation, rotation — to be built and secured before any product value exists.
2. Auth.js, the document's preferred auth, is Next.js-native. Pairing it with FastAPI means either two implementations of session verification (how isolation bugs are born) or proxying everything through Next.js, which reduces FastAPI to a remote database client.
3. Removing the second service removes one host, one secret set, one CI job, one health check, one migration runner, and one rollback path — most of the Phase 14 workload.
4. The Decimal argument does not hold. Financial correctness comes from Postgres `NUMERIC`, avoiding floats in the calculation path, and tested formulas — all achievable in TypeScript via `decimal.js` (ADR-0006). §12's rule is a constraint on arithmetic, not on language.
5. §17 explicitly permits Zod instead of Pydantic, so structured AI output is not a differentiator.
6. §6 forbids a large microservice architecture. Two services for one engineer is where that begins.

**Consequences.**

- _Positive:_ one language, one toolchain, one deployment; server-side authorization in one place; fastest path to the golden workflow.
- _Negative:_ Python's data/ML ecosystem is not directly available; long-running compute is constrained by the Node/serverless host.
- _Mitigation (binding):_ all decision logic — economics, scoring, confidence, risk — lives in `packages/core` as pure, framework-free, I/O-free TypeScript. Extracting a service later is re-exposing an already-isolated module behind HTTP, not a rewrite. This caps the cost of being wrong.

**Revisit if:** a Python-first engineer is hired; the learning loop needs a genuine ML pipeline; or a single request path needs more than five minutes of compute.

---

<a id="adr-0002"></a>

## ADR-0002 — pnpm workspace monorepo with a single application

**Context.** §7 specifies a monorepo with pnpm. ADR-0001 removes two of the three apps.

**Decision.** Keep the pnpm workspace monorepo with `apps/web` plus `packages/{core,db,ui,types,config}`. `packages/scoring` from §7 is folded into `packages/core`.

**Rationale.** The workspace boundary is what makes ADR-0001's mitigation enforceable: `packages/core` can be lint-restricted from importing Next.js, Prisma, or React, so purity is mechanically verified rather than merely intended. A single-package repo would make that a convention, and conventions decay.

**Consequences.** Slightly more tooling configuration up front. In exchange, domain logic stays extractable and independently testable, and the isolation of the data-access layer is enforceable by import rules.

---

<a id="adr-0003"></a>

## ADR-0003 — PostgreSQL with Prisma

**Context.** §7 specifies PostgreSQL. The ORM was specified as SQLAlchemy 2 + Alembic, which ADR-0001 makes inapplicable. The domain is highly relational (~47 entities), migration-heavy, and financially precise.

**Decision.** PostgreSQL 16 with Prisma 6.

**Rationale.** Prisma's migration tooling is the most mature in the TypeScript ecosystem, which matters across fourteen phases of schema evolution. It maps Postgres `NUMERIC` to `Decimal` end to end (required by ADR-0006). Prisma Client Extensions provide the interception point that makes the tenant-scoped DAL (ADR-0004) enforceable in one place rather than at every call site.

**Alternative considered — Drizzle.** Lighter runtime, closer to SQL, better raw-SQL ergonomics for RLS session variables. Rejected because migration maturity and a single interception point for tenant scoping matter more here than query-layer thinness. This is a close call; it is not a decision worth revisiting mid-build.

**Consequences.** Prisma's generated client adds to `node_modules` size, which interacts with blocker B-1. Raw SQL is available via `$queryRaw` where needed (RLS session variables, reporting aggregates).

---

<a id="adr-0004"></a>

## ADR-0004 — Four-layer tenant isolation including Postgres RLS in Phase 1

**Context.** §8 requires all protected reads and writes be scoped by `organization_id` and forbids relying on frontend filtering. §30 makes verified tenant isolation the gate before any product data is built. This is the single highest-severity risk in the system (S-1).

**Decision.** Four mandatory layers, all delivered in Phase 1:

1. Organization context derived from the URL path and verified against `Membership` server-side on every request. Never from a cookie, header, or body.
2. A tenant-scoped data access layer as the only route to the database, with the raw client import-banned by lint and CI outside `packages/db/internal`.
3. PostgreSQL Row-Level Security on every tenant-owned table, driven by a per-transaction session variable.
4. An automated isolation test suite asserting 404 on every cross-tenant resource path — the phase gate.

**Rationale.** Layers 1 and 2 prevent the common bugs; layer 3 is the only one that still holds when application code is wrong; layer 4 is what turns "we believe it is isolated" into evidence. RLS is placed in Phase 1 rather than Phase 13 because it is cheap while every query path already carries org context and expensive once dozens of paths exist.

**Consequences.**

- _Cost, accepted deliberately:_ every tenant request runs inside a transaction with a `SET LOCAL`; migrations and seed scripts run under a role that bypasses RLS; connection pooling must be configured so a pooled connection never leaks a session variable across requests (transaction-scoped `SET LOCAL`, not `SET`).
- Returning **404 rather than 403** for cross-tenant access is deliberate: 403 confirms a resource exists, which is an information leak.

---

<a id="adr-0005"></a>

## ADR-0005 — Auth.js v5 with database sessions and passwordless sign-in

**Status:** **Superseded by [ADR-0021](#adr-0021)** (founder-approved WordPress-owned identity, 2026-07-28).

**Context.** §7 prefers Auth.js and states custom password authentication should not be implemented unless necessary.

**Decision (historical).** Auth.js v5 with the Prisma adapter and **database sessions** (not JWT). Sign-in via email magic link plus Google OAuth. No passwords.

**Rationale (historical).** No passwords means no password storage, reset flow, strength policy, or credential-stuffing surface. Database sessions were chosen so membership and role could be read from the database per request (mitigating S-14).

**Consequences (historical).** One database read per authenticated request. An email provider would have been a Phase 1 dependency.

**Supersession.** An existing WordPress website owns registration, login, password reset, sessions, profile, navigation, and all product UI. AIPro must not implement Auth.js, Clerk, Supabase Auth, magic-link sign-in, Google OAuth in-app, or any duplicate credential store. See ADR-0021 and `docs/architecture/WORDPRESS-INTEGRATION-ARCHITECTURE.md`.

---

<a id="adr-0006"></a>

## ADR-0006 — Decimal money handling in TypeScript

**Context.** §12 requires Decimal and forbids binary floating point for financial calculations. ADR-0001 removes Python's `decimal.Decimal`.

**Decision.** Money is `NUMERIC(18,6)` in Postgres, `Prisma.Decimal` (decimal.js) in application and domain code, and a string over the wire. JavaScript `number` is banned in the money path.

Enforced by: an ESLint rule forbidding arithmetic operators on money-typed values in `packages/core/economics`; a Zod money schema that parses strings, never floats; and property-based tests asserting that known adversarial cases (`0.1 + 0.2`, repeated 1/3 division, large MOQ × small unit cost) match exact decimal expectations.

**Rationale.** Correctness comes from the numeric type and the storage type, not the host language. Serializing as string over the wire prevents silent precision loss at the JSON boundary — the most common way decimal discipline is lost in TypeScript stacks.

**Consequences.** Slightly more verbose arithmetic (`.plus()`, `.times()` rather than operators). Rounding must be explicit and is applied once at presentation, never mid-calculation. Every persisted result carries a `calculationVersion` so historic reports stay reproducible when formulas change.

---

<a id="adr-0007"></a>

## ADR-0007 — Confidence removed from the composite opportunity score

**Context.** §13 lists Confidence as a scoring factor with weight 5. §14 states confidence must be separate from opportunity attractiveness and that a high score with low confidence must not be presented as a strong Go. A factor inside a weighted composite cannot simultaneously be independent of it — this is a direct contradiction in the source document (C-1).

**Decision.** Confidence is **not** a scoring factor. It is computed by its own engine and reported as a second dimension alongside the score. Its 5 points are redistributed to Demand (+2 → 17) and Margin (+3 → 18). Total remains 100.

**Rationale.** §14's requirement is the stronger and more specific one, and it is the one that protects users from acting on well-scored but poorly-evidenced opportunities. Keeping confidence inside the composite would let a 5-point penalty mathematically disappear into an otherwise strong score — precisely the failure §14 forbids. The redistribution goes to Demand and Margin because they are the factors most directly evidenced by the data this workflow actually collects.

**Consequences.** Every opportunity is presented as a pair (score, confidence). The decision chain (ADR-0008) reads both, so low confidence caps the decision at `RESEARCH_MORE` regardless of score. Weights live in versioned `OpportunityFactorDefinition` rows, so the redistribution is seed data the founder can change without a code change.

---

<a id="adr-0008"></a>

## ADR-0008 — Decision is a deterministic ordered rule chain

**Context.** §13's thresholds overlap. `Go: 75–100` and `Research More: 45–59 or low confidence` both match a score of 80 with low confidence. Precedence is undefined, so the same inputs could yield different decisions depending on evaluation order (C-2).

**Decision.** The decision is computed by an ordered chain of nine rules evaluated in sequence, first match wins, specified in `ARCHITECTURE.md` §7.3. Hard gates (unresolved Critical risk, non-positive contribution margin, score below 45) evaluate first; confidence and data-coverage gates next; band thresholds last. Every threshold is a `DecisionThreshold` database row. The engine returns the decision **and the id of the rule that fired**, which is persisted on the assessment and printed in the report.

**Rationale.** Determinism is a precondition of reproducibility, which §30 Phase 5 requires. Returning the firing rule id makes the decision explainable to a customer — "this was Test, not Go, because an unresolved High risk exists" — which is the product's core promise. Storing thresholds in the database satisfies §13's instruction not to scatter hard-coded thresholds.

**Consequences.** Adding or reordering a rule is a rule-version change; existing assessments retain their original version so historic decisions remain explainable.

---

<a id="adr-0009"></a>

## ADR-0009 — Provenance via DataSource + SourceCitation

**Context.** §11 requires up to thirteen provenance attributes for every important metric, conclusion, and recommendation. §10 forbids JSON blobs for core domain entities. Applied literally, this means thirteen duplicated columns across a dozen tables (C-5).

**Decision.** Provenance is normalized. A `DataSource` row holds the thirteen §11 attributes once and is reusable across a project. A polymorphic `SourceCitation` join table links any citable record — market evidence, competitor metric, supplier quote, factor score, report section — to one or more `DataSource` rows, carrying a per-citation note and confidence.

**Rationale.** Sources are genuinely reused (one industry report supports several metrics), so duplicating provenance per metric would both bloat the schema and let the same source drift into inconsistent copies. Normalizing satisfies §10's no-blobs rule while making §11 enforceable: "does this metric have at least one citation?" becomes a single query, which is what powers the missing-source warnings required in Phase 3.

**Consequences.** `SourceCitation` is polymorphic (`citableType` + `citableId`), so referential integrity for that edge is enforced in the application layer and by a composite index rather than by a foreign key. This is accepted; the alternative — a separate join table per citable entity — is a dozen near-identical tables.

---

<a id="adr-0010"></a>

## ADR-0010 — One reporting currency per project; manual FX rates

**Context.** §12 requires currency handling and §10 lists a `CurrencyRateSnapshot` entity. Supplier quotes genuinely arrive in multiple currencies while the sale happens in USD or EUR.

**Decision.** Each project declares one reporting currency. Any amount entered in another currency stores the amount, its currency, the FX rate used, and the rate date — entered by the analyst. No automated FX feed and no `CurrencyRateSnapshot` table in v1.

**Rationale.** An FX feed adds a vendor, an API key, a scheduled job, and a failure mode, to replace a number the analyst can type and — importantly — should be deliberate about. A market-entry model is built on a rate assumption the analyst wants to control and defend, not on whatever the rate happened to be at calculation time. Storing the rate and date on the record preserves reproducibility, which is the actual requirement.

**Consequences.** Analysts must supply rates. Stale rates are an analyst-discipline issue; the rate date is displayed alongside every converted figure and feeds the confidence engine's freshness component.

---

<a id="adr-0011"></a>

## ADR-0011 — Role is an enum, not a table

**Context.** §9 defines exactly four roles. §10 lists `Role` as an entity, implying user-defined roles (C-8).

**Decision.** `Role` is a PostgreSQL enum: `PLATFORM_ADMIN`, `ORG_ADMIN`, `ANALYST`, `CLIENT_VIEWER`. Permissions are a static matrix in code (`ARCHITECTURE.md` §5), unit-tested.

**Rationale.** A role table implies a permission table, a role-permission join, and an administration UI — a permissions subsystem no identified customer has asked for, and one that makes authorization dynamic and therefore harder to test exhaustively. A fixed enum lets the permission matrix be a table-driven unit test with complete coverage, which is what the Phase 1 gate needs.

**Consequences.** Adding a role is a migration and a code change. Custom roles are explicitly out of scope (`MVP_SCOPE.md` §4.2).

---

<a id="adr-0012"></a>

## ADR-0012 — One AuditLog; product analytics off-database

**Context.** §10 lists both `AuditLog` and `ActivityEvent` with no stated boundary (C-6). §25 requires both audit logging and product event tracking.

**Decision.** One `AuditLog` table for security-relevant and material business actions: actor, organization, action, target, before/after summary, IP, user agent, correlation id, support-grant id if applicable. Append-only. Product analytics events (`landing_view`, `survey_started`, feature usage) go to PostHog and are **never** written to the application database.

**Rationale.** The two have opposite requirements. Audit records must be complete, immutable, queryable by tenant, and retained for compliance. Analytics events are high-volume, lossy-tolerant, and privacy-sensitive in different ways. One table serving both ends up immutable-but-huge or queryable-but-mutable. Separating them also keeps high-volume analytics writes off the transactional database.

**Consequences.** Append-only is enforced twice: the DAL exposes no update or delete for `AuditLog`, and the application's database role is granted only `INSERT` and `SELECT` on it (S-13). GDPR erasure pseudonymizes the actor reference rather than deleting audit rows (see `MVP_SCOPE.md` §3.11 and Phase 11).

---

<a id="adr-0013"></a>

## ADR-0013 — Hosted Postgres branch for local development instead of Docker

**Context.** §30 Phase 0 assumes Docker Compose for PostgreSQL. Audit found **Docker is not installed**, **PostgreSQL is not installed**, and the machine has **5.3 GB free disk** (blockers B-1, B-2). Docker Desktop alone needs several gigabytes.

**Decision.** Local development uses a Neon PostgreSQL development branch over the network. No Docker. No local PostgreSQL server. `infra/` ships a `docker-compose.yml` as documentation for contributors who do have Docker, but it is not on the critical path and CI does not depend on it. CI uses the GitHub Actions `postgres` service container.

**Rationale.** Installing Docker Desktop on a disk-constrained Windows Server to run a database that a managed provider offers free is a poor trade at this stage. Neon branching additionally gives each preview deployment its own isolated database, which is genuinely useful for the RLS work in Phase 1.

**Consequences.** Development requires network connectivity and a `DATABASE_URL` before any local work. Migrations run against a real Postgres from day one, which is a benefit — RLS behaviour cannot be validated against SQLite or an in-memory substitute. Revisit if disk is expanded and offline development becomes a requirement.

---

<a id="adr-0014"></a>

## ADR-0014 — No Redis; pg-boss on Postgres if async becomes necessary

**Context.** §7 forbids Redis in Phase 1 and permits a lightweight job system only when PDF generation or AI tasks need durable async execution. Both are long-running (C-10).

**Decision.** No queue in v1. AI drafting and PDF generation run inline on a Node runtime with a raised duration limit and a visible progress state. If durable async becomes necessary, adopt `pg-boss` on the existing PostgreSQL. Redis is not adopted.

**Rationale.** The workload is a handful of analyst-initiated jobs per day, not a stream. Inline execution with an honest progress indicator is simpler, has fewer failure modes, and gives the analyst immediate feedback. When async becomes genuinely necessary, `pg-boss` gives durable jobs with transactional enqueue on the database already in production — no new service, no new secret, no new availability dependency, and it keeps §7's Redis prohibition intact rather than merely deferred.

**Consequences.** A failed AI or PDF request must be retried by the user rather than automatically. Acceptable at MVP volume. The duration limit is what drives the Vercel Pro dependency in ADR-0015.

---

<a id="adr-0015"></a>

## ADR-0015 — PDF via headless Chromium rendering the report HTML

**Context.** §18 requires both a web preview and a PDF export of a twenty-section report, with drafts watermarked. Divergence between preview and PDF would be a credibility failure in a product whose output is the deliverable.

**Decision.** The report is composed once as HTML. PDF is produced by printing that HTML with headless Chromium (`@sparticuz/chromium-min` + `playwright-core`) on a Node-runtime route with `maxDuration` raised. Documented fallback: a small container-hosted render service if the serverless path proves unreliable.

**Rationale.** A single HTML source guarantees preview and PDF cannot drift, and it means the twenty sections, the watermark, and the appendix are authored once. Declarative PDF libraries (React-PDF) would require maintaining a second layout implementation of the same report.

**Consequences.** Chromium in a serverless environment is the least robust part of this architecture and is flagged as the primary Phase 8 risk. It requires a paid Vercel tier for the duration limit (`ARCHITECTURE.md` §10). A spike is scheduled at the start of Phase 8, before the report UI is built, so the fallback can be taken early rather than late. **Status: accepted with a scheduled spike — the fallback is a live option, not a formality.**

---

<a id="adr-0016"></a>

## ADR-0016 — Validation site in the same repo; leads are platform-owned

**Context.** §19 requires a public validation website collecting personal data from US and EU prospects. §30 places it at Phase 11. The founder is pre-revenue and pre-incorporation, so this data is what validates everything else (C-11).

**Decision.** The validation site lives in the same repository and deployment under a `(public)` route group, sharing the design system. Its data — `Lead`, `SurveyResponse`, `ConsentRecord` — is **platform-owned and has no `organization_id`**. These tables are excluded from the tenant DAL and from RLS tenant policies, and are readable only by `PLATFORM_ADMIN`. The site ships as **Track B in parallel after Phase 0**, not at Phase 11.

**Rationale.** Same repo and deployment avoids a second project, domain, and pipeline for a few static pages, and lets the sample report preview reuse the real report components. Keeping leads outside the tenancy model is a correctness point, not a convenience: a prospect is not a tenant, and forcing an `organization_id` onto lead data would either invent a fake organization or create a table that silently escapes RLS. Moving it earlier is a product judgement — survey responses are the evidence that tells the founder whether Phases 2–10 are aimed at a real problem, and they are worth more in month one than in month eight.

**Consequences.** Public routes must be explicitly exempted from the auth middleware, and that exemption list is a security-review item (S-11, S-17). GDPR obligations — lawful basis, retention, erasure — attach from the moment the form goes live, so the privacy policy and consent record ship **with** Track B, not after it.

---

<a id="adr-0017"></a>

## ADR-0017 — Channel readiness merged into the scoring phase

**Context.** §13 gives Channel Readiness a 10-point scoring weight in Phase 5, but §30 does not build channel readiness until Phase 6. Phase 5 therefore cannot satisfy its own acceptance criterion that the total score be reproducible (C-3).

**Decision.** Channel readiness is built in Phase 5 alongside scoring, confidence, and risk. Original Phases 5 and 6 merge; later phases renumber (`ARCHITECTURE.md` §14).

**Rationale.** A scoring engine missing 10% of its weight cannot be validated, and shipping a placeholder that returns a neutral value for one factor would produce scores that change retroactively when Phase 6 lands — breaking reproducibility, which is Phase 5's stated gate.

**Consequences.** Phase 5 is the largest phase in the plan and should be broken into at least four Cursor tasks. Net phase count drops from fourteen to thirteen.

---

<a id="adr-0018"></a>

## ADR-0018 — Analyst-led concierge model; 19 screens for v1

**Context.** §4 describes a software-enabled service with a concierge SaaS MVP; §21 specifies 28 self-serve screens and §10 a ~60-entity model. These describe different products (C-4).

**Decision.** The MVP is an internal analyst tool with a read-only client surface. The analyst is the primary user. Client viewers get project view, approved report, comments, and upload — nothing more. Screen count is 19: §21's items 7–17 become tabs of one project workspace.

**Rationale.** §4 is the commercial reality (the founder delivers the first engagements personally) and §2's instruction is to build "the narrowest coherent system." Self-serve is not merely more screens — it is onboarding, empty states, guidance, error recovery, and help content, none of which the concierge model needs. Consolidating eleven per-project screens into one tabbed workspace loses no functionality from §5's success criteria and removes a navigation model.

**Consequences.** If the founder intends genuine self-serve, Phases 2–9 roughly double and this ADR must be superseded before Phase 2. This is open question 3 in `ARCHITECTURE.md` §15.

---

<a id="adr-0019"></a>

## ADR-0019 — Critical-risk override restricted to ORG_ADMIN and above

**Context.** §15 says a Critical risk blocks Go unless "an analyst explicitly overrides it," but §9 grants Analysts no override authority and does not name who may (C-7).

**Decision.** Overriding an unresolved Critical risk requires `ORG_ADMIN` or `PLATFORM_ADMIN`. A written reason is mandatory. The override is audit-logged with actor, timestamp, and reason, and is printed on the face of any report containing the assessment.

**Rationale.** Overriding a Critical risk is the highest-consequence action in the product — it converts a blocked recommendation into a Go on a decision worth substantial capital. Separating who produces the analysis from who accepts its residual risk is a basic control. Requiring a reason and surfacing it in the report means the override is visible to the customer, not buried in a log.

**Consequences.** A solo analyst who is also the org admin can still override — the control is a record and a disclosure, not an obstacle. Overridden Criticals are counted and displayed on the assessment summary so a pattern of overrides is visible.

---

<a id="adr-0020"></a>

## ADR-0020 — Platform-admin cross-org access requires a time-boxed SupportGrant

**Context.** §9 gives Founder/Platform Admin the ability to "access organizations for support." §5 lets any signed-in user create an organization. Together these give the platform a permanent cross-tenant read path into every customer's data (C-9, S-3).

**Decision.** Platform admins have **no ambient cross-organization access**. Access requires a `SupportGrant` row naming the organization, a reason, the granting actor, and an expiry of at most 24 hours. Every request served under a grant is audit-logged with the grant id and is visible in the _target organization's_ audit log. Organization creation is rate-limited per user and audit-logged.

**Rationale.** "Support access" is how multi-tenant products leak customer data, because it is usually implemented as a boolean that bypasses every check and is never reviewed. Making it an explicit, expiring, reasoned, and customer-visible record means the strongest privilege in the system leaves evidence and cannot be exercised silently. It also keeps the tenant DAL honest: the grant supplies an `organizationId` to the normal scoped path rather than introducing a bypass path.

**Consequences.** Supporting a customer takes one extra deliberate step. The grant path is part of the Phase 1 isolation test suite: an expired or absent grant must produce the same 404 as any other cross-tenant request.

---

<a id="adr-0021"></a>

## ADR-0021 — WordPress-Owned Identity and Presentation Architecture

**Status:** **Accepted** (founder-approved 2026-07-28)

**Context.** Phase 0 assumed a standalone Next.js customer UI with Auth.js (ADR-0005). The founder's brand website is an **existing WordPress site**. Building a second login, registration, password-reset, and customer portal would create duplicate credentials and a split user experience.

**Decision.**

1. **WordPress owns identity and presentation.** Public/brand pages, registration, login, password reset, session management, account/profile, WordPress roles/capabilities, menus/navigation, and **all** customer-facing and analyst-facing product screens live in WordPress.
2. **AIPro does not create separate credentials.** No Auth.js, Clerk, Supabase Auth, custom application passwords, magic-link auth, Google OAuth in the AIPro app, or duplicate customer accounts. Never store WordPress passwords, password hashes, reset tokens, or session cookies in Neon.
3. **AIPro backend stores only identity mappings** (internal UUID, WordPress site id, WordPress user id, organization memberships, mapped application role, status, timestamps). Email/display name may be cached only when needed for product operation. WordPress remains the identity source of truth.
4. **All product UI appears within WordPress** via plugin `aipro-platform-bridge` (shortcodes, Gutenberg blocks, native pages, Option B bundled React). **Do not default to iframes.** Iframes require a documented technical constraint and explicit founder approval. Do not expose a second application domain as the main customer interface.
5. **A custom WordPress integration plugin is required** for auth bridge, capability mapping, server-to-server token issuance, UI embedding, CSRF/nonce, admin config, health checks, and audit-friendly logs (no secrets).
6. **Backend authorization remains mandatory.** Short-lived signed tokens (RS256 or EdDSA) are minted only by the trusted plugin. The API validates signature, issuer, audience, expiry, site id, user id, organization id, and mapped role — then **re-enforces** membership and permissions from Neon. Never trust browser-supplied role or organization identifiers alone.
7. **Logical architecture:** WordPress → `aipro-platform-bridge` → Secure AIPro Backend API → Neon → AI/reporting services.
8. **Hosting clarification:** Vercel may host the **backend API** and internal services. WordPress remains the primary customer-facing website. Neon remains the application database and must **not** be merged with the WordPress database.

**Rationale.** One website, one login, one account, one navigation system matches the commercial brand site and removes an entire credential-attack surface from AIPro while preserving four-layer tenant isolation in the API and Postgres.

**Consequences.**

- ADR-0005 is superseded. TASK-003 (Auth.js) is superseded; see `docs/tasks/WORDPRESS-INTEGRATION-FOUNDATION.md`.
- TASK-002 Part B schema drops Auth.js tables (`accounts`, `sessions`, `verification_tokens`). `users` become WordPress identity mappings. Invitations may be deferred to WordPress.
- Screen delivery moves to WordPress (ADR-0018 screen list still applies as product surface, hosted in WP).
- Companions: `docs/architecture/WORDPRESS-INTEGRATION-ARCHITECTURE.md`, `docs/security/WORDPRESS-AUTH-BRIDGE-THREAT-MODEL.md`, `docs/integration/WORDPRESS-PLUGIN-TECHNICAL-SPEC.md`, `docs/integration/WORDPRESS-BACKEND-API-CONTRACT.md`.

**References.** Founder decision recorded under TASK-007; see also MVP_SCOPE and ARCHITECTURE updates.
