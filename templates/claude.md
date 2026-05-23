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

## Single Instruction Block

When the user starts Claude Code, they must provide one complete instruction block, not separate partial messages.

The provided paths must be accessible from the runtime. Windows paths such as `C:\project\trade\...` require local Claude Code running on that Windows machine, or a mounted workspace that exposes the same files.

Claude.ai web/app chat is not local Claude Code. If this file is pasted into Claude.ai web/app, treat the task as read-only unless the user uploads the relevant files and asks for patch-style recommendations.

Required fields:

- Workspace path
- Common harness root
- Runtime adapter path
- Project profile path
- Task root path
- Handoff path
- Session queue path
- Assigned role
- Assigned queue item
- Goal
- Ownership boundary
- Publication restriction
- Required state updates before stopping

If any required path or queue assignment is missing, ask for the missing value before editing files.

If the runtime cannot access the workspace path, do not edit files or claim that local files were updated. Report the environment mismatch and ask the user to run local Claude Code or upload a review bundle.

## Publication Rule

Do not commit, push, open a PR, deploy, or sync unless the user explicitly asks for publication.

## Security Rule

Do not write secrets, credentials, internal URLs, customer data, logs, screenshots, or private project identifiers into the common harness repository.
