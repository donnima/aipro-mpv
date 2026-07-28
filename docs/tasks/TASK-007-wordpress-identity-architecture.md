# TASK-007 — Adopt WordPress Identity and Presentation Architecture

## Task ID

`TASK-007` · Architecture / documentation · Founder-authorized 2026-07-28

## Objective

Record and implement (documentation only) the founder-approved **WordPress-Owned Identity and User Experience** decision before TASK-002 Part B.

## Scope

### In scope

- ADR-0021 (Accepted) and supersession of ADR-0005
- Updates to `ARCHITECTURE.md`, `DATA_MODEL.md`, `DECISIONS.md`, `MVP_SCOPE.md`, `AGENTS.md`, `CLAUDE.md`, status, tasks, deployment/security docs
- New architecture, security, integration, and task documents listed in the founder brief
- Consistency search for Auth.js / Clerk / standalone login assumptions — update or explicitly supersede

### Out of scope

- Prisma schema, migrations, RLS SQL, production application features
- Building the WordPress plugin binary
- Neon credentials or WordPress admin configuration

## Acceptance

- [x] ADR-0021 Accepted; ADR-0005 marked Superseded
- [x] Phase 1 schema plan updated (no credential/session tables)
- [x] Required deliverable docs created
- [x] Conflicting auth assumptions superseded in authority docs
- [x] Lock released; Next Action points to WordPress details + Neon + revised Part B
