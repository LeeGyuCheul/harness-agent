# Project Profile Template

## Project Overview

- Project name:
- Domain:
- Default language:
- Main stack:

## Local Path Mapping

- `<WORKSPACE_ROOT>`:
- `<HARNESS_ROOT>`:
- `<TASK_ROOT>`:

## Repositories

| Name | Path | Notes |
| --- | --- | --- |
|  |  |  |

## Work Rules

- Keep changes scoped to the user request.
- Do not revert changes made by other users or sessions.
- Prefer existing project patterns over new abstractions.

## Build And Test

- Build command:
- Test command:
- Verification command:
- If not run, record reason:

## Verification Authority

Describe the preferred source of truth for this project:

- Source code:
- Tests:
- UI:
- API:
- DB:
- Logs:

## Restrictions

- Do not store secrets or credentials in task records.
- Do not change deployment or environment settings without approval.
- Do not push or deploy without explicit approval.

## Harness Links

- Common harness spec: `<HARNESS_ROOT>/docs/harness-agent-spec.md`
- Task handoff: `<TASK_ROOT>/<task-name>/handoff.md`
- Task queue: `<TASK_ROOT>/<task-name>/session-queue.md`
