# TASK-001 — Claude Review

**Reviewer:** Claude Code (architecture authority / red-team reviewer)
**Date:** 2026-07-28
**Task under review:** `docs/tasks/T-001-repository-and-tooling-baseline.md`
**Commit under review:** `a5655a7` — _feat: establish pnpm monorepo and Next.js tooling baseline_ (57 files, +5788 / −1)
**Decision:** **APPROVED WITH FOLLOW-UP**

---

## Review Scope

T-001 only: repository adoption, pnpm workspace, Next.js application shell, strict TypeScript, lint/format, security headers, CI, and the `packages/core` purity boundary that ADR-0001 depends on.

Explicitly **not** in scope: database, authentication, tenancy, or any product surface. None of those were required by T-001 and none were found.

### Requested inputs that do not exist

Three files were named in the review request. None are present in the repository:

| Requested path                            | Status                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `docs/tasks/TASK-001.md`                  | **Absent.** The task spec is `docs/tasks/T-001-repository-and-tooling-baseline.md` |
| `docs/reviews/TASK-001-IMPLEMENTATION.md` | **Absent.** `docs/reviews/` did not exist before this review                       |
| `docs/status/CURRENT_STATUS.md`           | **Absent.** `docs/status/` did not exist before this review                        |

**There is no implementation report.** The instruction "do not trust the implementation report without inspection" was therefore satisfied trivially — there was nothing to trust. This review rests entirely on the commit, the source, and commands executed during the review. Every claim below is either a command output reproduced here or a file quoted directly.

The absence of the implementation report is a **process gap, not a defect in the work**, and is recorded as F-7.

---

## What Was Inspected

**Executed locally** (Windows Server 2022, Node v22.13.1, pnpm 9.15.4):

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- `pnpm why next -r` and the pnpm store, to check for duplicate framework versions
- An **adversarial purity probe** written into `packages/core/src/` in eight bypass forms, linted, then deleted

**Read in full:** `packages/config/eslint/core.js` · `apps/web/next.config.ts` · `apps/web/app/api/health/route.ts` · `tsconfig.base.json` · `.github/workflows/ci.yml` · `.github/dependabot.yml` · `KNOWN_LIMITATIONS.md` · `packages/core/src/index.ts` · `apps/web/playwright.config.ts` · root `package.json`

**Verified remotely:** GitHub Actions run history for `donnima/aipro-mpv`.

---

## Findings

### Verified correct

| T-001 requirement                                                   | Evidence                                                                                                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repository adopted, `main` branch, `.gitignore` before first commit | `git log` shows 3 commits on `main`; `.claude/settings.local.json` ignored, never committed                                                                                                |
| pnpm workspace, pnpm pinned                                         | `packageManager: pnpm@9.15.4`; `engines.node: >=22 <23`, `engines.pnpm: >=9 <10`                                                                                                           |
| Next.js 15 App Router + Tailwind + shadcn scaffolding               | Build emits 4 routes; `components.json`, `tailwind.config.ts` present                                                                                                                      |
| `GET /api/health` returns `{status, version, commit}`               | Route read in full — returns those three fields and nothing else. **No connection strings, stack traces, or diagnostics.** Satisfies S-20                                                  |
| All seven root scripts                                              | `dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test` all present and functional                                                                                           |
| Strict TypeScript                                                   | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes` **all four present**, plus `noFallthroughCasesInSwitch`                                           |
| Security headers (S-17)                                             | CSP (report-only, documented), HSTS (production-only — correct), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, plus `Permissions-Policy`. `poweredByHeader: false` |
| `.gitattributes` LF normalization                                   | Present; `format:check` clean across the tree                                                                                                                                              |
| `.env.example` with empty values                                    | All 19 variables empty and commented. Re-verified during this review                                                                                                                       |
| No secrets committed                                                | Pattern scan for `sk-`, `ghp_`, `AKIA`, `postgres://user:pass@`, PEM blocks returned only false positives (prose in `DECISIONS.md`, a gitignored settings file)                            |
| Vitest configured, tests run                                        | 2 tests, 2 passed — one in `packages/core`, one integration test on `/api/health`. Matches the specified minimum                                                                           |
| Playwright configured, browsers not installed locally               | `playwright.config.ts` gates `webServer` behind `process.env.CI`; limitation documented                                                                                                    |
| CI with all required steps                                          | `ci.yml` runs install → format:check → lint → typecheck → test → build, plus separate `gitleaks` and `e2e` jobs                                                                            |
| Single Next.js version                                              | `pnpm why next -r` → `next 15.5.22` only; one entry in the pnpm store                                                                                                                      |
| Documentation                                                       | `README.md`, `LICENSE`, `CHANGELOG.md`, `KNOWN_LIMITATIONS.md`, `docs/DEVELOPMENT.md`, `infra/deployment/README.md` all present                                                            |

**`KNOWN_LIMITATIONS.md` deserves specific credit.** It self-reports the unpushed commit, unproven CI, report-only CSP, and missing Playwright binaries. That is honest reporting under §29's "show all failures honestly," and it is the reason this review could focus on finding what the notes did _not_ say.

### F-1 — Purity boundary does not cover dynamic `import()` · Medium · non-blocking

`packages/core` purity is ADR-0001's **binding mitigation** — the thing that caps the cost of choosing full-stack Next.js over FastAPI. I probed it adversarially rather than trusting it.

Static forms are correctly blocked (9 errors raised):

```
5:1   error  'next/server' import is restricted from being used by a pattern
8:1   error  'fs' import is restricted from being used
11:1  error  'node:path' import is restricted from being used
14:1  error  'react' import is restricted from being used
17:1  error  '@prisma/client' import is restricted from being used
20:16 error  A `require()` style import is forbidden
28:1  error  'react-dom' import is restricted from being used
```

But this raised **no error at all**:

```ts
export async function dyn(): Promise<unknown> {
  return await import("next/server"); // NOT FLAGGED
}
```

`no-restricted-imports` does not inspect `ImportExpression` nodes. Any banned module can enter `packages/core` through dynamic import.

**Fix:** add a `no-restricted-syntax` rule targeting `ImportExpression[source.value=/^(next|react|react-dom|@prisma|node:)/]`, or move the ban to a rule that covers dynamic imports.

### F-2 — Bare-specifier Node builtins outside the explicit list are not caught · Medium · non-blocking

Second probe, four unlisted builtins plus a dynamic builtin import:

```ts
import dns from "dns";
import zlib from "zlib";
import { Buffer } from "buffer";
import util from "util";
export async function dynCrypto() {
  return await import("crypto");
}
```

Result: **`EXIT=0` — zero errors.**

The `node:*` pattern group catches every prefixed form, but bare specifiers are only caught if explicitly enumerated, and the list covers 11 builtins out of ~40. `dns`, `tls`, `zlib`, `dgram`, `vm`, `v8`, `cluster`, `readline`, `perf_hooks`, `buffer`, `util`, `url`, `timers` all pass.

**Fix:** ban the full builtin set (`module.builtinModules`), or invert to an allow-list of permitted imports — the more durable option for a package whose whole purpose is having no dependencies.

**Note on both:** these are limitations of a lint-based boundary generally. Network access via the `fetch` global and `process.env` reads are invisible to any import rule. Worth stating in `TESTING.md` so the boundary is not over-trusted.

### F-3 — Dependabot is unconstrained on major versions · Low · non-blocking

`.github/dependabot.yml` sets no `ignore` and no `groups`. It has already opened **12 pull requests**, most of them major bumps:

`typescript 5.9.3 → 6.0.3` · `@types/node 22.20.1 → 26.1.2` · `@eslint/js 9.39.5 → 10.0.1` · `globals 15 → 17` · `eslint-plugin-react-hooks 5 → 7` · `@next/eslint-plugin-next 15 → 16` · `tailwind-merge 2 → 3` · `actions/checkout 4 → 7` · `actions/setup-node 4 → 7` · `actions/cache 4 → 6` · `gitleaks-action 2 → 3`

Two problems. `@types/node 26` against `engines.node: >=22 <23` is an unsound pairing — the types would describe APIs the pinned runtime does not have. And `@next/eslint-plugin-next 16` against Next 15 is a cross-major mismatch. More practically, twelve PRs on day one buries the signal that dependency scanning exists to produce.

**Fix:** `ignore` major updates for toolchain packages, or `groups` them into one PR, and pin `@types/node` to the Node 22 major.

### F-4 — CI workflow declares no `permissions` block · Low · non-blocking

No workflow- or job-level `permissions:`, so `GITHUB_TOKEN` inherits repository defaults — broader than these jobs need on a **public** repository. Add `permissions: contents: read` at workflow level and grant more only where a job requires it.

### F-5 — CI conclusion could not be independently confirmed · Informational

Run **CI #1** exists for commit `a5655a7` on `main`, duration 3m 24s. The Actions listing summarized all runs as successful, but the per-run conclusion badge did not render on fetch, so **I did not independently confirm a green conclusion** and do not claim one.

This is not treated as blocking because I executed the identical command chain locally and every step passed — direct evidence stronger than a badge. Confirm the badge before relying on CI as a gate in T-002.

### F-6 — `packages/db` absent · Not a defect

`ARCHITECTURE.md` §3 lists `packages/db`, which does not exist. T-001 did not require it; TASK-002 creates it. Recorded so the structure difference is not later mistaken for drift.

### F-7 — Process deviations · Non-blocking, founder's call

Three departures from the operating system's execution loop, none of which affect code quality:

1. **No implementation report was produced.** §29 requires the `## Task Completed … ## Review Notes` format. Without it, this review had to reconstruct intent from the diff. Enforce for TASK-002.
2. **T-001 was implemented before Phase 0 approval.** §0 states Cursor must not implement until Claude produces an approved task. The eight open questions in `ARCHITECTURE.md` §15 remain unanswered, so all 20 ADRs are still `Proposed` — the work is built on unratified decisions. Nothing implemented so far conflicts with them, so no rework is implied, but **items 3, 4 and 6 should be answered before TASK-002 touches the schema.**
3. **My own T-001 spec under-specified the purity demonstration.** It asked for "a deliberate `import 'next'`" — a form the rule _does_ catch. Had the implementer followed it exactly, they would have seen it pass and reported truthfully. F-1 and F-2 are therefore my specification's fault, not the implementer's. TASK-002 specifies adversarial probes explicitly.

---

## Blocking Issues

**None.**

No finding renders the baseline unsafe, incorrect, or unusable. All five quality gates pass under direct execution; no secret is exposed; no authorization surface exists yet to weaken.

---

## Non-Blocking Improvements

| #     | Item                                      | Severity | Owner task  |
| ----- | ----------------------------------------- | -------- | ----------- |
| F-1   | Purity rule misses dynamic `import()`     | Medium   | TASK-002    |
| F-2   | Purity rule misses unlisted bare builtins | Medium   | TASK-002    |
| F-3   | Dependabot unconstrained on majors        | Low      | TASK-002    |
| F-4   | CI missing `permissions:` block           | Low      | TASK-002    |
| F-5   | Confirm CI #1 green badge                 | Info     | TASK-002    |
| F-7.1 | Produce §29 implementation reports        | Process  | TASK-002    |
| F-7.2 | Answer the eight Phase 0 questions        | Process  | **Founder** |

---

## Required Corrections

None before TASK-002 may begin.

F-1 and F-2 are folded into TASK-002 as a required first step. Closing them there is cheap — `packages/core` currently holds fourteen lines of constants, so there is nothing yet that could have violated the boundary. Once Phase 4 puts the economics engine there, the gap becomes expensive.

---

## Verification Commands

All executed by the reviewer on 2026-07-28. Outputs abridged only where noted.

```bash
pnpm format:check   # EXIT=0  — "All matched files use Prettier code style!"
pnpm lint           # EXIT=0  — 4 workspace projects, all Done
pnpm typecheck      # EXIT=0  — 4 workspace projects, all Done
pnpm test           # EXIT=0  — Test Files 2 passed (2), Tests 2 passed (2)
pnpm build          # EXIT=0  — Next.js 15.5.22, compiled in 3.7s, 4 routes
pnpm why next -r    # next 15.5.22 (single version)
```

Adversarial purity probe (written to `packages/core/src/__purity_probe.ts`, linted, then deleted — working tree confirmed clean afterwards):

```bash
pnpm exec eslint src/__purity_probe.ts
# Round 1 (static forms):  EXIT=1 — 9 errors raised, dynamic import() NOT flagged
# Round 2 (bare builtins): EXIT=0 — dns, zlib, buffer, util, dynamic import("crypto") all passed
```

---

## Acceptance Decision

## APPROVED WITH FOLLOW-UP

**Why approved:** every Definition-of-Done item was verified by direct execution or by reading the source — not by trusting a report, of which there was none. The five quality gates pass. All four mandated strict-TypeScript flags are present. Security headers exceed the requirement. No secret is committed. The workspace boundary that ADR-0001 rests on exists, is wired correctly, and blocks every static import path. This is a clean, honest, well-documented baseline.

**Why follow-up rather than plain approval:** the purity boundary — the single piece of T-001 that carries architectural weight beyond Phase 0 — is bypassable in two demonstrated ways. Neither can cause harm today, because `packages/core` contains no logic to protect. Both must close before it does.

**Gate status:** Phase 0 tooling baseline is **accepted**. TASK-002 (database foundation and tenancy schema) is authorized to begin, subject to the founder answering open questions 3, 4 and 6 before schema work starts.
