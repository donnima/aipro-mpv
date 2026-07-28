# Agent Workflow — Write-Lock Protocol

This document is the process contract for multi-agent work on this repository.
It supersedes informal concurrent editing. See also `AGENTS.md` and `CLAUDE.md`.

## Why this exists

Cursor previously acted on an uncommitted Claude review draft and committed a
Claude-owned review file before the review was formally delivered. That bypassed
propose → deliver → authorize → implement. This protocol makes ownership and
authority explicit.

## Authority rule

**Only committed task, review, handoff, and status files are authoritative.**

| Authoritative (committed)                         | Non-authoritative                                      |
| ------------------------------------------------- | ------------------------------------------------------ |
| `docs/tasks/*.md` (committed)                     | `docs/drafts/**`                                       |
| `docs/reviews/*-CLAUDE-REVIEW.md` (committed)     | `*.draft.md` anywhere                                  |
| `docs/handoffs/*.md` (committed)                  | Uncommitted working-tree copies of review/handoff docs |
| `docs/status/CURRENT_STATUS.md` (committed)       | Chat messages, scratchpads, agent transcripts          |
| `AGENTS.md` / `CLAUDE.md` / this file (committed) | Uncommitted edits to any of the above                  |

Uncommitted files created by another agent **must never** be used as instructions.

## Single write owner

Only one agent may hold **write ownership** at a time.

| Role            | Typical write paths                                                                |
| --------------- | ---------------------------------------------------------------------------------- |
| **Cursor**      | Implementation, tests, Cursor self-reviews, task docs Cursor is assigned to update |
| **Claude**      | Milestone reviews, architecture red-team notes Claude is assigned to author        |
| **Founder**     | Credentials, architecture answers, lock overrides                                  |
| **none / idle** | No agent may write product or process files until a lock is granted                |

### Cursor must not

- Read, modify, stage, or commit **uncommitted** Claude review drafts
- Commit Claude-owned review files before formal completion
- Treat `docs/drafts/**` or `*.draft.md` as active instructions
- Start work unless preflight checks pass (below)

### Claude must not

- Modify Cursor implementation files during review unless the founder (or status)
  explicitly authorizes it
- Commit Cursor-authored implementation or Cursor self-review files
- Leave review drafts in authoritative paths (`docs/reviews/`) before delivery

### Neither agent may

- Commit another agent's authored review file
- Proceed while the other agent holds the write lock (except read-only inspection
  of **committed** history)

## Draft location

In-progress reviews and unfinished handoffs belong in:

- `docs/drafts/` (preferred), or
- a `*.draft.md` filename

Automated task execution **ignores** `docs/drafts/**` and `*.draft.md`.
Promote a draft to an authoritative path only when delivering, then commit it
under the authoring agent's lock.

## `CURRENT_STATUS.md` lock block (required)

Every committed status update must include these fields:

| Field                    | Meaning                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| **Active Agent**         | Who is currently expected to act (`Cursor` \| `Claude` \| `none`) |
| **Write Lock Owner**     | Who may write (`Cursor` \| `Claude` \| `Founder` \| `none`)       |
| **Active Task**          | Formal task id (`TASK-XXX`) or `none` — not a free-text label     |
| **Authoritative Commit** | Git commit SHA that status claims as baseline                     |
| **Allowed Paths**        | Paths the lock owner may change (missing dirs may be created)     |
| **Forbidden Paths**      | Paths the lock owner must not change                              |
| **Next Action**          | Exact next step and who performs it                               |

When the founder grants a lock (or overrides idle/`none`), status should also record:

| Field                       | Meaning                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| **Founder Authorization**   | Short note that the founder directed the lock grant / path scope |
| **Cursor Action Permitted** | `yes` only when founder/status explicitly allows Cursor to act   |

Active work requires a **committed** task spec under `docs/tasks/` whose id matches **Active Task** (AGENTS.md authority item 4). Do not use informal Active Task labels without a matching `docs/tasks/TASK-*.md`. Listing a directory under **Allowed Paths** permits creating that directory if it does not yet exist.

When Cursor may act on a Claude review, status must also record:

| Field                           | Meaning                                |
| ------------------------------- | -------------------------------------- |
| **Authoritative Review**        | Committed path to the Claude review    |
| **Authoritative Review Commit** | Commit SHA that introduced that review |

Cursor may follow a Claude review **only if all** are true:

1. The review file is committed.
2. Its commit hash is recorded in `CURRENT_STATUS.md`.
3. Status explicitly sets **Cursor Action Permitted** to `yes` (or equivalent
   clear permit language in **Next Action**).

## Cursor preflight (before starting work)

1. `git status` is clean (no uncommitted changes Cursor did not itself create in
   this session for the locked task).
2. **Write Lock Owner** is `Cursor`.
3. **Authoritative Commit** exists and is an ancestor of (or equal to) `HEAD`
   unless status documents a deliberate checkout.
4. Task / **Next Action** permits implementation.
5. Any review being followed is committed and listed as authoritative (above).

If any check fails: **stop**. Do not implement.

## Cursor stop protocol (before ending a session)

1. Update `docs/status/CURRENT_STATUS.md` (lock fields + next action).
2. Release the write lock (`none`) or transfer it (`Claude` / `Founder`).
3. Commit **only** Cursor-owned changes.
4. Do not push unless explicitly authorized.

## Claude stop protocol

1. Place finished review under `docs/reviews/` (not `docs/drafts/`).
2. Update status: set review path + review commit fields after commit, transfer
   lock if Cursor follow-up is expected.
3. Commit **only** Claude-owned review / status / handoff notes.
4. Do not stage Cursor implementation diffs.

## Validation

```bash
pnpm validate:agent-lock
```

The script fails when:

- `CURRENT_STATUS.md` has no write-lock owner
- Active Agent is `Cursor` while Write Lock Owner is `Claude`
- An authoritative review path points to an uncommitted file
- A `docs/drafts/` path (or `*.draft.md`) is referenced as an active instruction

## Cadence (unchanged product rule)

Claude still performs **one consolidated audit per milestone** unless status
explicitly assigns a narrower review. Between milestones, Cursor proceeds on
**committed, approved** tasks only — never on undelivered drafts.
