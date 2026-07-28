# Testing

## Quality gates

From the repository root:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same chain, plus `gitleaks` and Playwright E2E (Chromium installed in CI only).

## `packages/core` purity boundary

ADR-0001 requires `packages/core` to stay free of Next.js, React, Prisma, Node I/O, and workspace I/O packages so decision logic stays extractable.

Enforcement lives in `@aipro/config/eslint/core`:

- `no-restricted-imports` — static `import` / `export … from`
- `no-restricted-syntax` — dynamic `import()` and `require()` with **anchored** module-id regexes
- Node builtins enumerated from `module.builtinModules` (bare and `node:` forms)
- Workspace I/O ban: `@aipro/db`, `@aipro/web`, `@aipro/ui`, `@aipro/config` (and subpaths)
- Workspace allow-list: `@aipro/types` plus relative imports only

Self-test: `packages/core/src/purity.test.ts` lints fixture snippets through the ESLint Node API. It covers banned forms and allowed cases including relative dynamic imports whose paths contain builtin substrings (e.g. `./costs`, `./path-utils`).

When adding a new workspace package, ban it in `packages/config/eslint/core.js` unless it is a pure contracts package like `@aipro/types`.

### Limits of a lint-based boundary

The import rules **cannot** see:

- the `fetch` global
- `process.env` reads
- dynamic module ids built at runtime (`import(variable)`)
- side effects reached through allowed packages

Treat the boundary as necessary but not sufficient. Future phases that put real economics/scoring code in `packages/core` must keep those limits in mind during review.

## Database tests

Not yet. TASK-002 Part B adds Postgres integration tests (RLS, seed idempotency, pooled-session isolation) once `DATABASE_URL` is available.
