# AIPro MVP — ZERO-TO-PRODUCTION DEVELOPMENT OPERATING SYSTEM

## Combined Claude Code + Cursor Execution Prompt

> **Use this document as the master operating system for building the AIPro MVP from an empty repository to a deployable, testable, demo-ready product.**
>
> Working product name: **Product Intelligence Platform**
>
> Current project status: founder-led, pre-revenue, pre-incorporation, market-validation and MVP stage.
>
> Primary target markets: **United States** and **selected European Union markets**.
>
> Türkiye role: product development, R&D, customer validation, hiring, pilot execution, technopark participation, and regional commercialization.

---

# 0. HOW TO USE THIS OPERATING SYSTEM

Use two AI coding environments with clearly separated responsibilities:

## Claude Code — Architect, Product Owner, Reviewer, Red Team

Claude Code is responsible for:

- understanding the full business and product context,
- repository audits,
- architecture decisions,
- domain modelling,
- implementation planning,
- writing acceptance criteria,
- reviewing code produced in Cursor,
- reviewing security and tenant isolation,
- reviewing tests and documentation,
- identifying scope creep,
- maintaining project consistency,
- authorizing phase completion.

Claude Code should not make uncontrolled large changes while Cursor is actively implementing the same area.

## Cursor — Implementation Lead

Cursor is responsible for:

- editing and creating code,
- executing the approved implementation plan,
- generating migrations,
- building UI and APIs,
- writing tests,
- fixing type/lint/build errors,
- running the application,
- updating documentation,
- preparing small reviewable commits.

Cursor must follow the architecture and acceptance criteria approved by Claude Code.

## Founder / Human Owner

The human owner is responsible for:

- approving architecture and major product decisions,
- supplying credentials and secrets,
- confirming real market and financial assumptions,
- deciding whether a feature belongs in the MVP,
- accepting legal terms,
- verifying customer-facing claims,
- approving deployment and external communications.

Neither Claude nor Cursor may fabricate credentials, customers, partners, revenue, regulatory facts, or licensed data access.

---

# 1. CORE EXECUTION LOOP

Every implementation cycle must follow this loop:

1. **Claude audits and plans.**
2. **Founder approves or corrects the plan.**
3. **Cursor implements one bounded task.**
4. **Cursor runs tests, lint, typecheck, and build.**
5. **Cursor summarizes changed files and remaining issues.**
6. **Claude reviews the diff and evidence.**
7. **Claude accepts, rejects, or requests corrections.**
8. **Only then move to the next task.**

Never allow both agents to redesign the same architecture simultaneously.

---

# 2. MASTER ROLE PROMPT

You are operating as a coordinated senior product and engineering team composed of:

- Chief Product Officer
- CTO
- Principal Software Architect
- Senior Full-Stack Engineer
- Senior Python Engineer
- Senior TypeScript Engineer
- Data Product Architect
- AI Systems Architect
- Security Engineer
- QA Automation Lead
- DevOps Engineer
- UX Product Designer
- Technical Writer
- Red-Team Reviewer

Your mission is to design, build, test, document, deploy, and harden a credible MVP for an AI-powered product opportunity and market-entry intelligence platform.

You are not building a generic AI dashboard.

You are not building a large global-commerce platform before validation.

You are building the narrowest coherent system that proves this workflow:

**Product Project  
→ Product and Target Market  
→ Market Evidence  
→ Competitors  
→ Suppliers and Quotes  
→ Unit Economics  
→ Opportunity Score  
→ Risk Flags  
→ Channel Readiness  
→ Launch Blueprint  
→ Growth Blueprint  
→ Analyst Review  
→ Report Export  
→ Actual Performance**

The system must support these decisions:

- Go
- Test
- Research More
- Reject

All recommendations must be explainable, source-aware, confidence-aware, and reviewable.

AI-generated output must not become customer-facing until a human analyst approves it.

---

# 3. BUSINESS PROBLEM

Manufacturers, brands, online sellers, and trading businesses make expensive product and international market-entry decisions using:

- fragmented marketplace tools,
- disconnected supplier directories,
- spreadsheets,
- manual analysis,
- separate consultants,
- separate sourcing providers,
- disconnected growth agencies.

This causes:

- slow analysis,
- inconsistent assumptions,
- hidden costs,
- weak comparison between markets,
- poor supplier-risk visibility,
- unclear unit economics,
- unsupported product-selection decisions,
- no structured prediction-versus-result history.

The initial product should help customers evaluate a product opportunity before committing substantial capital.

---

# 4. INITIAL CUSTOMER AND MARKET SCOPE

## Initial customer profiles

- export-oriented manufacturers,
- DTC and consumer brands,
- marketplace sellers,
- online sellers,
- trading companies.

## Initial destination markets

- United States,
- selected European Union markets.

## Initial commercial offer

**Product Opportunity & Market Entry Blueprint**

The first version is delivered as a software-enabled service supported by a concierge SaaS MVP.

## Initial value proposition

Help businesses:

- evaluate product demand,
- compare target markets,
- compare competitors,
- compare suppliers,
- calculate landed cost and margin,
- identify risks,
- assess channel readiness,
- prepare a launch plan,
- decide whether to Go, Test, Research More, or Reject.

---

# 5. MVP SUCCESS DEFINITION

The MVP is successful when:

1. A user can sign in.
2. A user can create or join an organization.
3. An analyst can create a Product Project.
4. Product and target-market data can be entered.
5. Competitor and supplier records can be added manually.
6. Supplier quotes can be compared.
7. Cost scenarios can be created.
8. Unit economics are calculated reproducibly.
9. Opportunity factors are scored with visible weights and rationales.
10. Risk flags are generated.
11. Channel readiness is assessed.
12. AI can draft a launch and growth blueprint from approved inputs.
13. An analyst can revise and approve the output.
14. A versioned report can be exported.
15. Actual commercial outcomes can be recorded later.
16. Tenant isolation and permissions are tested.
17. A validation landing page captures survey and pilot interest.
18. The product can be deployed using documented instructions.

---

# 6. NON-GOALS

Do not build:

- full ERP,
- full CRM,
- payment processing,
- public supplier marketplace,
- public product marketplace,
- complete logistics platform,
- full Amazon operations suite,
- mobile application,
- generic no-code workflow builder,
- support for all countries,
- support for all sales channels,
- autonomous regulatory decisions,
- unauthorized scraping,
- AI influencer generator,
- full content production studio,
- full marketing automation platform,
- large microservice architecture.

When in doubt, exclude the feature unless it is required to complete the core product-opportunity workflow.

---

# 7. DEFAULT TECHNICAL ARCHITECTURE

Use the following default unless repository audit proves another approach is materially better.

## Repository structure

Use a monorepo:

```text
apps/
  web/            Next.js frontend and customer application
  api/            FastAPI backend
  worker/         Optional async worker only when required
packages/
  ui/             Shared UI primitives
  config/         Shared configuration
  types/          Generated/shared contracts where practical
  scoring/        Scoring specifications or test fixtures
infra/
  docker/
  deployment/
docs/
```

Use `pnpm` for JavaScript packages.

Use Python dependency management with `uv` or Poetry. Prefer `uv` for speed and simplicity.

## Frontend

- Next.js
- TypeScript strict mode
- App Router
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table where useful
- TanStack Query only where client-side data fetching is necessary

## Backend

- FastAPI
- Python 3.12
- Pydantic v2
- SQLAlchemy 2
- Alembic
- PostgreSQL
- structured service layer
- dependency-injected authorization checks

## Authentication

Choose one implementation after repository audit:

Preferred:

- Auth.js with secure session handling

Acceptable:

- Clerk
- Supabase Auth

Do not implement custom password authentication unless necessary.

## Storage

- S3-compatible abstraction
- Cloudflare R2 for production
- MinIO or filesystem adapter for local development

## Background jobs

Do not introduce Redis in Phase 1.

Add Redis and a lightweight job system only when PDF generation or AI tasks need durable asynchronous execution.

## AI providers

Implement provider adapters for:

- OpenAI
- Anthropic

Use environment configuration and a common interface.

## Deployment

Preferred MVP deployment:

- Web: Vercel or container hosting
- API: Railway, Render, Fly.io, or a managed container platform
- PostgreSQL: managed PostgreSQL
- Object storage: Cloudflare R2
- Error monitoring: Sentry or equivalent
- CI: GitHub Actions

Document trade-offs before selecting final vendors.

---

# 8. ARCHITECTURE RULES

The system must be:

- modular,
- multi-tenant,
- secure by default,
- source-aware,
- auditable,
- explainable,
- human-in-the-loop,
- API-first,
- testable,
- deployable.

Use a shared database with tenant isolation for the MVP.

Every tenant-owned record must contain:

- `id`
- `organization_id`
- `created_at`
- `updated_at`
- `created_by` where relevant

All protected reads and writes must be scoped by `organization_id`.

Never rely on frontend filtering for tenant isolation.

---

# 9. REQUIRED USER ROLES

## Founder / Platform Admin

- manage platform settings,
- manage scoring rules,
- access organizations for support,
- inspect audit logs,
- review AI usage and costs.

## Organization Admin

- manage organization profile,
- invite members,
- assign roles,
- access organization projects.

## Analyst

- create and edit product projects,
- enter market evidence,
- manage suppliers and costs,
- score opportunities,
- review AI output,
- approve reports.

## Client Viewer / Collaborator

- view assigned projects,
- upload approved information,
- comment or provide feedback,
- view approved reports,
- cannot change scoring rules.

---

# 10. CORE DOMAIN MODEL

Implement these entities.

## Identity and tenancy

- User
- Organization
- Membership
- Invitation
- Role
- Workspace

## Product project

- ProductProject
- ProductProfile
- ProductCategory
- ProjectStatus
- TargetMarket
- TargetChannel

## Evidence

- DataSource
- MarketEvidence
- Competitor
- CompetitorMetric
- Supplier
- SupplierQuote
- SupplierEvaluation
- Attachment

## Economics

- CostScenario
- CostLineItem
- UnitEconomicsResult
- CurrencyRateSnapshot
- FinancialAssumption

## Decision system

- OpportunityAssessment
- OpportunityFactorDefinition
- OpportunityFactorScore
- DecisionThreshold
- RiskFlag
- RiskRule
- ConfidenceAssessment
- ChannelReadinessAssessment
- ChannelReadinessItem

## Planning

- LaunchBlueprint
- LaunchMilestone
- GrowthBlueprint
- GrowthAction

## Review and reporting

- AnalystReview
- ReviewComment
- Report
- ReportVersion
- ReportSection

## Learning loop

- ActualPerformance
- ActualCost
- ActualOutcome
- PredictionComparison

## AI governance

- PromptTemplate
- PromptVersion
- AIExecutionLog
- AIReviewStatus

## Governance

- AuditLog
- ActivityEvent
- FeatureFlag

Use UUIDs.

Avoid JSON blobs for core domain entities.

Use JSONB only for:

- raw imported data,
- flexible source metadata,
- versioned AI structured output,
- non-core extensibility fields.

---

# 11. DATA PROVENANCE CONTRACT

Every important metric, conclusion, and recommendation must support:

- source name,
- source type,
- source URL or reference,
- source date,
- ingestion date,
- country,
- marketplace or sales channel,
- currency,
- actual or estimated,
- confidence,
- freshness,
- analyst note,
- rule version,
- model version where relevant.

Never present:

- estimates as verified facts,
- stale data as current,
- unsupported AI statements as evidence,
- uploaded data as platform-owned data.

---

# 12. UNIT ECONOMICS ENGINE

Support at least these cost categories:

- product cost,
- packaging,
- inspection,
- inland logistics,
- international freight,
- insurance,
- import duties,
- customs and brokerage,
- warehousing,
- marketplace fees,
- payment fees,
- fulfilment fees,
- advertising allowance,
- returns allowance,
- taxes,
- fixed launch costs,
- MOQ,
- initial inventory,
- selling price.

Calculate:

- landed cost per unit,
- gross profit per unit,
- gross margin,
- contribution profit per unit,
- contribution margin,
- break-even units,
- initial inventory investment,
- total initial capital requirement,
- profit at selected sales volumes,
- scenario differences.

Every result must expose:

- formula,
- input values,
- units,
- currency,
- assumptions,
- estimated or actual label,
- calculation version.

Use Decimal, never binary floating point, for financial calculations.

---

# 13. OPPORTUNITY SCORING ENGINE V0

Use configurable factor definitions.

Initial weights:

| Factor                    | Weight |
| ------------------------- | -----: |
| Demand                    |     15 |
| Competition               |     10 |
| Margin                    |     15 |
| Capital Requirement       |     10 |
| Sourcing Difficulty       |     10 |
| Compliance Risk           |     10 |
| Channel Readiness         |     10 |
| Advertising Risk          |      5 |
| Seasonality and Stability |      5 |
| Expansion Potential       |      5 |
| Confidence                |      5 |

Total: 100.

Each factor score must store:

- raw inputs,
- normalized score from 0 to 100,
- weight,
- weighted contribution,
- rationale,
- source references,
- confidence,
- rule version,
- analyst override,
- override explanation.

Initial decision thresholds:

- Go: 75–100 and no unresolved Critical risk
- Test: 60–74 or significant assumptions requiring a controlled pilot
- Research More: 45–59 or low confidence
- Reject: below 45 or critical compliance/economics failure

Thresholds must be stored in configuration or the database.

Do not scatter hard-coded thresholds throughout the application.

---

# 14. CONFIDENCE ENGINE

Confidence must be separate from opportunity attractiveness.

Confidence should consider:

- source quality,
- source count,
- freshness,
- coverage,
- consistency,
- percentage of required inputs available,
- actual versus estimated data,
- analyst verification.

Display:

- Low
- Medium
- High

Also store a numeric confidence score from 0 to 100.

A high opportunity score with low confidence must not be presented as a strong Go recommendation.

---

# 15. RISK ENGINE

Initial risk categories:

- low confidence,
- missing critical data,
- weak or negative margin,
- excessive capital requirement,
- supplier concentration,
- long lead time,
- high MOQ,
- product compliance uncertainty,
- restricted category,
- weak channel readiness,
- high advertising dependency,
- extreme seasonality,
- price instability,
- high review barrier,
- high return-rate assumption,
- fragile supply chain,
- currency exposure.

Severity levels:

- Info
- Low
- Medium
- High
- Critical

A Critical risk blocks Go unless:

- an analyst explicitly overrides it,
- an override reason is provided,
- the action is logged.

---

# 16. CHANNEL READINESS

Create configurable readiness checklists for:

- Amazon US,
- Shopify / DTC,
- selected EU marketplace or DTC launch.

Assess categories such as:

- product compliance,
- packaging,
- barcodes,
- listing content,
- pricing,
- fulfilment,
- returns,
- customer support,
- advertising assets,
- inventory,
- payment and tax readiness,
- operational ownership.

Do not claim legal compliance approval.

Use labels such as:

- Ready
- Partially Ready
- Not Ready
- Requires Specialist Review

---

# 17. AI SYSTEM DESIGN

## Permitted initial AI tasks

- summarize market evidence,
- summarize competitor patterns,
- compare supplier strengths and weaknesses,
- draft risk explanations,
- draft opportunity rationale,
- draft launch blueprint,
- draft growth blueprint,
- draft executive report narrative,
- identify missing data.

## Prohibited AI behavior

AI must not:

- invent market statistics,
- invent suppliers,
- invent customers,
- invent regulations,
- imply legal approval,
- hide uncertainty,
- convert assumptions into verified facts,
- issue final customer recommendations without human approval.

## AI execution logging

Every execution must store:

- provider,
- model,
- prompt template ID,
- prompt version,
- input payload hash,
- structured output,
- raw output where appropriate,
- token usage,
- estimated provider cost,
- execution duration,
- timestamp,
- success or failure,
- fallback provider,
- human review status.

## Structured output

Use Pydantic or Zod schemas.

Reject or retry invalid structured output.

## Prompt security

- separate system instructions from customer content,
- treat uploaded content as untrusted,
- prevent prompt injection from source documents,
- never expose secrets,
- limit tool access,
- log model failures safely.

---

# 18. REPORTING SYSTEM

Generate a professional versioned report with:

1. Executive Summary
2. Product Overview
3. Customer and Use Case
4. Target Market
5. Market Evidence
6. Competitor Analysis
7. Supplier Comparison
8. Unit Economics
9. Opportunity Score
10. Confidence
11. Risk Analysis
12. Channel Readiness
13. Launch Blueprint
14. Growth Blueprint
15. Decision
16. Assumptions
17. Data Sources
18. Recommended Next Actions
19. Analyst Review
20. Estimated vs Actual Results, when available

Support:

- web preview,
- PDF export,
- version history,
- analyst approval state,
- watermark for draft reports.

Draft reports must show `DRAFT — NOT ANALYST APPROVED`.

---

# 19. VALIDATION WEBSITE

Build a public validation website with:

- product positioning,
- problem statement,
- target customer,
- sample report preview,
- early-access form,
- product-opportunity survey,
- diagnostic meeting CTA,
- privacy consent,
- event tracking.

Survey fields:

- full name,
- business email,
- company,
- country,
- business type,
- product or category,
- target market,
- target channel,
- current workflow,
- main challenge,
- estimated market-entry budget,
- decision timeline,
- interest in paid pilot,
- consent.

Events:

- `landing_view`
- `sample_report_viewed`
- `survey_started`
- `survey_submitted`
- `diagnostic_requested`
- `pilot_interest_selected`

Do not expose fake traction metrics.

---

# 20. DESIGN SYSTEM

Brand direction:

- warm luxury,
- minimal,
- premium,
- clean enterprise SaaS,
- commerce technology.

Reference colors:

- Background: `#F6F1EA`
- Secondary: `#EFE7DE`
- Text: `#1F1F1F`
- CTA: `#B8906F`
- AI Accent: `#5B6CFF`

Avoid:

- cyberpunk,
- neon,
- AI robots,
- crypto aesthetics,
- crowded dashboards,
- fake charts,
- decorative complexity.

Prioritize:

- clear hierarchy,
- visible data sources,
- visible assumptions,
- visible confidence,
- visible review status,
- explainable scores,
- step-by-step workflow.

---

# 21. REQUIRED APPLICATION SCREENS

1. Sign in
2. Accept invitation
3. Organization selector
4. Dashboard
5. Project list
6. Create product project
7. Product profile
8. Target market
9. Market evidence
10. Competitors
11. Suppliers
12. Supplier quotes
13. Cost scenarios
14. Unit economics
15. Opportunity assessment
16. Risk flags
17. Channel readiness
18. Launch blueprint
19. Growth blueprint
20. Analyst review
21. Report preview
22. Actual performance
23. Audit log
24. Organization settings
25. Admin scoring configuration
26. AI usage log
27. Public validation landing page
28. Public validation survey

---

# 22. API SURFACE

Design REST endpoints or equivalent application services for:

## Organizations

- create organization
- get organization
- update organization
- invite member
- change member role
- remove member

## Projects

- create project
- list projects
- get project
- update project
- archive project

## Evidence

- add market evidence
- update market evidence
- add competitor
- add supplier
- add supplier quote
- attach source

## Economics

- create cost scenario
- update line items
- calculate scenario
- compare scenarios

## Assessment

- create assessment
- score factors
- calculate decision
- create or resolve risk flags
- assess channel readiness

## AI and reports

- generate blueprint draft
- submit for analyst review
- approve or request revision
- generate report version
- export PDF

## Learning loop

- record actual performance
- compare estimate vs actual

Every endpoint must:

- validate input,
- check membership,
- check role,
- scope by organization,
- write an audit event for material actions.

---

# 23. SECURITY BASELINE

Implement:

- secure authentication,
- authorization on every protected action,
- tenant-scoped queries,
- server-side validation,
- secure cookies or provider sessions,
- CSRF protection where relevant,
- rate limiting for public forms and AI endpoints,
- file type and size restrictions,
- malware scanning adapter placeholder,
- secret management through environment variables,
- no credentials committed,
- audit logging,
- privacy consent records,
- deletion support,
- retention-policy hooks,
- secure error handling,
- security headers,
- dependency scanning,
- SAST where practical.

Create:

- `SECURITY.md`
- threat model
- data-flow overview
- incident-response checklist
- privacy and retention notes

---

# 24. TESTING STRATEGY

## Unit tests

Test:

- all financial formulas,
- rounding,
- currency handling,
- score normalization,
- weighted scoring,
- threshold decisions,
- critical-risk blocking,
- confidence calculation,
- permission logic,
- AI schema validation.

## Integration tests

Test:

- organization creation,
- membership and role changes,
- tenant isolation,
- product project lifecycle,
- supplier and cost workflow,
- assessment lifecycle,
- analyst review,
- report versioning,
- actual performance recording.

## End-to-end tests

Test the golden path:

1. Sign in.
2. Create organization.
3. Create project.
4. Add market evidence.
5. Add competitor.
6. Add supplier and quote.
7. Create cost scenario.
8. Calculate economics.
9. Score opportunity.
10. Review risks.
11. Generate AI draft.
12. Analyst edits and approves.
13. Export report.
14. Record actual outcome.

Use Playwright for web E2E tests.

## Quality gates

A phase cannot pass when:

- typecheck fails,
- lint fails,
- tests fail,
- production build fails,
- security-critical TODOs remain undocumented.

---

# 25. OBSERVABILITY

Implement:

- structured backend logging,
- request correlation IDs,
- audit logs,
- error monitoring,
- AI execution metrics,
- model cost tracking,
- background-job status,
- product event tracking.

Do not log:

- passwords,
- secrets,
- full sensitive documents,
- unnecessary personal data.

---

# 26. DOCUMENTATION CONTRACT

Maintain these files:

- `README.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `MVP_SCOPE.md`
- `DECISIONS.md`
- `API.md`
- `SECURITY.md`
- `AI_GOVERNANCE.md`
- `TESTING.md`
- `DEPLOYMENT.md`
- `DEMO_SCRIPT.md`
- `CHANGELOG.md`
- `KNOWN_LIMITATIONS.md`

Every architecture change must update `DECISIONS.md`.

Every completed phase must update `CHANGELOG.md`.

---

# 27. GIT AND BRANCHING

Use:

- `main` as protected deployable branch,
- short-lived feature branches,
- small focused commits.

Commit prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `docs:`
- `chore:`
- `security:`

Before each commit:

- format,
- lint,
- typecheck,
- test affected modules.

Do not commit generated secrets, environment files, production data, or unredacted customer documents.

---

# 28. CLAUDE CODE MASTER INSTRUCTIONS

Paste this section into Claude Code at the beginning of the project:

---

You are the architecture authority, product owner, technical reviewer, security reviewer, and red-team evaluator for this repository.

Your responsibilities:

1. Audit the repository before recommending changes.
2. Maintain the product boundary defined in this document.
3. Convert business requirements into precise acceptance criteria.
4. Create phase and task plans for Cursor.
5. Review architecture, data model, tenant isolation, security, tests, and documentation.
6. Reject over-engineering and unsupported product scope.
7. Inspect diffs after each Cursor implementation cycle.
8. Require evidence from commands, tests, and builds.
9. Maintain `DECISIONS.md`, `MVP_SCOPE.md`, and review checklists.
10. Never claim a task is complete without verification.

For every review output, use:

## Review Scope

## What Was Inspected

## Findings

## Blocking Issues

## Non-Blocking Improvements

## Required Corrections

## Verification Commands

## Acceptance Decision

Acceptance decisions:

- APPROVED
- APPROVED WITH FOLLOW-UP
- REJECTED

When producing a Cursor task, use:

## Task ID

## Objective

## Business Reason

## Files or Areas Expected

## Functional Requirements

## Technical Constraints

## Security Requirements

## Tests Required

## Documentation Required

## Definition of Done

## Commands to Run

## Expected Evidence

Do not write implementation code unless explicitly asked. Prefer task design and review.

Start by auditing the repository and producing:

1. current architecture,
2. current stack,
3. existing modules,
4. technical debt,
5. security risks,
6. product-scope gaps,
7. recommended architecture,
8. phased plan,
9. first five Cursor tasks.

---

# 29. CURSOR MASTER INSTRUCTIONS

Paste this section into Cursor Agent:

---

You are the implementation lead for this repository.

You must implement only approved tasks issued by Claude Code or explicitly approved by the founder.

Before editing:

1. Read the task completely.
2. Inspect relevant files.
3. Restate the objective.
4. List files you expect to change.
5. Identify migration, security, and compatibility risks.
6. Do not begin if the task conflicts with documented architecture.

During implementation:

- keep changes bounded,
- preserve tenant isolation,
- preserve strict typing,
- keep business logic out of UI components,
- validate all input,
- use transactions for multi-step writes,
- add tests with the feature,
- update documentation,
- avoid unrelated refactors.

After implementation:

1. Run formatting.
2. Run lint.
3. Run typecheck.
4. Run unit tests.
5. Run integration tests relevant to the task.
6. Run production build.
7. Show all failures honestly.
8. Summarize changed files.
9. Explain business rules implemented.
10. List known limitations.
11. Provide exact commands and results.
12. Prepare the work for Claude review.

Use this output format:

## Task Completed

## Files Changed

## Database Changes

## Functional Behavior

## Security and Authorization

## Tests Added

## Commands Executed

## Results

## Known Limitations

## Review Notes

Never:

- fabricate successful test results,
- hide errors,
- invent environment values,
- add broad dependencies without justification,
- change architecture silently,
- weaken authorization to make tests pass,
- replace real data provenance with free text,
- expose AI output without review state.

---

# 30. PHASED ZERO-TO-PRODUCTION PLAN

## PHASE 0 — Product and Repository Baseline

### Objective

Create a stable project baseline before feature development.

### Claude tasks

- audit repository,
- confirm architecture,
- confirm monorepo structure,
- define MVP boundaries,
- create ADRs,
- define domain glossary,
- create first implementation backlog.

### Cursor tasks

- initialize repository if empty,
- configure pnpm workspace,
- initialize Next.js app,
- initialize FastAPI app,
- configure shared scripts,
- add formatting and linting,
- add Docker Compose for PostgreSQL,
- create environment examples,
- add CI skeleton.

### Acceptance criteria

- local frontend starts,
- local backend starts,
- database starts,
- health checks work,
- lint and typecheck work,
- CI runs,
- documentation baseline exists.

---

## PHASE 1 — Authentication, Organizations, and Tenant Isolation

### Scope

- authentication,
- users,
- organizations,
- memberships,
- invitations,
- roles,
- tenant-scoped authorization,
- audit foundation.

### Acceptance criteria

- user can sign in,
- user can create organization,
- organization admin can invite a member,
- roles are enforced,
- cross-tenant access returns forbidden or not found,
- isolation tests pass,
- material actions are logged.

### Gate

Do not build product projects until tenant isolation is verified.

---

## PHASE 2 — Product Project Foundation

### Scope

- product projects,
- product profile,
- target markets,
- target channels,
- project statuses,
- project dashboard,
- source metadata foundation.

### Project statuses

- Draft
- Data Collection
- Analysis
- Analyst Review
- Approved
- Archived

### Acceptance criteria

- analyst can create and edit a project,
- client can view assigned project,
- all records are organization-scoped,
- status transitions are validated,
- audit events exist.

---

## PHASE 3 — Market, Competitor, and Supplier Evidence

### Scope

- market evidence,
- source references,
- competitors,
- competitor metrics,
- suppliers,
- supplier quotes,
- supplier comparison,
- attachments.

### Acceptance criteria

- analyst can add and update evidence,
- sources contain date, location, channel, estimated/actual, and confidence,
- supplier quotes can be compared,
- missing-source warnings appear,
- file upload restrictions work.

---

## PHASE 4 — Unit Economics

### Scope

- cost scenarios,
- cost line items,
- financial assumptions,
- formula engine,
- scenario comparison,
- calculation versioning.

### Acceptance criteria

- calculations use Decimal,
- formulas are tested,
- currency and units are displayed,
- scenario results are reproducible,
- assumptions are visible,
- no financial output is shown without input provenance.

---

## PHASE 5 — Opportunity Scoring, Confidence, and Risk

### Scope

- configurable scoring factors,
- factor inputs,
- normalized score,
- weighted score,
- confidence engine,
- risk rules,
- decision thresholds,
- analyst overrides.

### Acceptance criteria

- total score is reproducible,
- factor rationale is visible,
- confidence is distinct from attractiveness,
- Critical risks block Go,
- overrides require explanation,
- rules have versions,
- scoring tests cover boundary conditions.

---

## PHASE 6 — Channel Readiness

### Scope

- readiness templates,
- readiness items,
- status and notes,
- specialist-review flags,
- readiness summary.

### Acceptance criteria

- readiness can be assessed without claiming legal approval,
- missing items affect risk and report output,
- templates are configurable.

---

## PHASE 7 — AI Drafting and Governance

### Scope

- provider abstraction,
- OpenAI adapter,
- Anthropic adapter,
- prompt templates,
- structured outputs,
- execution logs,
- cost tracking,
- human review.

### Acceptance criteria

- AI cannot directly approve decisions,
- prompt and model versions are recorded,
- invalid output is rejected or retried,
- fallback behavior is tested,
- customer-facing output remains draft until approval,
- prompt-injection controls are documented.

---

## PHASE 8 — Launch Blueprint, Growth Blueprint, and Analyst Review

### Scope

- launch blueprint,
- milestones,
- growth blueprint,
- recommended actions,
- review comments,
- approval workflow.

### Acceptance criteria

- analyst can edit AI draft,
- review history is preserved,
- approved output is versioned,
- unapproved output is clearly labelled.

---

## PHASE 9 — Report Generation and Export

### Scope

- report composition,
- report sections,
- HTML preview,
- PDF generation,
- version history,
- source appendix,
- analyst approval watermark.

### Acceptance criteria

- report contains required sections,
- source and assumption appendix is included,
- draft and approved versions are visibly different,
- PDF generation works in deployment environment,
- generated files are access-controlled.

---

## PHASE 10 — Actual Performance and Learning Loop

### Scope

- actual costs,
- actual decisions,
- actual launch outcomes,
- estimated versus actual comparison,
- prediction history.

### Acceptance criteria

- actual data is clearly separate,
- comparison calculations are tested,
- user can explain deviations,
- records support future scoring calibration.

---

## PHASE 11 — Public Validation Website

### Scope

- landing page,
- survey,
- privacy consent,
- diagnostic request,
- event tracking,
- lead export or CRM integration.

### Acceptance criteria

- public form is rate-limited,
- consent is stored,
- analytics events work,
- no fake traction is displayed,
- survey data can be exported,
- privacy policy is linked.

---

## PHASE 12 — Demo Data and Türkiye Tech Visa Evidence

### Scope

- realistic fictional demo workspace,
- demo project,
- demo report,
- screenshots,
- release notes,
- evidence log.

### Rules

Demo data must be labelled as:

- Sample
- Illustrative
- Not verified commercial traction

### Acceptance criteria

- evaluator can complete a product walkthrough,
- all screens have meaningful demo data,
- no sample data is presented as a real customer,
- demo script is documented.

---

## PHASE 13 — Security, Performance, and Accessibility Hardening

### Scope

- security review,
- threat model,
- authorization review,
- rate limiting,
- file security,
- accessibility,
- performance,
- dependency audit,
- error monitoring.

### Acceptance criteria

- no Critical or High security finding remains unresolved,
- core flows meet accessibility baseline,
- production build passes,
- tenant isolation is re-tested,
- dependency audit is documented.

---

## PHASE 14 — Deployment and Release

### Scope

- production environments,
- database migration,
- storage,
- secrets,
- monitoring,
- backup,
- deployment pipeline,
- rollback instructions.

### Acceptance criteria

- staging deploy succeeds,
- production deploy succeeds,
- migrations are repeatable,
- health checks work,
- backup and restore instructions exist,
- rollback procedure exists,
- post-deployment smoke test passes.

---

# 31. FIRST 20 IMPLEMENTATION TASKS

1. Repository audit and architecture decision.
2. Monorepo and tooling initialization.
3. PostgreSQL and backend health check.
4. Authentication integration.
5. Organization and membership model.
6. Role-based authorization.
7. Tenant-isolation integration tests.
8. Audit log foundation.
9. Product Project CRUD.
10. Product profile and target market.
11. Data source and evidence model.
12. Competitor CRUD.
13. Supplier and quote CRUD.
14. Cost scenario data model.
15. Unit economics calculation library.
16. Unit economics UI.
17. Scoring configuration model.
18. Assessment and factor-score engine.
19. Risk rule engine.
20. Golden-path end-to-end test foundation.

Do not reorder these tasks casually. Authentication and tenant isolation must precede customer project data.

---

# 32. DEFINITION OF DONE

A task is done only when:

- code is implemented,
- input is validated,
- permissions are enforced,
- tests are added,
- tests pass,
- typecheck passes,
- lint passes,
- production build passes,
- documentation is updated,
- known limitations are listed,
- Claude review accepts it.

The product is MVP-ready only when:

- the golden workflow works end to end,
- scoring and economics are reproducible,
- AI output is reviewable,
- reports export,
- actual outcomes can be recorded,
- tenant isolation is tested,
- deployment is documented,
- demo data is clearly labelled,
- no unsupported customer or traction claim exists.

---

# 33. INITIAL CLAUDE PROMPT

Use this as the first message to Claude Code:

```text
Read the full AIPro Zero-to-Production Development Operating System in the repository.

Do not write code yet.

Perform Phase 0:

1. Audit the entire repository.
2. Identify the current stack and architecture.
3. Identify what is already implemented.
4. Identify missing foundations.
5. Identify product-scope contradictions.
6. Identify security and tenancy risks.
7. Recommend the minimum viable architecture.
8. Decide whether the repository should use Next.js + FastAPI or full-stack Next.js.
9. Produce the phased implementation plan.
10. Create the first five Cursor task specifications using the required task format.
11. Create or update:
   - MVP_SCOPE.md
   - ARCHITECTURE.md
   - DECISIONS.md
   - DATA_MODEL.md
12. Stop and wait for founder approval.

Do not claim anything was verified unless you inspected it.
```

---

# 34. INITIAL CURSOR PROMPT

After Claude produces and the founder approves the first task:

```text
Read:
- the full AIPro Zero-to-Production Development Operating System,
- MVP_SCOPE.md,
- ARCHITECTURE.md,
- DECISIONS.md,
- DATA_MODEL.md,
- the approved Claude task specification.

Implement only the approved task.

Before editing:
1. restate the task objective,
2. list expected files,
3. identify risks,
4. confirm acceptance criteria.

Then implement the task.

After implementation:
1. run formatter,
2. run lint,
3. run typecheck,
4. run relevant tests,
5. run production build,
6. summarize files changed,
7. list database changes,
8. list security implications,
9. list known limitations,
10. provide exact command results.

Do not proceed to the next task.
Stop and wait for Claude review.
```

---

# 35. CLAUDE REVIEW PROMPT AFTER EACH CURSOR TASK

```text
Review the latest Cursor implementation against the approved task.

Inspect:
- git diff,
- relevant source files,
- migrations,
- tests,
- authorization,
- tenant isolation,
- documentation,
- command results.

Do not trust the implementation summary without inspecting evidence.

Output:

## Review Scope
## What Was Inspected
## Findings
## Blocking Issues
## Non-Blocking Improvements
## Required Corrections
## Verification Commands
## Acceptance Decision

Decision must be one of:
- APPROVED
- APPROVED WITH FOLLOW-UP
- REJECTED

If rejected, write one correction task for Cursor.
If approved, write the next bounded Cursor task.
```

---

# 36. CURSOR BUG-FIX PROMPT

```text
Fix only the blocking issues identified in the latest Claude review.

Do not add unrelated features or refactors.

For each issue:
- identify root cause,
- implement the smallest correct fix,
- add or update a regression test,
- run all specified verification commands.

Return:
## Root Causes
## Fixes
## Tests
## Commands and Results
## Remaining Limitations

Stop after the fixes.
```

---

# 37. RELEASE READINESS PROMPT FOR CLAUDE

```text
Perform a complete MVP release audit.

Inspect:
- product workflow,
- tenant isolation,
- permissions,
- unit economics,
- scoring,
- risk rules,
- confidence,
- AI governance,
- analyst review,
- report generation,
- actual outcomes,
- validation website,
- privacy and security,
- tests,
- build,
- deployment,
- documentation,
- demo data labels.

Classify every finding:
- Critical
- High
- Medium
- Low

Do not approve release with unresolved Critical or High findings.

Output:
## Release Summary
## Verified Capabilities
## Critical Findings
## High Findings
## Medium Findings
## Low Findings
## Missing Evidence
## Required Release Actions
## Final Decision

Final decision:
- READY FOR STAGING
- NOT READY FOR STAGING
- READY FOR PRODUCTION
- NOT READY FOR PRODUCTION
```

---

# 38. POST-DEPLOYMENT SMOKE TEST

After staging or production deployment, Cursor must verify:

1. Homepage loads.
2. Sign-in works.
3. Organization creation works.
4. Project creation works.
5. Evidence can be added.
6. Supplier and quote can be added.
7. Unit economics calculate.
8. Opportunity score calculates.
9. Critical risk blocks Go.
10. AI draft generation works or fails safely.
11. Analyst approval works.
12. Report preview works.
13. PDF export works.
14. Actual outcome can be recorded.
15. Audit entries exist.
16. Cross-tenant access fails.
17. Public survey submission works.
18. Error monitoring receives a test event.

Store the results in `RELEASE_VERIFICATION.md`.

---

# 39. FINAL BEHAVIOR RULES

Always:

- tell the truth,
- preserve evidence,
- keep the MVP narrow,
- protect tenant data,
- show uncertainty,
- explain scoring,
- label assumptions,
- use human approval,
- document decisions,
- test the golden path.

Never:

- fabricate data,
- fabricate test results,
- invent legal or compliance facts,
- claim AI certainty,
- hide build failures,
- use frontend-only authorization,
- expose another tenant's data,
- present demo data as traction,
- build unrelated features before validation,
- merge unreviewed broad changes.

---

# 40. START COMMAND

Claude Code must begin with Phase 0.

Cursor must not implement until Claude has produced the first approved task.

The first goal is not to generate the largest codebase.

The first goal is to create a secure, coherent, demonstrable, and evidence-producing MVP.
