# Sample Project Profile

## Project Overview

- Project name: sample-web-app
- Domain: generic web application
- Default language: English
- Main stack: JavaScript, Node.js, browser UI

## Local Path Mapping

- `<WORKSPACE_ROOT>`: `/path/to/workspace`
- `<HARNESS_ROOT>`: `/path/to/harness-agent`
- `<TASK_ROOT>`: `/path/to/workspace/docs/tasks`

## Repositories

| Name | Path | Notes |
| --- | --- | --- |
| app | `<WORKSPACE_ROOT>/app` | product source |

## Build And Test

- Build command: `npm run build`
- Test command: `npm test`
- Verification command: `npm run lint`
- If not run, record reason in handoff.

## Restrictions

- Do not commit `.env` files.
- Do not store API keys in task records.
- Do not deploy without explicit approval.
