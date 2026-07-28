# Testing

## Quality gates

From the repository root:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same chain, plus `gitleaks` and Playwright E2E (Chromium installed in CI only).

## `packages/core` purity boundary

ADR-0001 requires `packages/core` to stay free of Next.js, React, Prisma, and Node I/O so decision logic stays extractable.

Enforcement lives in `@aipro/config/eslint/core`:

- `no-restricted-imports` — static `import` / `export … from`
- `no-restricted-syntax` — dynamic `import()` and `require()`
- Node builtins are enumerated from `module.builtinModules` at config load time (bare and `node:` forms), not a hand-written subset

Self-test: `packages/core/src/purity.test.ts` lints fixture snippets through the ESLint Node API and asserts each banned form errors. A permitted relative import must still pass.

### Limits of a lint-based boundary

The import rules **cannot** see:

- the `fetch` global
- `process.env` reads
- dynamic module ids built at runtime (`import(variable)`)
- side effects reached through allowed packages

Treat the boundary as necessary but not sufficient. Future phases that put real economics/scoring code in `packages/core` must keep those limits in mind during review.

## Database tests

Not yet. TASK-002 Part B adds Postgres integration tests (RLS, seed idempotency, pooled-session isolation) once `DATABASE_URL` is available.
