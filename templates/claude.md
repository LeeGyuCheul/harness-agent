# CLAUDE.md

Use this file as a thin local adapter for Claude Code.

## Harness

- Common harness root: `<HARNESS_ROOT>`
- Project profile: `<PROJECT_PROFILE>`
- Current task root: `<TASK_ROOT>/<task-name>`
- Handoff: `<TASK_ROOT>/<task-name>/handoff.md`
- Session queue: `<TASK_ROOT>/<task-name>/session-queue.md`

## Start Rules

1. Read the project profile first.
2. Read the handoff and session queue.
3. Identify your assigned role and queue item.
4. Work only inside the ownership boundary listed in the queue.
5. Preserve changes made by the user or another agent.
6. Update the queue and handoff before stopping.

## Publication Rule

Do not commit, push, open a PR, deploy, or sync unless the user explicitly asks for publication.

## Security Rule

Do not write secrets, credentials, internal URLs, customer data, logs, screenshots, or private project identifiers into the common harness repository.
