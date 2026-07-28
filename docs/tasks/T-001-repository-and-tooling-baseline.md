# T-001 — Repository and Tooling Baseline

## Task ID
`T-001` · Phase 0 · **Blocked until founder clears B-1, B-3, B-5** (see `ARCHITECTURE.md` §1.4)

## Objective
Turn an empty directory into a working, committed, CI-verified pnpm monorepo running a Next.js 15 application with strict TypeScript, linting, formatting, and a green pipeline. No product features. No database yet.

## Business Reason
Every later phase depends on a repository where lint, typecheck, test, and build actually run and actually fail when something is wrong. Establishing the quality gates before any product code exists is the cheapest point to do it — after Phase 1 they have to be retrofitted around working code. This task also creates the `.gitignore` and secret scanning that must exist **before** the first real credential enters the project (risk S-4).

## Files or Areas Expected
```
.gitignore  .gitattributes  .editorconfig  .nvmrc  README.md  LICENSE
package.json  pnpm-workspace.yaml  tsconfig.base.json
apps/web/                      Next.js 15 App Router app
packages/config/               shared eslint / tsconfig / prettier / tailwind presets
packages/core/                 empty package + purity lint boundary
packages/types/                empty package
packages/ui/                   empty package
.github/workflows/ci.yml
docs/  infra/deployment/
```

## Functional Requirements
1. **Adopt the existing repository — do not re-initialize.** A `.git` directory already exists with **zero commits**, on branch **`master`**, with the working tree auto-staged and no `.gitignore` (blocker B-7). In order:
   a. Write `.gitignore` **before anything is committed**.
   b. `git reset` to unstage, then verify `git status` shows no local-only file (`.claude/settings.local.json` must be ignored, not committed).
   c. `git branch -m master main` — §27 requires `main`.
   d. Set `user.name` and `user.email` (blocker B-3).
   e. Make the initial commit, then add the founder-supplied remote.
2. `corepack enable pnpm` and pin `pnpm@9` via `packageManager` in the root `package.json`.
3. pnpm workspace covering `apps/*` and `packages/*`.
4. `apps/web`: Next.js 15, App Router, TypeScript, Tailwind, shadcn/ui initialized. It must render a placeholder home page and expose `GET /api/health` returning `{ status: "ok", version, commit }`.
5. Root scripts, each working from the repository root: `dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test`.
6. ESLint (flat config) + Prettier + Tailwind class sorting, shared from `packages/config`.
7. `.gitattributes` containing `* text=auto eol=lf` (blocker B-4).
8. `.nvmrc` = `22`; `engines.node` = `>=22 <23`.
9. `.env.example` listing every variable the project will need, with **empty values and a comment each**. `.env`, `.env.local`, `.env.*.local` git-ignored.
10. `README.md`: prerequisites, setup, the script table, and a pointer to `MVP_SCOPE.md` / `ARCHITECTURE.md` / `DECISIONS.md` / `DATA_MODEL.md`.
11. CI on push and pull request: install → `format:check` → `lint` → `typecheck` → `test` → `build` → `gitleaks`. Every step must be able to fail the build.
12. `packages/core` created with an ESLint boundary rule forbidding imports of `next`, `react`, `@prisma/client`, and any node built-in — ADR-0001's mitigation, enforced from the first commit.

## Technical Constraints
- TypeScript `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`.
- Node 22. pnpm only — do not create `package-lock.json` or `yarn.lock`.
- No database, no auth, no Prisma in this task.
- No UI beyond a placeholder page. Do not start on the design system.
- Dependencies limited to what the requirements above name. Adding anything else requires justification in the summary.

## Security Requirements
- `.gitignore` covers `.env*` (except `.env.example`), `node_modules`, `.next`, build output, `*.pem`, and `.claude/settings.local.json`.
- **`.gitignore` is written and verified before the first commit.** Verify with `git status --short` that no local-only or environment file is staged. A secret committed in the initial commit is in history permanently (S-4).
- `gitleaks` runs in CI and fails the build on a finding.
- Dependabot or Renovate configured for weekly dependency updates.
- **No real credential, key, connection string, or account identifier may appear in any committed file.** If a value is needed, add it to `.env.example` with an empty value and list it in the summary as required from the founder.
- Security headers configured in `next.config.ts`: CSP (report-only initially), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.

## Tests Required
- Vitest configured at the root and runnable via `pnpm test`.
- One test in `packages/core` proving the test runner works and covers workspace packages.
- One integration test asserting `GET /api/health` returns 200 and the expected shape.
- Playwright installed and configured, **but browser download is not part of this task** (blocker B-1). The E2E script must exist and be documented as CI-only until disk is resolved.

## Documentation Required
- `README.md` as specified.
- `docs/DEVELOPMENT.md`: local setup on Windows, the pnpm/corepack step, and the known environment blockers.
- `CHANGELOG.md` with a Phase 0 entry.
- `KNOWN_LIMITATIONS.md` recording: Playwright browsers not installed locally; no database yet; CSP in report-only mode.

## Definition of Done
- [ ] `pnpm install` completes on this machine
- [ ] `pnpm dev` serves the home page and `/api/health` returns 200
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test`, `pnpm build` all pass
- [ ] CI is green on the first pull request
- [ ] `gitleaks` step present and demonstrably able to fail
- [ ] The `packages/core` purity rule fails when a deliberate `import 'next'` is added — **demonstrate this, then revert it**
- [ ] No secret in git history
- [ ] Documentation files above exist

## Commands to Run
```bash
pnpm install && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Expected Evidence
1. Full terminal output of the command above, unedited, including timings.
2. `git log --oneline` and `git status`.
3. Output of `pnpm why next` confirming a single Next.js version.
4. The CI run URL with all steps green.
5. Terminal output showing the `packages/core` purity rule **failing** on a deliberate violation, and the revert.
6. `curl http://localhost:3000/api/health` response body.
7. Disk usage after install (`node_modules` size) — this validates or refutes blocker B-1 and determines whether Playwright can ever run locally.

**Report honestly.** If `pnpm install` fails on disk space, stop and report it — do not delete files to make room.
