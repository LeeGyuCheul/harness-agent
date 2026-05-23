# Codex And Claude Code Interoperability

## Recommendation

Use an agent-neutral task bundle as the source of truth. Codex and Claude Code should not depend on each other's private chat history, hidden memory, local token state, or provider-specific features.

The common contract is:

```text
project profile -> task bundle -> queue item -> result record -> handoff update
```

Both tools may execute work, but the durable state must live in these files:

```text
<TASK_ROOT>/<task-name>/handoff.md
<TASK_ROOT>/<task-name>/session-queue.md
<PROJECT_PROFILE>
```

This is the best default because it is portable across computers, survives token/session expiry, allows either tool to resume, and keeps private project facts out of this common harness repository.

## Operating Pattern

Use one active PM owner at a time.

- `main` owns user communication, queue ordering, final judgment, and publication decisions.
- Codex may act as `main`, `analysis`, `worker`, `verify`, or `docs`.
- Claude Code may act as `main`, `analysis`, `worker`, `verify`, or `docs`.
- Only one tool should own the same queue item at the same time.
- If PM ownership changes, record the change in `handoff.md` and the queue update log.

Do not use Codex and Claude Code as simultaneous writers on the same files unless the PM explicitly splits ownership boundaries.

## Local Adapter Files

Each project may keep lightweight startup files that point the tool to the same harness state:

```text
AGENTS.md
CLAUDE.md
```

Recommended mapping:

| File | Primary Reader | Purpose |
| --- | --- | --- |
| `AGENTS.md` | Codex-compatible agents | Tell Codex where the project profile, queue, and handoff live |
| `CLAUDE.md` | Claude Code | Tell Claude Code where the project profile, queue, and handoff live |

These files should not duplicate project policy. They should be thin adapters that say:

- Read the local project profile first.
- Read the current task queue and handoff.
- Work only on assigned queue items.
- Update the queue and handoff before stopping.
- Do not store secrets or private data in the common harness repository.

Templates are provided in:

```text
templates/agents.md
templates/claude.md
```

## State Contract

Every agent turn should start by reading:

1. `<PROJECT_PROFILE>`
2. `handoff.md`
3. `session-queue.md`

Every agent turn that changes state should end by updating:

1. Queue item status
2. Result record
3. Commands run and verification result
4. Remaining work or blocker
5. Handoff decisions, risks, and next action

If an agent cannot update the files, it must report the exact state delta in its final message so the PM can record it.

## Queue Ownership Rules

Use these ownership rules to avoid conflicts:

- `analysis`: read-only unless the queue explicitly allows docs updates.
- `worker`: edits only PM-assigned files.
- `verify`: does not edit product code.
- `docs`: edits task records, summaries, and documentation only.
- `main`: may update task state and decide whether to publish.

When Codex and Claude Code both participate, the PM should assign explicit queue items like:

```text
TASK-AN-001 -> Claude Code -> read-only backend investigation
TASK-WK-001 -> Codex -> frontend implementation in assigned files
TASK-VF-001 -> Claude Code -> verification only
TASK-DC-001 -> Codex -> handoff and docs update
```

The tool name can be recorded in the `Scope` or `Goal` field when useful, but the role remains the stable contract.

## Handoff Fields

Add these fields to local handoffs when both tools are involved:

```text
## Runtime Ownership

- Current PM owner:
- Previous PM owner:
- Active tool sessions:
- Last state writer:
- Next recommended tool:
```

Use this section to make session switching explicit.

## Conflict Handling

If both tools edit the same local workspace:

1. Stop new work.
2. Read `git status`.
3. Identify files changed by each tool.
4. Preserve user and tool changes unless the PM explicitly rejects them.
5. Merge manually.
6. Record the resolution in `handoff.md`.

Do not use destructive reset commands as a routine handoff strategy.

## GitHub Publication

Keep local task records and code edits local while the user is still iterating.

Publish only when the user explicitly asks to push, sync, reflect, or add the final state to GitHub. Before publishing:

1. Summarize changed files.
2. Run available validation.
3. Confirm no secrets or private project facts are included.
4. Commit once with a clear message.
5. Push or open a PR according to the project profile.

## Recommended Workflow

1. Create a task folder with `harness-init.ps1`.
2. Copy `templates/agents.md` to the local project as `AGENTS.md`.
3. Copy `templates/claude.md` to the local project as `CLAUDE.md`.
4. Fill the project profile with local paths, commands, and restrictions.
5. Assign the first PM owner in `handoff.md`.
6. Let the PM split work into queue items.
7. Start Codex or Claude Code with the queue item it owns.
8. Require each tool to update the queue and handoff before stopping.
9. Let the PM review results and decide the final publication step.

## What To Avoid

- Do not paste personal access tokens into prompts, dashboards, raw URLs, or task records.
- Do not depend on private chat history as the only task memory.
- Do not let both tools edit the same file without explicit ownership.
- Do not commit real client names, internal URLs, logs, order IDs, or source paths to this common repository.
- Do not publish intermediate drafts unless the user explicitly asks for publication.
