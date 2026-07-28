# AGENT-LOCK-PROTOCOL — Cursor Self-Review

**Implementer:** Cursor  
**Date:** 2026-07-28  
**Scope:** Process-control correction only — Agent Lock Protocol  
**Base commit:** `0e23ead`

---

## Task Completed

Established a repository Agent Lock Protocol so agents cannot treat uncommitted
drafts (especially Claude review drafts) as instructions, and so only one agent
holds write ownership at a time.

**Explicitly not done:** TASK-002 Part B. No Prisma, schema, RLS, auth, or
application feature changes.

---

## Files Changed

| Path                                                     | Change                                          |
| -------------------------------------------------------- | ----------------------------------------------- |
| `AGENTS.md`                                              | Lock protocol + preflight/stop rules for Cursor |
| `CLAUDE.md`                                              | Lock protocol + draft delivery rules for Claude |
| `docs/process/AGENT-WORKFLOW.md`                         | **NEW** — full protocol                         |
| `docs/drafts/README.md`                                  | **NEW** — non-authoritative drafts notice       |
| `docs/status/CURRENT_STATUS.md`                          | Required lock block; lock released (`none`)     |
| `scripts/validate-agent-lock.mjs`                        | **NEW** — validator CLI                         |
| `scripts/validate-agent-lock.test.ts`                    | **NEW** — 11 unit tests                         |
| `package.json`                                           | `validate:agent-lock` script                    |
| `vitest.config.ts`                                       | Include `scripts/**/*.test.ts`                  |
| `docs/reviews/AGENT-LOCK-PROTOCOL-CURSOR-SELF-REVIEW.md` | **NEW** — this file                             |

---

## Lock state after this commit

| Field                   | Value                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Active Agent            | `none`                                                                                                 |
| Write Lock Owner        | `none`                                                                                                 |
| Active Task             | `none`                                                                                                 |
| Cursor Action Permitted | `no`                                                                                                   |
| Next Action             | Founder supplies Neon env in `.env.local`, then grants Cursor the lock for Part B via committed status |

---

## Security / process

- No secrets touched; no `.env` files created or committed.
- No database or product code modified.
- Validator rejects draft paths as active instructions and Cursor-active + Claude-lock combinations.

---

## Commands Executed

```bash
pnpm validate:agent-lock
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

## Results

| Command                    | Result                                                   |
| -------------------------- | -------------------------------------------------------- |
| `pnpm validate:agent-lock` | **0** — OK                                               |
| `pnpm format:check`        | **0**                                                    |
| `pnpm lint`                | **0**                                                    |
| `pnpm typecheck`           | **0**                                                    |
| `pnpm test`                | **0** — 4 files, **25** tests passed (11 new lock tests) |
| `pnpm build`               | **0** — Next.js 15.5.22                                  |

---

## Known Limitations

- Validator parses markdown tables heuristically; unusual formatting could evade checks.
- Protocol is social + script-enforced, not a git hook (hooks can be added later if desired).
- TASK-002 Part B remains blocked on credentials and founder architecture answers.

---

## Review Notes

Ready to commit as `chore: enforce agent write-lock protocol`. Do not push.
