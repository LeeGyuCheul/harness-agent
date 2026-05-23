# <Task Name> Session Queue

## Operating State

- Main role: `main`
- User instruction path: user talks to the main agent only
- Project profile: `<PROJECT_PROFILE>`
- Handoff: `<TASK_ROOT>/<task-name>/handoff.md`
- Runtime adapters: `AGENTS.md`, `CLAUDE.md`
- Overall status: `todo`

## Common Start Rules

1. Read the project profile.
2. Read this queue and `handoff.md`.
3. Work only on queue items assigned to your role.
4. Do not edit files outside your ownership boundary.
5. Before stopping, update this queue and `handoff.md`.
6. When switching between Codex and Claude Code, record the last state writer and next recommended tool in `handoff.md`.

## Sub-Session Start Prompt

```text
Read <TASK_ROOT>/<task-name>/session-queue.md and perform only the work assigned to your role. Follow the project profile and handoff. Record results in session-queue.md and handoff.md.
```

## Queue

| ID | Role | Status | Scope | Goal | Owned Files |
| --- | --- | --- | --- | --- | --- |
| TASK-PM-001 | main | in-progress | PM coordination | Manage goal, queue, handoff, and final judgment | `handoff.md`, `session-queue.md` |
| TASK-AN-001 | analysis | todo | Investigation | Analyze source/docs/logs/data and propose findings | read-only |
| TASK-WK-001 | worker | todo | Implementation | Make PM-scoped changes and run verification | PM-assigned files only |
| TASK-VF-001 | verify | todo | Verification | Verify behavior and classify failures | no code changes |
| TASK-DC-001 | docs | todo | Documentation | Update handoff, test notes, or records | docs only |

## Status Values

- `todo`
- `in-progress`
- `done`
- `blocked`
- `skipped`

## Update Log

- <YYYY-MM-DD>: Queue created.

## Result Format

```text
### <YYYY-MM-DD HH:mm> / <role> / <queue-id>

- Work done:
- Files changed:
- Commands run:
- Result:
- Remaining work:
- Main decision needed:
```
