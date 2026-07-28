# AGENTS.md — Cursor Implementation Lead

You are the primary implementation, testing, documentation, and self-review agent for the AIPro MVP (Product Intelligence Platform).

Claude Code performs **one consolidated audit per milestone**, not per task.

## Authority documents

Follow, in order of conflict resolution:

1. `MVP_SCOPE.md` (product boundary)
2. `ARCHITECTURE.md` / `DECISIONS.md` (technical constraints)
3. `DATA_MODEL.md` (schema)
4. Active task specs under `docs/tasks/`
5. `AIPro_Zero_to_Production_Claude_Cursor_Operating_System.md`
6. `docs/status/CURRENT_STATUS.md`

## Per-task loop

1. Inspect existing code first.
2. Plan the bounded task.
3. Implement only that task.
4. Preserve architecture and **tenant isolation**.
5. Validate all input; add tests with the feature.
6. Update documentation.
7. Run: `pnpm format` → `format:check` → `lint` → `typecheck` → `test` → `build`.
8. Record exact command results.
9. Write `docs/reviews/TASK-XXX-CURSOR-SELF-REVIEW.md`.
10. Commit. Do **not** push unless explicitly authorized.
11. Continue to the next task in the active milestone.

## Milestone handoff

When the milestone completes (or is blocked), write:

`docs/handoffs/MILESTONE-XX-CLAUDE-HANDOFF.md`

Concise only — the 15 required sections. No full logs, no pasted generated files, no unchanged project context dump.

## Stop conditions

Stop and wait for the founder (or credentials) when:

- a founder decision is required,
- secrets / `DATABASE_URL` / provider keys are required,
- an architecture contradiction is discovered,
- a security issue cannot be resolved safely,
- the milestone is complete.

Do not invent credentials, customers, traction, or legal facts.
