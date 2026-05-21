# harness-agent

Reusable PM-driven harness engineering templates for AI coding agents.

This repository stores a project-neutral operating model for coordinating AI coding work through a main PM agent, task queues, handoff records, and role-scoped execution.

## What This Is

`harness-agent` is a common method kit. It is not tied to a company, client, source repository, or local computer.

Use it to:

- Turn a user goal into a structured work queue
- Split work into `main`, `analysis`, `worker`, `verify`, and `docs` roles
- Keep handoff records that another session can continue from
- Separate common agent behavior from local project profiles
- Reuse the same operating model across different machines and projects

## What Must Not Be Stored Here

Do not commit confidential or project-specific data:

- Company or client-specific internal details
- Internal URLs
- Account names, passwords, tokens, keys, or certificates
- Order numbers, customer data, DB rows, logs, or screenshots
- Real branch names, issue IDs, source paths, or deployment settings

Store those only in an approved local workspace or company-controlled system.

## Structure

```text
docs/
  harness-agent-spec.md
  operating-model.md
  naming-rules.md
  security-rules.md
templates/
  project-profile.md
  handoff.md
  session-queue.md
examples/
  sample-project-profile.md
  sample-session-queue.md
scripts/
  harness-status.ps1
```

## Basic Usage

1. Copy `templates/project-profile.md` into your local project workspace.
2. Create a task folder in the local workspace.
3. Copy `templates/handoff.md` and `templates/session-queue.md` into that task folder.
4. Ask the main PM agent to run the task using this harness model and the local project profile.

The common harness stays generic. Local project rules stay local.

## Operational Additions

This kit also includes:

- `prompts/`: role-specific start prompts for main, analysis, worker, verify, and docs sessions
- `schemas/`: draft JSON schemas for future CLI/MCP validation
- `scripts/harness-init.ps1`: creates a task folder from templates
- `scripts/harness-validate.ps1`: checks queue and handoff structure
- `docs/mcp-interface.md`: draft interface for a future MCP server

## Quick Start With Scripts

Create a task folder from templates:

```powershell
.\scripts\harness-init.ps1 -TaskName "Sample Task" -TaskRoot ".\tmp" -ProjectProfile "profiles/local-project.md" -Prefix "SAMPLE"
```

Check task status:

```powershell
.\scripts\harness-status.ps1 -TaskRoot ".\tmp\sample-task"
```

Validate task structure:

```powershell
.\scripts\harness-validate.ps1 -TaskRoot ".\tmp\sample-task" -Strict
```

## Agent Activity Dashboard

Open `dashboard/index.html` in a browser to view a local animated dashboard for queue status.

The dashboard can:

- Render the built-in sample queue
- Load a `session-queue.md` file from disk
- Accept pasted queue markdown
- Render a Canvas-based isometric workspace simulation with cute agent avatars
- Move agents between workspace zones by status: `todo`, `in-progress`, `done`, `blocked`, `skipped`

It is fully static and does not send data to a server.

### Remote Queue Sync

The dashboard can poll a remote `session-queue.md` URL every five seconds. This does not call an AI model and does not spend tokens; it is browser `fetch` plus UI rendering.

Recommended public or sanitized queue URL forms:

```text
https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>/session-queue.md
https://<owner>.github.io/<repo>/<path>/session-queue.md
```

Do not sync private company queues through personal public URLs. For confidential work, use a company-approved host or a sanitized queue.

Private GitHub raw URLs usually return `404` in the browser unless the content is public or served through an authenticated, approved gateway. Do not paste personal access tokens into dashboard URLs.
