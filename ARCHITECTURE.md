# ARCHITECTURE.md — Product Intelligence Platform

**Status:** Proposed — awaiting founder approval
**Last updated:** 2026-07-28
**Companion documents:** `MVP_SCOPE.md`, `DECISIONS.md`, `DATA_MODEL.md`

---

## 1. Current State (audited 2026-07-28)

This section records what was actually inspected, not what was assumed.

### 1.1 Repository contents

```
C:\AI-MVP\
└── AIPro_Zero_to_Production_Claude_Cursor_Operating_System.md   (41,088 bytes)
```

**One file. Nothing else.** Verified by recursive listing including hidden entries; total file count = 1.

- **Not a git repository at the time of audit.** `git rev-parse --is-inside-work-tree` → `fatal: not a git repository`.
- No `.gitignore`, no `.gitattributes`, no `package.json`, no lockfile, no source code, no tests, no CI configuration, no environment files, no documentation beyond the operating system document.
- No `docs/`, `apps/`, `packages/`, or `infra/` directories.

**Correction — state changed during the Phase 0 session.** A `.git` directory was created by the tooling while these documents were being written (not by a deliberate `git init`). Re-verified at the end of the session:

- The repository now exists but has **zero commits**.
- The current branch is **`master`**, not `main`. §27 of the operating system requires `main` as the protected deployable branch.
- `user.name` and `user.email` are still unset (blocker B-3 stands).
- There is still **no `.gitignore`**, and the working tree — including `.claude/settings.local.json`, a machine-local settings file — has been **auto-staged**.

This changes T-001: it must adopt an existing repository rather than initialize one, rename the branch to `main`, and **add `.gitignore` before the first commit** so local-only and future environment files are never committed. Recorded as blocker B-7.

### 1.2 Current stack

**There is no stack.** The repository is a specification document, not a codebase.

Consequently, items 3 and 4 of the Phase 0 brief resolve to:

- **What is already implemented:** nothing. Zero lines of application code exist.
- **Technical debt:** none inherited. This is a genuine greenfield start — the single most valuable property this project currently has, and the reason the architecture decision below matters so much.

### 1.3 Development environment (verified)

| Component | Status | Evidence |
|---|---|---|
| Node.js | **22.13.1** installed | `C:\Program Files\nodejs\node.exe -v` |
| npm | **10.9.2** | `npm.cmd -v` |
| corepack | present | `C:\Program Files\nodejs\corepack.cmd` |
| pnpm | **not installed** | resolvable via `corepack enable pnpm` |
| Python | **3.12.8** installed | `C:\Program Files\Python312\python.exe --version` |
| uv / Poetry | **not installed** | `Get-Command` → not found |
| Docker | **not installed** | no `C:\Program Files\Docker`, `docker` not found |
| PostgreSQL (local) | **not installed** | no `C:\Program Files\PostgreSQL`, `psql` not found |
| Git | **2.47.1.windows.1** | `git --version` |
| Git user.name / user.email | **not configured** | `git config --global` returns empty |
| `core.autocrlf` | **not configured** | `git config --global core.autocrlf` returns empty |
| GitHub CLI / Vercel CLI | **not installed** | `Get-Command` → not found |
| winget | **not available** | `Get-Command winget` → not found |
| OS | Windows Server 2022 Datacenter (10.0.20348) | |
| Disk | **39.9 GB total, 5.3 GB free — single volume** | `Win32_LogicalDisk` |

### 1.4 Environment blockers — must be cleared before Cursor starts

These are real and will stop work if ignored.

| ID | Blocker | Impact | Resolution |
|---|---|---|---|
| **B-1** | **5.3 GB free disk.** A Next.js + Prisma + Playwright install needs roughly 1.5–2.5 GB (`node_modules`) plus ~1 GB for Playwright browser binaries, plus build output and pnpm store. | `pnpm install` or `playwright install` will fail or leave the machine unusable. | Free space or expand the volume to ≥ 25 GB free **before** T-001. Alternatively run Playwright only in CI. Founder decision required. |
| **B-2** | **No Docker and no local PostgreSQL.** The operating system's Phase 0 Cursor task assumes Docker Compose for Postgres. | Cannot start a database locally as specified. | Use a hosted development Postgres branch (Neon free tier) for local development. No Docker install needed. See ADR-0013. |
| **B-3** | **Git identity unset.** | Commits will fail or be authored anonymously. | `git config --global user.name` / `user.email` in T-001. |
| **B-4** | **`core.autocrlf` unset on Windows.** | CRLF/LF churn between this machine and Linux CI; noisy diffs; lint rule failures. | Commit a `.gitattributes` with `* text=auto eol=lf` in T-001. |
| **B-5** | **No git remote, no GitHub CLI.** | CI cannot run; no code backup. | Founder creates the private GitHub repository and provides the remote URL. |
| **B-6** | **No secrets or accounts provisioned** (Postgres, R2, Anthropic, OpenAI, Sentry, email sender). | Phases 1, 7, 9 cannot complete. | Founder provisions. Never fabricated. See §11. |
| **B-7** | **Repository auto-initialized with zero commits, on branch `master`, no `.gitignore`, working tree auto-staged** (see §1.1 correction). | §27 requires `main`. Committing now would capture `.claude/settings.local.json` and set the precedent for committing local files — the same path that leaks a `.env` later (S-4). | T-001 adopts the existing repo: write `.gitignore` first, unstage local-only files, rename `master` → `main`, then make the initial commit. |

---

## 2. The Central Architecture Decision

> **Question (Phase 0 brief item 8): Next.js + FastAPI, or full-stack Next.js?**
>
> **Decision: full-stack Next.js. Single service. No FastAPI.**

The operating system document defaults to Next.js + FastAPI but explicitly permits deviation where "repository audit proves another approach is materially better" (§7). Here is the argument.

### 2.1 Why a single service is materially better here

**1. Two runtimes double the authorization surface, and authorization is the hard gate.**
Phase 1's gate is tenant isolation: *"Do not build product projects until tenant isolation is verified."* With one service there is exactly one place a request is authenticated and one place `organization_id` scoping is applied. Split across Next.js and FastAPI, you must first invent and secure a service-to-service auth scheme — JWT signing, key distribution, audience and expiry validation, clock skew, rotation — before writing one line of business logic. That is a new attack surface bought before any product value.

**2. The preferred auth library is Next.js-native.**
§7 prefers Auth.js. Auth.js sessions live in Next.js. Pairing it with FastAPI leaves two options: duplicate session verification in Python (two implementations of the security-critical path — the classic way isolation bugs are born), or proxy every call through Next.js — at which point FastAPI is a remote database client that adds a network hop and a deployment.

**3. It removes an entire production environment.**
Dropping the API service removes one host, one secret set, one CI job, one health check, one migration runner, one rollback procedure, and one incident surface. For a pre-incorporation, founder-led team this is not a preference; it is most of the Phase 14 workload.

**4. The Decimal argument does not survive inspection.**
The strongest case for Python is `decimal.Decimal` for §12's financial rules. But financial correctness comes from storing `NUMERIC` in Postgres, never touching IEEE floats in the calculation path, and unit-testing the formulas. Prisma maps Postgres `Decimal` to `decimal.js` end to end. §12's rule — *"Use Decimal, never binary floating point"* — is fully satisfiable in TypeScript. This is enforced by lint rule and by test, not by language choice. See ADR-0006.

**5. Pydantic-vs-Zod is a non-issue.**
§17 explicitly permits either: *"Use Pydantic or Zod schemas."* Zod is already required for the forms layer, so it comes for free.

**6. The document's own non-goals argue against it.**
§6 forbids a "large microservice architecture." Two services with a solo founder is how that starts.

### 2.2 What is genuinely lost, and how it is mitigated

The honest cost: if the founder later hires Python engineers, or if the Phase 10 learning loop grows into real scoring calibration or ML, Python becomes valuable.

**Mitigation — this is a binding architectural constraint, not a note:**

All decision logic — unit economics, scoring, confidence, risk rules, decision thresholds — lives in `packages/core` as **pure, framework-free, dependency-light TypeScript functions**. That package must not import Next.js, Prisma, React, or any I/O. It takes plain inputs and returns plain outputs. All I/O happens in the app layer around it.

The consequence: extracting a service later — Node or Python — is re-exposing an already-isolated module behind HTTP. A bounded refactor, not a rewrite. If we are wrong about this decision, the cost of reversing it is capped.

**Revisit trigger (recorded in ADR-0001):** revisit if (a) a Python-first engineer is hired, (b) the learning loop needs a real ML pipeline, or (c) a single request path needs > 5 minutes of compute.

---

## 3. Repository Structure

A pnpm workspace monorepo, adapted from §7 — one application instead of three.

```
AI-MVP/
├── apps/
│   └── web/                    Next.js 15 App Router — UI, route handlers, auth
│       ├── app/
│       │   ├── (public)/       Landing page, survey, privacy policy
│       │   ├── (auth)/         Sign in, accept invitation
│       │   └── (app)/
│       │       └── orgs/[orgSlug]/    ALL tenant-scoped screens live here
│       ├── server/             Server-only: DAL, services, authz, audit
│       │   ├── auth/
│       │   ├── db/             Tenant-scoped data access layer
│       │   ├── services/       Use cases; orchestrates core + db + audit
│       │   └── ai/             Provider adapters, prompt registry, exec log
│       └── e2e/                Playwright golden-path tests
├── packages/
│   ├── core/                   PURE domain logic. No I/O. No framework.
│   │   ├── economics/          Landed cost, margins, break-even
│   │   ├── scoring/            Factor normalization, weighting, decision rules
│   │   ├── confidence/         Confidence engine
│   │   └── risk/               Risk rule evaluation
│   ├── db/                     Prisma schema, migrations, seed, generated client
│   ├── ui/                     shadcn/ui primitives + shared components
│   ├── types/                  Shared Zod schemas and contracts
│   └── config/                 Shared ESLint / TS / Tailwind config
├── infra/
│   └── deployment/             Deploy runbooks, env templates
├── docs/
│   ├── tasks/                  Approved Cursor task specifications
│   └── adr/
└── .github/workflows/          CI
```

**`apps/api` and `apps/worker` are deliberately absent.** `packages/scoring` from §7 is folded into `packages/core`.

---

## 4. Technology Choices

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 22 LTS | Pinned via `engines` + `.nvmrc` |
| Package manager | pnpm 9 via corepack | Not yet installed — T-001 |
| Framework | Next.js 15, App Router | Server Components default |
| Language | TypeScript 5.x, `strict: true` | `noUncheckedIndexedAccess` on |
| Styling | Tailwind CSS + shadcn/ui | Brand tokens per §20 |
| Forms | React Hook Form + Zod | Same Zod schema validates on the server |
| Tables | TanStack Table | Supplier/scenario comparison |
| Client data | TanStack Query — only where needed | Default to Server Components + Server Actions |
| Database | PostgreSQL 16 | |
| ORM | Prisma 6 | Mature migrations; `Decimal` mapping. ADR-0003 |
| Auth | Auth.js v5 (NextAuth), database sessions | Email magic link + Google OAuth. No custom passwords. ADR-0005 |
| Money | Postgres `NUMERIC(18,6)` ↔ `decimal.js` | ADR-0006 |
| Storage | S3-compatible interface; Cloudflare R2 in prod, local filesystem adapter in dev | MinIO dropped — needs Docker (B-2) |
| AI | Anthropic + OpenAI adapters behind one interface | Anthropic default |
| Structured output | Zod | |
| PDF | Headless Chromium rendering the report HTML | ADR-0015 |
| Async jobs | None in v1. `pg-boss` on Postgres if needed | No Redis. ADR-0014 |
| Rate limiting | Postgres-backed fixed window | No Redis dependency |
| Unit/integration tests | Vitest | |
| E2E | Playwright | Runs in CI; locally optional (B-1) |
| Error monitoring | Sentry | |
| CI | GitHub Actions | |
| Analytics | PostHog (EU region) | Product events only — never in the app DB |

---

## 5. Tenant Isolation — The Load-Bearing Design

§8 requires: *"All protected reads and writes must be scoped by `organization_id`. Never rely on frontend filtering."* This is the Phase 1 gate. Four layers, all mandatory.

### Layer 1 — Org context is derived from the URL, then verified
Every tenant screen lives under `/orgs/[orgSlug]/…`. On every request the server resolves `orgSlug → Organization`, then looks up a `Membership` for the session user. **No membership → 404 (not 403 — do not confirm the organization exists).**

The active organization is **never** read from a cookie, header, or request body. Client-supplied tenant identifiers are the standard source of cross-tenant bugs and are structurally excluded.

### Layer 2 — A tenant-scoped data access layer is the only way to reach the database
`packages/db` exports no unscoped client to application code. Services receive a `TenantContext { organizationId, userId, role }` and call `getTenantDb(ctx)`, which returns a Prisma client extension that injects `organization_id` into every `where` clause and every `create` on a tenant-owned model.

Enforced mechanically:
- The raw Prisma client is exported only from a `server-only` internal module.
- An ESLint rule bans importing it outside `packages/db/internal` and the migration/seed scripts.
- CI fails on violation.

`findUnique({ where: { id } })` on a tenant model is banned outright. Lookups go through the scoped client so an ID from another tenant returns null.

### Layer 3 — PostgreSQL Row-Level Security as defense in depth
RLS is enabled on every tenant-owned table with a policy on `current_setting('app.current_organization_id')`. The scoped client sets it inside the transaction on every request.

**Why in Phase 1 and not later:** RLS is cheap when every query path already carries org context and expensive to retrofit once dozens of paths exist. It is the only layer that still holds if application code has a bug. Cost: every request runs in a transaction with a `SET LOCAL`, and migrations/seed run as a bypassing role. This is a real complexity cost, accepted deliberately. ADR-0004.

### Layer 4 — Isolation is proven by tests, not by inspection
Phase 1 ships a test suite that, for every tenant-owned resource, creates two organizations and asserts Org B's user gets 404 on Org A's resources — reads, writes, updates, deletes, file downloads, and report URLs. This suite is the gate. It re-runs in Phase 13.

### Role permissions

| Capability | PLATFORM_ADMIN | ORG_ADMIN | ANALYST | CLIENT_VIEWER |
|---|:--:|:--:|:--:|:--:|
| View assigned projects | ✔ | ✔ | ✔ | ✔ |
| Create/edit projects, evidence, suppliers, costs | ✔ | ✔ | ✔ | — |
| Score opportunities, run AI drafts | ✔ | ✔ | ✔ | — |
| Approve analyst review / publish report | ✔ | ✔ | ✔ | — |
| Override a Critical risk | ✔ | ✔ | — | — |
| Invite members, change roles | ✔ | ✔ | — | — |
| Edit scoring factor definitions & thresholds | ✔ | ✔ | — | — |
| Upload files | ✔ | ✔ | ✔ | ✔ |
| Comment | ✔ | ✔ | ✔ | ✔ |
| View audit log | ✔ | ✔ | — | — |
| Cross-organization access | via explicit grant only | — | — | — |

**Platform admin cross-org access** is not ambient. It requires a `SupportGrant` row with an organization, a reason, an expiry (max 24h), and the granting actor. Every request under a grant is audit-logged with the grant id and surfaced in the target organization's audit log. ADR-0020.

---

## 6. Unit Economics Engine

Lives in `packages/core/economics`. Pure functions. Signature shape:

```
calculateUnitEconomics(inputs: EconomicsInput): EconomicsResult
```

**Rules:**
- Every monetary value is a `Decimal`. Floats are banned in this package by lint rule and asserted in tests.
- Rounding is explicit and applied once, at presentation — never mid-calculation.
- Every output field carries: `value`, `currency`, `unit`, `formula` (human-readable), `inputRefs`, `isEstimate`, and `calculationVersion`.
- `calculationVersion` is stamped on every persisted `UnitEconomicsResult`. Changing a formula requires a version bump so historic reports remain reproducible.
- Currency: one reporting currency per project. Supplier quotes may be in any currency; each carries the FX rate and rate date used, entered by the analyst. No automated FX feed in v1 (ADR-0010).

Reproducibility test: given a persisted scenario's inputs and `calculationVersion`, recalculation reproduces the stored result exactly.

---

## 7. Scoring, Confidence, and the Decision Rule

### 7.1 Revised factor weights

Confidence is removed as a factor (contradiction C-1). Its 5 points are redistributed to Demand and Margin — the two factors most directly evidenced by the data the workflow actually collects.

| Factor | §13 weight | **v1 weight** |
|---|---:|---:|
| Demand | 15 | **17** |
| Competition | 10 | **10** |
| Margin | 15 | **18** |
| Capital Requirement | 10 | **10** |
| Sourcing Difficulty | 10 | **10** |
| Compliance Risk | 10 | **10** |
| Channel Readiness | 10 | **10** |
| Advertising Risk | 5 | **5** |
| Seasonality & Stability | 5 | **5** |
| Expansion Potential | 5 | **5** |
| ~~Confidence~~ | ~~5~~ | **removed — separate dimension** |
| **Total** | 100 | **100** |

Weights live in `OpportunityFactorDefinition` rows, versioned. The table above is seed data, not code. Changing weights creates a new rule version; existing assessments keep their original version.

### 7.2 Confidence engine
Separate, `packages/core/confidence`. Produces 0–100 plus a Low/Medium/High band from: source quality, source count, freshness, coverage, internal consistency, share of required inputs present, actual-vs-estimated ratio, and analyst verification. Its component breakdown is stored so the number is explainable.

### 7.3 Deterministic decision rule (resolves contradiction C-2)

Evaluated in order. **First match wins.** No rule is ever evaluated out of sequence.

```
1. Any unresolved risk with severity = CRITICAL          → REJECT
   (unless an active override exists with a reason, by
    ORG_ADMIN or PLATFORM_ADMIN, audit-logged → continue)
2. Contribution margin ≤ 0                               → REJECT
3. score < 45                                            → REJECT
4. confidenceBand = LOW                                  → RESEARCH_MORE
5. requiredInputsPresent < 70%                           → RESEARCH_MORE
6. 45 ≤ score < 60                                       → RESEARCH_MORE
7. 60 ≤ score < 75                                       → TEST
8. score ≥ 75 and any HIGH severity risk unresolved      → TEST
9. score ≥ 75                                            → GO
```

Rule 4 is what makes §14's requirement real: a score of 80 with low confidence returns `RESEARCH_MORE`, never `GO`. The engine returns both the decision and the **id of the rule that fired**, which is stored on the assessment and printed in the report. Every threshold in this chain is a `DecisionThreshold` row, not a literal.

### 7.4 Risk engine
`packages/core/risk` evaluates versioned `RiskRule` rows against the assembled project state and emits `RiskFlag`s across the 17 §15 categories at five severities. Overrides require a reason, are role-restricted, are audit-logged, and appear on the report face.

---

## 8. AI Architecture

```
Service layer
    ↓ builds a typed request from APPROVED project data only
PromptTemplate (versioned) + input payload
    ↓
AIProvider interface  →  AnthropicAdapter | OpenAIAdapter
    ↓
Zod schema validation  → invalid: retry once → still invalid: fail visibly
    ↓
Persist artifact with reviewStatus = DRAFT
    ↓
AIExecutionLog written on every attempt, success or failure
```

**Controls:**
- **Prompt injection:** all customer content (evidence text, uploaded document text, supplier notes) is passed as clearly delimited user-role content, never concatenated into the system prompt. The system prompt is a constant in the prompt registry. Retrieved document text is explicitly labelled untrusted in the prompt and the model is instructed that it contains data, not instructions.
- **No tools.** v1 AI calls have no tool or function access. Nothing the model emits can cause a side effect.
- **Grounding:** prompts require the model to cite the supplied evidence ids and to emit an explicit `insufficientEvidence` field rather than filling gaps. Output containing statistics with no matching evidence id is rejected at validation.
- **Cost control:** per-organization daily token budget and request rate limit, enforced before dispatch. Exceeded budget fails closed with a clear message.
- **Human gate:** an artifact with `reviewStatus = DRAFT` is never rendered to a `CLIENT_VIEWER` and never included in an approved report version.
- **Logging:** input is stored as a SHA-256 hash plus the structured output. Raw customer content is not duplicated into the log.

---

## 9. Reporting

The report is composed server-side into an HTML document — the single source of truth for both preview and PDF. Approving a report creates an immutable `ReportVersion` that **snapshots the rendered content and its inputs**, so a historic report never changes when underlying project data changes later. Draft versions render a `DRAFT — NOT ANALYST APPROVED` watermark in both HTML and PDF. PDFs are stored in R2 under an org-scoped key and served only via signed URLs with a short TTL, after a membership check.

---

## 10. Deployment

| Concern | Choice |
|---|---|
| Web application | Vercel, region `fra1` (Frankfurt) |
| Database | Neon PostgreSQL, EU region, with branching for dev/preview |
| Object storage | Cloudflare R2, EU jurisdiction |
| Email | Resend or Postmark (magic links, invitations) |
| Error monitoring | Sentry |
| Analytics | PostHog EU |
| CI | GitHub Actions: lint → typecheck → unit → integration → build → E2E |

**EU region throughout** because target markets include the EU and the validation site collects EU personal data (§19). Choosing EU residency now is free; migrating later is not.

**Named cost:** the AI drafting and PDF routes need `maxDuration` above the free tier's limit, which requires **Vercel Pro (~$20/user/month)**. This is a real dependency of the plan, not an optional upgrade. If the founder prefers not to pay it, the alternative is container hosting (Railway/Fly.io) for the whole app — one deployment either way. Founder decision, needed before Phase 9, not before Phase 1.

---

## 11. Secrets the Founder Must Supply

Never fabricated, never committed. Required by phase:

- **Phase 1:** `DATABASE_URL` (Neon), `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, email provider API key, `NEXTAUTH_URL`
- **Phase 3:** R2 account id, access key, secret, bucket
- **Phase 7:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- **Phase 11:** PostHog key
- **Phase 13/14:** Sentry DSN, GitHub repository + Actions secrets

`.env.example` documents every variable with no real values. `.env*` is git-ignored from the first commit. CI runs secret scanning (gitleaks).

---

## 12. Security Risks Identified in Phase 0

Ranked. Each has an owning phase. Full threat model lands in `SECURITY.md` in Phase 13; these are designed for from Phase 1.

| # | Risk | Severity | Mitigation | Phase |
|---|---|:--:|---|:--:|
| S-1 | Cross-tenant data access (IDOR) | **Critical** | Four-layer isolation (§5); gate tests | 1 |
| S-2 | Client-supplied active-organization identifier | **Critical** | Org context from URL, verified against Membership server-side; never from cookie/header | 1 |
| S-3 | Platform-admin cross-org access as an ambient backdoor | **Critical** | Time-boxed `SupportGrant` with reason; every request logged; visible to the target org | 1 |
| S-4 | Secrets committed on first push | **Critical** | `.gitignore` + gitleaks in CI before any real key exists | 0/1 |
| S-5 | Invitation token guessable, reusable, or not email-bound | **High** | 256-bit random token, hashed at rest, single use, 7-day expiry, bound to the invited email | 1 |
| S-6 | Privilege escalation via invitation or self role-change | **High** | Role assignment restricted to ORG_ADMIN; a user cannot change their own role; last-admin removal blocked | 1 |
| S-7 | Prompt injection from uploaded documents and evidence text | **High** | Untrusted content never in system prompt; no tools; schema-validated output; evidence-id grounding | 7 |
| S-8 | AI cost abuse / financial DoS | **High** | Per-org budget + rate limit enforced pre-dispatch; fail closed | 7 |
| S-9 | Unauthenticated or cross-tenant access to uploaded files and PDFs | **High** | Org-scoped keys; membership check then short-TTL signed URL; never served from the app origin | 3 / 9 |
| S-10 | Malicious file upload | **High** | Allow-list of MIME types, magic-byte check, size cap, generated storage keys (never user filenames), AV adapter placeholder | 3 |
| S-11 | Public survey abuse — spam, PII harvest, enumeration | **High** | Rate limit by IP + email, bot mitigation, no result echo, consent record | 11 |
| S-12 | GDPR: no lawful basis, retention, or erasure path for leads and users | **High** | Consent record with policy version; documented retention; erasure pseudonymizes the user and preserves the audit trail | 11 / 13 |
| S-13 | Audit log tampering or deletion | **Medium** | Append-only: no update/delete path in the DAL; DB grants deny UPDATE/DELETE to the application role | 1 |
| S-14 | Session not invalidated on role change or org removal | **Medium** | Database sessions; membership and role read per request, not trusted from the session token | 1 |
| S-15 | Draft AI output leaking to a client viewer | **Medium** | `reviewStatus` checked in the DAL query, not only in the UI | 7 / 8 |
| S-16 | Server Action invoked directly, bypassing UI checks | **Medium** | Every Server Action independently re-authenticates, re-authorizes, and re-validates. UI state is never a security control | 1 |
| S-17 | Missing security headers, no CSRF on public forms | **Medium** | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`; Auth.js CSRF; origin check on public POSTs | 1 / 11 |
| S-18 | Vulnerable dependencies | **Medium** | `pnpm audit` + Dependabot in CI | 0 |
| S-19 | Report snapshot drift — an approved report silently changing | **Medium** | Immutable versioned snapshots | 9 |
| S-20 | Verbose errors leaking schema or stack traces | **Low** | Generic client errors; detail to Sentry with a correlation id | 1 |

---

## 13. Observability

Structured JSON logging with a per-request correlation id propagated through services and into Sentry and the audit log. AI execution metrics and cost tracked per organization and per model. Product analytics events go to PostHog, never the application database. **Never logged:** passwords, tokens, API keys, full uploaded documents, or personal data beyond a user id.

---

## 14. Phased Implementation Plan

Two tracks. Track B is independent of the application and unblocks market validation immediately — the founder is pre-revenue, and the survey data is what de-risks Phases 2–10. Running it in parallel rather than at Phase 11 is the single highest-value sequencing change in this plan.

### Track A — Product

| Phase | Scope | Gate |
|---|---|---|
| **0** | Repo, tooling, CI, docs baseline, environment blockers cleared | Frontend starts, DB reachable, lint/typecheck/CI green |
| **1** | Auth, users, organizations, memberships, invitations, roles, tenant-scoped DAL, RLS, audit log | **HARD GATE — isolation test suite passes. No project data before this.** |
| **2** | Product projects, profile, target markets, channels, status lifecycle, project workspace | Org-scoped, transitions validated, audit events written |
| **3** | DataSource + citations, market evidence, competitors, suppliers, quotes, comparison, attachments | Provenance complete; missing-source warnings; upload restrictions enforced |
| **4** | Cost scenarios, line items, economics engine, comparison, versioning | Decimal-only, formulas tested, results reproducible |
| **5** | Scoring factors, confidence engine, risk rules, channel readiness, decision chain, overrides *(merges original 5 + 6)* | Reproducible score; confidence independent; Critical blocks Go; boundary tests pass |
| **6** | AI provider abstraction, prompt registry, structured output, execution log, cost control *(was 7)* | AI cannot approve; versions recorded; invalid output rejected; injection controls documented |
| **7** | Launch/growth blueprints, analyst review, approval workflow *(was 8)* | Draft clearly labelled; history preserved; approved output versioned |
| **8** | Report composition, HTML preview, PDF, versions, appendix, watermark *(was 9)* | All 20 sections; draft ≠ approved; PDF works in the deployed environment; files access-controlled |
| **9** | Actual costs and outcomes, estimate-vs-actual comparison *(was 10)* | Actuals structurally separate; comparison tested |
| **10** | Demo workspace, labelled sample data, screenshots, demo script *(was 12)* | Every screen populated; nothing presented as real traction |
| **11** | Security, performance, accessibility hardening; threat model; dependency audit; isolation re-test *(was 13)* | No unresolved Critical or High finding |
| **12** | Staging + production deploy, migrations, backups, monitoring, rollback *(was 14)* | Deploys succeed; smoke test passes; rollback documented |

### Track B — Market Validation (parallel, starts after Phase 0)

| Phase | Scope | Gate |
|---|---|---|
| **B-1** | Landing page, positioning, sample report preview, survey, consent, privacy policy, event tracking, rate limiting, lead export | Forms rate-limited; consent stored; analytics firing; **no fabricated traction**; privacy policy linked |

*(This is §30's Phase 11, moved earlier. It shares the design system and repo but no tenant tables.)*

### Sequencing rules
1. Phase 1's isolation gate is absolute. Nothing in Phases 2–9 starts until it passes.
2. Channel readiness ships with scoring (it is a scoring input — contradiction C-3).
3. No phase passes with failing typecheck, lint, tests, or production build (§24).
4. Every completed phase updates `CHANGELOG.md`; every architecture change updates `DECISIONS.md`.

---

## 15. Open Questions for the Founder

Answers change the plan. None blocks Phase 0 except Q1 and Q2.

1. **Disk (B-1):** can the volume be expanded to ≥ 25 GB free, or should Playwright run only in CI?
2. **GitHub:** private repository URL, and confirmation that Neon + Vercel accounts can be created.
3. **Delivery model (C-4):** confirm analyst-led concierge, not self-serve SaaS.
4. **Weights (C-1):** approve redistributing Confidence's 5 points to Demand (+2) and Margin (+3), or specify a different redistribution.
5. **Override authority (C-7):** confirm Critical-risk override is `ORG_ADMIN` and above, not `ANALYST`.
6. **Hosting (§10):** accept Vercel Pro (~$20/user/mo), or prefer container hosting?
7. **Channels:** confirm Amazon US + Shopify/DTC only for v1.
8. **Legal:** who is the data controller for EU leads before incorporation? This affects the privacy policy in Track B.
