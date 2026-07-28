# DATA_MODEL.md — Product Intelligence Platform

**Status:** Proposed — awaiting founder approval
**Last updated:** 2026-07-28
**Database:** PostgreSQL 16 · **ORM:** Prisma 6 (ADR-0003)

---

## 1. Conventions

Binding rules for every table.

**Identifiers.** UUID v7 primary keys, column `id`. UUID v7 is time-ordered, so it keeps B-tree index locality that random UUID v4 destroys — the same benefit as an auto-increment integer without exposing row counts.

**Tenancy.** Every tenant-owned table carries `organization_id uuid not null references organizations(id)`, indexed, and leading every composite index. Non-tenant tables are enumerated in §3 and §10 — that list is short and is a security-review item.

**Timestamps.** `created_at timestamptz not null default now()`, `updated_at timestamptz not null`. `created_by uuid references users(id)` wherever a human action creates the row.

**Money.** `numeric(18,6)`. Never `float`, `double precision`, or `money`. Every monetary column is paired with a `*_currency char(3)` or inherits the scenario's reporting currency (ADR-0006, ADR-0010).

**Percentages and scores.** `numeric(6,3)`. Scores are 0–100, not 0–1.

**Enums.** PostgreSQL enums for closed sets. Adding a value is a migration.

**JSONB.** Permitted only for: raw imported payloads, flexible source metadata, versioned AI structured output, and derived calculation breakdowns. **Never** for core domain attributes that are queried, filtered, or validated (§10 of the operating system). Each use below is individually justified.

**Deletes.** Soft delete (`archived_at`) for user-facing records. Hard delete only via the GDPR erasure path. `audit_logs` is append-only and is never deleted (ADR-0012).

**RLS.** Every tenant-owned table has RLS enabled with a policy on `current_setting('app.current_organization_id')` (ADR-0004).

---

## 2. Scope Reduction Applied

The operating system §10 lists roughly 60 entities. That is a schema for a mature product; it contradicts §2's "narrowest coherent system." The MVP model is **47 domain tables plus 3 Auth.js tables**. Twelve entities are deferred or collapsed with a stated reason.

| §10 entity | Disposition | Reason |
|---|---|---|
| `Workspace` | **Deferred** | A second tenancy level under Organization is undefined in the source document and would double every authorization check (`MVP_SCOPE.md` §4.2) |
| `Role` | **Collapsed to enum** | Four fixed roles; a table implies custom roles (ADR-0011) |
| `ProjectStatus` | **Collapsed to enum** | Closed set with validated transitions |
| `ProductCategory` | **Collapsed to a field** | A taxonomy table has no MVP consumer; category is a string plus optional HS code |
| `SupplierEvaluation` | **Collapsed into `suppliers`** | Evaluation is a handful of scored fields on the supplier, not a separate lifecycle |
| `CurrencyRateSnapshot` | **Deferred** | Rates entered manually and stored on the record with a rate date (ADR-0010) |
| `FinancialAssumption` | **Collapsed** | Assumptions are captured as `cost_line_items.basis` + `cost_scenarios.assumption_notes` + citations |
| `ConfidenceAssessment` | **Collapsed into `opportunity_assessments`** | One confidence result per assessment; the component breakdown is a JSONB column (justified in §7) |
| `PredictionComparison` | **Computed, not stored** | Derivable from the immutable `report_versions` snapshot plus `actual_outcomes`; storing it would create a third copy that can drift |
| `ActivityEvent` | **Removed** | Merged into `audit_logs`; product analytics go to PostHog (ADR-0012) |
| `FeatureFlag` | **Deferred** | Environment configuration is sufficient with one deployment and no tiers |
| `AIReviewStatus` | **Collapsed to enum** | A status column on each AI-drafted artifact |

Two entities are **added** because the source model does not cover requirements it states elsewhere:

| Added | Reason |
|---|---|
| `source_citations` | Makes §11's provenance contract enforceable without duplicating 13 columns or using JSONB (ADR-0009) |
| `support_grants` | Makes §9's platform-admin cross-org access explicit, expiring, and auditable rather than ambient (ADR-0020) |

---

## 3. Enums

```
Role                  PLATFORM_ADMIN | ORG_ADMIN | ANALYST | CLIENT_VIEWER
InvitationStatus      PENDING | ACCEPTED | EXPIRED | REVOKED
ProjectStatus         DRAFT | DATA_COLLECTION | ANALYSIS | ANALYST_REVIEW | APPROVED | ARCHIVED
SalesChannel          AMAZON_US | SHOPIFY_DTC
SourceType            INDUSTRY_REPORT | MARKETPLACE_DATA | SUPPLIER_DOCUMENT | GOVERNMENT_PUBLICATION
                      | COMPETITOR_LISTING | CUSTOMER_INTERVIEW | INTERNAL_ESTIMATE | OTHER
DataQuality           ACTUAL | ESTIMATED
ConfidenceBand        LOW | MEDIUM | HIGH
CostCategory          PRODUCT | PACKAGING | INSPECTION | INLAND_LOGISTICS | INTERNATIONAL_FREIGHT
                      | INSURANCE | IMPORT_DUTY | CUSTOMS_BROKERAGE | WAREHOUSING | MARKETPLACE_FEE
                      | PAYMENT_FEE | FULFILMENT_FEE | ADVERTISING_ALLOWANCE | RETURNS_ALLOWANCE
                      | TAX | FIXED_LAUNCH_COST
CostBasis             PER_UNIT | PER_ORDER | PER_SHIPMENT | PERCENT_OF_PRICE | FIXED_TOTAL
RiskSeverity          INFO | LOW | MEDIUM | HIGH | CRITICAL
RiskStatus            OPEN | MITIGATED | ACCEPTED | OVERRIDDEN | RESOLVED
Decision              GO | TEST | RESEARCH_MORE | REJECT
ReadinessStatus       READY | PARTIALLY_READY | NOT_READY | REQUIRES_SPECIALIST_REVIEW
ReviewStatus          DRAFT | IN_REVIEW | CHANGES_REQUESTED | APPROVED
AIProvider            ANTHROPIC | OPENAI
AIExecutionStatus     SUCCESS | SCHEMA_INVALID | PROVIDER_ERROR | BUDGET_EXCEEDED | TIMEOUT
LeadInterest          PAID_PILOT | EARLY_ACCESS | INFORMATION_ONLY
```

---

## 4. Phase 1 — Identity, Tenancy, Governance

This is the complete schema for the Phase 1 gate. Eight domain tables plus three Auth.js tables. Nothing else is built until the isolation suite passes.

### `users` — *not tenant-owned*
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `email` | citext unique not null | |
| `email_verified` | timestamptz | Auth.js |
| `name` | text | |
| `image_url` | text | |
| `is_platform_admin` | boolean not null default false | Grants no data access on its own — see `support_grants` |
| `anonymized_at` | timestamptz | GDPR erasure: PII cleared, row retained for audit integrity |
| `created_at` / `updated_at` | timestamptz | |

A user may belong to many organizations. `is_platform_admin` is deliberately **not** a data-access grant (ADR-0020).

### `accounts`, `sessions`, `verification_tokens`
Auth.js standard tables via the Prisma adapter. Database sessions, not JWT (ADR-0005). Not tenant-owned.

### `organizations` — *tenancy root*
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `name` | text not null | |
| `slug` | citext unique not null | Used in `/orgs/[orgSlug]/…`; the org context source (S-2) |
| `country` | char(2) | |
| `reporting_currency` | char(3) not null default `'USD'` | Default for new projects |
| `ai_daily_token_budget` | integer not null default 200000 | Enforced pre-dispatch (S-8) |
| `archived_at` | timestamptz | |
| `created_by` | uuid → users | |
| `created_at` / `updated_at` | timestamptz | |

### `memberships` — *the authorization root*
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `organization_id` | uuid not null → organizations | |
| `user_id` | uuid not null → users | |
| `role` | Role not null | |
| `created_at` / `updated_at` | timestamptz | |

`unique (organization_id, user_id)` · index on `(user_id)`.

**This table is read on every authenticated tenant request.** Role is never trusted from the session token, so role changes and removals take effect immediately (S-14). A membership row is required for the request to proceed at all; absence yields 404, not 403 (ADR-0004).

**Invariant:** an organization must always retain at least one `ORG_ADMIN`. Removing or demoting the last admin is rejected (S-6).

### `invitations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `organization_id` | uuid not null → organizations | |
| `email` | citext not null | Acceptance requires the authenticated email to match |
| `role` | Role not null | Cannot be `PLATFORM_ADMIN` |
| `token_hash` | text not null unique | SHA-256 of a 256-bit random token. **Plaintext is emailed, never stored** |
| `status` | InvitationStatus not null default `PENDING` | |
| `expires_at` | timestamptz not null | 7 days |
| `accepted_at` | timestamptz | Single use |
| `invited_by` | uuid not null → users | |
| `created_at` / `updated_at` | timestamptz | |

Covers S-5 and S-6: hashed at rest, single use, expiring, email-bound, and unable to grant platform admin.

### `support_grants` — *not tenant-owned* (ADR-0020)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `organization_id` | uuid not null → organizations | Target |
| `granted_to_user_id` | uuid not null → users | Must be a platform admin |
| `reason` | text not null | |
| `expires_at` | timestamptz not null | **Max 24 hours**, enforced in the service layer |
| `revoked_at` | timestamptz | |
| `created_by` | uuid not null → users | |
| `created_at` | timestamptz | |

The only route to cross-organization data. An active grant supplies an `organizationId` to the *normal* scoped path — it is not a bypass. Every request under a grant writes an audit entry carrying `support_grant_id`, visible in the target organization's own audit log.

### `audit_logs` — append-only (ADR-0012)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `organization_id` | uuid → organizations | Null for platform-level actions |
| `actor_user_id` | uuid → users | Null for system actions |
| `action` | text not null | e.g. `project.status_changed`, `risk.overridden` |
| `target_type` / `target_id` | text / uuid | |
| `summary` | text not null | Human-readable |
| `changes` | jsonb | **Justified JSONB:** before/after shape varies by entity; queried by key, never filtered on |
| `ip_address` | inet · `user_agent` text | |
| `correlation_id` | uuid not null | Ties to structured logs and Sentry |
| `support_grant_id` | uuid → support_grants | Present when acting under a grant |
| `created_at` | timestamptz | |

Index `(organization_id, created_at desc)`.

**Append-only enforced twice:** the DAL exposes no update or delete, and the application database role is granted only `INSERT` and `SELECT` (S-13). GDPR erasure pseudonymizes `users` rather than deleting audit rows.

---

## 5. Phase 2 — Product Projects

**`product_projects`** — `organization_id`, `name`, `slug` (unique per org), `status` (ProjectStatus), `reporting_currency`, `owner_user_id`, `client_visible` (boolean — gates CLIENT_VIEWER access), `archived_at`, audit columns. Status transitions validated against an allowed-transition map; every change writes an audit entry.

**`product_profiles`** — 1:1 with project. `category` (text), `hs_code` (text, nullable — **free text, explicitly not a compliance determination**), `description`, `key_attributes` (text), `unit_weight_kg`, `unit_length_cm` / `width_cm` / `height_cm`, `units_per_carton`, `carton_weight_kg`.

**`target_markets`** — `product_project_id`, `country_code` (char(2)), `notes`. Unique per `(product_project_id, country_code)`.

**`target_channels`** — `target_market_id`, `channel` (SalesChannel), `notes`. Unique per `(target_market_id, channel)`.

---

## 6. Phase 3 — Evidence and Provenance

### `data_sources` — the §11 provenance contract, stored once (ADR-0009)
| Column | Type |
|---|---|
| `id` · `organization_id` | uuid |
| `product_project_id` | uuid, nullable — null means org-level reusable source |
| `name` | text not null |
| `source_type` | SourceType not null |
| `url` | text |
| `reference` | text — citation for non-URL sources |
| `source_date` | date not null — when the source's data was produced |
| `ingested_at` | timestamptz not null |
| `country_code` | char(2) |
| `channel` | SalesChannel, nullable |
| `currency` | char(3), nullable |
| `data_quality` | DataQuality not null — actual vs estimated |
| `confidence_score` | numeric(6,3) — 0–100 |
| `analyst_note` | text |
| `attachment_id` | uuid → attachments, nullable |
| audit columns | |

All thirteen §11 attributes are present. `rule_version` and `model_version` attach at the point of use (`opportunity_factor_scores`, `ai_execution_logs`) rather than to the source, because they describe the derivation, not the evidence.

### `source_citations` — polymorphic link
`id`, `organization_id`, `data_source_id` → data_sources, `citable_type` (text), `citable_id` (uuid), `note`, `created_by`, `created_at`.

Index `(organization_id, citable_type, citable_id)`. Unique `(data_source_id, citable_type, citable_id)`.

`citable_type` values: `market_evidence`, `competitor_metric`, `supplier_quote`, `cost_line_item`, `opportunity_factor_score`, `risk_flag`, `report_section`.

Referential integrity on this edge is enforced in the application layer, not by a foreign key — the accepted trade-off in ADR-0009. This table is what makes "does this metric have a source?" a single query, powering the missing-source warnings Phase 3 requires.

**`market_evidence`** — `organization_id`, `product_project_id`, `target_market_id` (nullable), `metric_name`, `metric_value` numeric(18,6), `metric_unit`, `currency`, `period_start` / `period_end`, `data_quality`, `narrative`, audit columns.

**`competitors`** — `organization_id`, `product_project_id`, `name`, `brand`, `marketplace_url`, `channel`, `positioning_note`, audit columns.

**`competitor_metrics`** — `competitor_id`, `metric_name`, `metric_value` numeric(18,6), `metric_unit`, `currency`, `observed_at` date, `data_quality`.

**`suppliers`** — `organization_id`, `product_project_id`, `name`, `country_code`, `contact_name`, `contact_email`, `website`, plus collapsed evaluation fields: `capability_score`, `communication_score`, `compliance_score`, `financial_stability_score` (each numeric(6,3), nullable), `certifications` (text), `evaluation_note`. Audit columns.

**`supplier_quotes`** — `supplier_id`, `organization_id`, `quoted_at` date, `unit_price` numeric(18,6), `currency`, `fx_rate_to_reporting` numeric(18,8), `fx_rate_date` date *(ADR-0010)*, `moq` integer, `lead_time_days` integer, `incoterm` text, `tooling_cost`, `sample_cost`, `payment_terms`, `validity_until` date, `notes`. Audit columns.

**`attachments`** — `organization_id`, `product_project_id` (nullable), `storage_key` (text — **generated, never the user's filename**), `original_filename`, `mime_type`, `size_bytes`, `checksum_sha256`, `uploaded_by`, `av_scan_status` (text default `'PENDING'` — adapter placeholder per §23), `created_at`.

Storage keys are prefixed `org/{organization_id}/…` so an object key alone cannot cross tenants. Retrieval performs a membership check, then issues a short-TTL signed URL. Files are never served from the application origin (S-9, S-10).

---

## 7. Phases 4–5 — Economics, Scoring, Confidence, Risk, Readiness

**`cost_scenarios`** — `organization_id`, `product_project_id`, `name`, `target_market_id`, `channel`, `reporting_currency`, `selling_price` numeric(18,6), `assumed_units` integer, `moq` integer, `initial_inventory_units` integer, `assumption_notes` text, `calculation_version` text not null, `archived_at`, audit columns.

**`cost_line_items`** — `cost_scenario_id`, `organization_id`, `category` (CostCategory), `label`, `amount` numeric(18,6), `currency`, `fx_rate_to_reporting`, `fx_rate_date`, `basis` (CostBasis), `data_quality`, `note`, `sort_order`.

`basis` is what makes the engine honest: a marketplace fee is `PERCENT_OF_PRICE`, freight is `PER_SHIPMENT`, product cost is `PER_UNIT`. The engine converts each to per-unit using the scenario's volume assumptions and shows its work.

**`unit_economics_results`** — one row per calculation of a scenario. `cost_scenario_id`, `organization_id`, `landed_cost_per_unit`, `gross_profit_per_unit`, `gross_margin_pct`, `contribution_profit_per_unit`, `contribution_margin_pct`, `break_even_units`, `initial_inventory_investment`, `total_initial_capital`, `profit_at_assumed_units` (all numeric), `reporting_currency`, `calculation_version` not null, `breakdown` jsonb, `calculated_at`, `calculated_by`.

`breakdown` is **justified JSONB**: it holds the per-output formula string, input references, and units required by §12. It is derived, versioned output that is displayed and never filtered on — exactly the permitted use in §10.

**Reproducibility invariant:** given a scenario's line items and a `calculation_version`, recalculation reproduces the stored result exactly. This is a Phase 4 test, not an aspiration.

**`opportunity_factor_definitions`** — `organization_id` (nullable — null = platform default), `key`, `label`, `weight` numeric(6,3), `normalization_spec` jsonb *(justified: the input→0–100 mapping differs per factor and is configuration, not queried)*, `rule_version` not null, `is_active`, `sort_order`. Seeded with the ten weights in `ARCHITECTURE.md` §7.1 — Confidence is **not** among them (ADR-0007).

**`decision_thresholds`** — `organization_id` (nullable), `rule_version`, `rule_key` (e.g. `go_min_score`, `test_min_score`, `min_required_inputs_pct`), `numeric_value`, `is_active`. Every threshold in the ADR-0008 chain lives here, never as a literal.

**`opportunity_assessments`** — `organization_id`, `product_project_id`, `cost_scenario_id`, `total_score` numeric(6,3), `confidence_score` numeric(6,3), `confidence_band` (ConfidenceBand), `confidence_components` jsonb *(justified: derived, versioned explainability output)*, `decision` (Decision), `decision_rule_id` text not null — **which of the nine ordered rules fired** (ADR-0008), `required_inputs_pct` numeric(6,3), `rule_version` not null, `calculation_version` not null, `review_status` (ReviewStatus), `calculated_at`, audit columns.

Score and confidence are **separate columns**, computed by separate engines. This is what makes ADR-0007 structural rather than a UI convention.

**`opportunity_factor_scores`** — `opportunity_assessment_id`, `organization_id`, `factor_key`, `raw_inputs` jsonb *(justified: input shape varies per factor)*, `normalized_score` numeric(6,3), `weight` numeric(6,3), `weighted_contribution` numeric(6,3), `rationale` text, `confidence_score` numeric(6,3), `rule_version`, `analyst_override_score` numeric(6,3) nullable, `override_reason` text, `overridden_by`, `overridden_at`.

Carries every attribute §13 requires. Source references attach via `source_citations`.

**`risk_rules`** — `organization_id` (nullable), `key`, `category`, `label`, `severity` (RiskSeverity), `condition_spec` jsonb *(justified: declarative rule configuration)*, `rule_version`, `is_active`. Seeded across the 17 §15 categories.

**`risk_flags`** — `organization_id`, `product_project_id`, `opportunity_assessment_id` (nullable), `risk_rule_id`, `severity`, `status` (RiskStatus), `title`, `explanation`, `override_reason` text, `overridden_by` uuid, `overridden_at`, `resolved_by`, `resolved_at`, audit columns.

An unresolved `CRITICAL` flag forces `REJECT` at rule 1 of the decision chain. Override requires `ORG_ADMIN`+ and a reason, and is audit-logged (ADR-0019).

**`channel_readiness_templates`** — `organization_id` (nullable), `channel`, `name`, `version`, `is_active`.
**`channel_readiness_template_items`** — `template_id`, `category`, `label`, `guidance`, `is_required`, `sort_order`.
**`channel_readiness_assessments`** — `organization_id`, `product_project_id`, `target_channel_id`, `template_id`, `template_version`, `summary_status` (ReadinessStatus), `ready_pct` numeric(6,3), audit columns.
**`channel_readiness_item_results`** — `assessment_id`, `template_item_id`, `status` (ReadinessStatus), `note`, `evidence_attachment_id`, `updated_by`, `updated_at`.

Feeds the Channel Readiness scoring factor and the risk engine — which is why it ships in Phase 5 (ADR-0017). No status implies legal or regulatory approval; `REQUIRES_SPECIALIST_REVIEW` is the terminal state for anything compliance-adjacent.

---

## 8. Phases 6–7 — AI Governance, Blueprints, Review

**`prompt_templates`** — `key` unique, `name`, `task_type`, `is_active`. Platform-owned.
**`prompt_versions`** — `prompt_template_id`, `version` integer, `system_prompt` text, `user_prompt_template` text, `output_schema_name` text, `model_hint`, `is_active`. Immutable once used.

The system prompt is a constant here and never contains customer content (S-7).

**`ai_execution_logs`** — `organization_id`, `product_project_id` (nullable), `provider` (AIProvider), `model` text, `prompt_template_id`, `prompt_version` integer, `input_payload_hash` char(64) — **SHA-256, not the payload**, `structured_output` jsonb *(justified: versioned AI structured output, explicitly permitted by §10)*, `raw_output` text nullable, `input_tokens`, `output_tokens`, `estimated_cost_usd` numeric(18,6), `duration_ms`, `status` (AIExecutionStatus), `error_message`, `fallback_provider` (AIProvider, nullable), `review_status` (ReviewStatus), `requested_by`, `created_at`.

Storing the input as a hash rather than the payload satisfies §17's logging requirement without duplicating customer content into a second store (§25's "do not log full sensitive documents").

**`launch_blueprints`** / **`growth_blueprints`** — `organization_id`, `product_project_id`, `narrative` text, `review_status` (ReviewStatus), `ai_execution_log_id` (nullable — null means analyst-authored), `source_prompt_version`, `approved_by`, `approved_at`, audit columns.

**`launch_milestones`** — `launch_blueprint_id`, `title`, `description`, `target_week` integer, `owner_role` text, `sort_order`.
**`growth_actions`** — `growth_blueprint_id`, `title`, `description`, `channel`, `expected_impact`, `effort_level`, `sort_order`.

**`analyst_reviews`** — `organization_id`, `product_project_id`, `subject_type` text, `subject_id` uuid, `status` (ReviewStatus), `reviewer_user_id`, `submitted_at`, `decided_at`, `decision_note`.
**`review_comments`** — `analyst_review_id`, `organization_id`, `author_user_id`, `body`, `resolved_at`, `created_at`.

**Invariant:** any artifact with `review_status != APPROVED` is filtered out of `CLIENT_VIEWER` queries **in the DAL**, not in the UI (S-15).

---

## 9. Phases 8–9 — Reporting and the Learning Loop

**`reports`** — `organization_id`, `product_project_id`, `title`, `current_version_id`, audit columns.

**`report_versions`** — `report_id`, `organization_id`, `version_number` integer, `review_status` (ReviewStatus), `rendered_html` text, `pdf_storage_key` text nullable, `input_snapshot` jsonb *(justified: an immutable point-in-time capture of every input — the mechanism that makes a historic report reproducible)*, `calculation_version`, `rule_version`, `approved_by`, `approved_at`, `created_by`, `created_at`.

Unique `(report_id, version_number)`. **Immutable after creation.** This is what prevents an approved report silently changing when project data is edited later (S-19), and it is the estimate side of the estimate-vs-actual comparison.

**`report_sections`** — `report_version_id`, `organization_id`, `section_key`, `title`, `body_html`, `sort_order`. Twenty section keys per §18. Sections cite sources via `source_citations`.

**`actual_outcomes`** — `organization_id`, `product_project_id`, `period_start`, `period_end`, `units_sold` integer, `revenue` numeric(18,6), `currency`, `returns_units`, `advertising_spend`, `notes`, `recorded_by`, audit columns.

**`actual_cost_lines`** — `actual_outcome_id`, `organization_id`, `category` (CostCategory), `label`, `amount` numeric(18,6), `currency`, `note`.

Actuals are structurally separate from estimates — a different table, never merged into `cost_line_items`. The estimate-vs-actual comparison is **computed** from a `report_versions.input_snapshot` plus `actual_outcomes`, not stored, so it can never drift from either side (§2, `PredictionComparison`).

---

## 10. Track B — Public Validation (platform-owned, no `organization_id`)

These three tables are deliberately outside the tenancy model (ADR-0016). A prospect is not a tenant. They are excluded from the tenant DAL and readable only by `PLATFORM_ADMIN`. **This exclusion list is a standing security-review item** — any future table without `organization_id` must be justified here.

**`leads`** — `id`, `full_name`, `business_email` citext, `company`, `country_code`, `business_type`, `interest` (LeadInterest), `source` text, `utm` jsonb *(justified: arbitrary campaign metadata)*, `created_at`, `anonymized_at`.

**`survey_responses`** — `lead_id`, plus the §19 fields: `product_or_category`, `target_market`, `target_channel`, `current_workflow`, `main_challenge`, `estimated_budget_band`, `decision_timeline`, `interested_in_paid_pilot` boolean, `created_at`.

**`consent_records`** — `lead_id`, `policy_version` text not null, `consent_text_hash` char(64), `granted_at`, `ip_address` inet, `user_agent`, `withdrawn_at`.

Storing the policy version and a hash of the exact consent text shown means the business can later prove *what* a person consented to, not merely that they did — which is the part of GDPR consent that record-keeping usually misses (S-12).

---

## 11. Entity Count

| Group | Tables |
|---|---:|
| Identity, tenancy, governance (Phase 1) | 8 + 3 Auth.js |
| Product projects (Phase 2) | 4 |
| Evidence and provenance (Phase 3) | 8 |
| Economics (Phase 4) | 3 |
| Scoring, confidence, risk, readiness (Phase 5) | 10 |
| AI, blueprints, review (Phases 6–7) | 9 |
| Reporting and learning loop (Phases 8–9) | 6 |
| Public validation (Track B) | 3 |
| **Total** | **51 (48 domain + 3 Auth.js)** |

Twelve §10 entities deferred or collapsed; two added. The reductions are recorded in §2 with reasons and are reversible — each deferred entity has a named revisit trigger in `MVP_SCOPE.md` §4.2.

---

## 12. Indexing and Integrity Baseline

- Every tenant table: `organization_id` leads every composite index.
- Hot paths: `memberships (user_id)`, `memberships (organization_id, user_id)` unique, `product_projects (organization_id, status)`, `source_citations (organization_id, citable_type, citable_id)`, `audit_logs (organization_id, created_at desc)`, `ai_execution_logs (organization_id, created_at desc)`.
- Foreign keys everywhere except the deliberate polymorphic edges (`source_citations`, `analyst_reviews.subject_id`, `audit_logs.target_id`).
- Check constraints: scores within 0–100; `weight >= 0`; `expires_at > created_at` on invitations and support grants.
- Partial unique indexes for soft deletes, e.g. `unique (organization_id, slug) where archived_at is null`.
- **Cross-tenant foreign keys are structurally possible and must be prevented.** A child row must not reference a parent in another organization. Enforced by composite foreign keys carrying `organization_id` — e.g. `cost_line_items (cost_scenario_id, organization_id)` references `cost_scenarios (id, organization_id)`. This closes a gap that neither RLS nor the DAL catches on its own, and it is a Phase 1 review item for every parent-child pair added thereafter.

---

## 13. Migration Discipline

Prisma Migrate, forward-only, one migration per Cursor task. Every migration is reviewed for: `organization_id` presence and index, RLS enabled and policy created, composite FKs where a parent-child pair spans tenancy, and no destructive change without an explicit data-migration step. Seed data — factor definitions, decision thresholds, risk rules, readiness templates — is versioned and idempotent so it can be re-run against any environment.
