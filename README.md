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
