# Harness Agent Spec

## Purpose

This document defines a project-neutral harness engineering agent for AI coding workflows.

The harness agent receives user goals, reads a local project profile, creates task queues and handoff records, and coordinates role-scoped work without embedding project-specific knowledge.

## Core Model

```text
Common harness agent
  -> reusable PM, queue, and state management behavior

Local project profile
  -> project stack, paths, restrictions, build and verification rules

Task queue
  -> role assignments, ownership, status, and next actions for one task

Handoff
  -> compact state record that lets another session continue safely
```

## Agent Responsibilities

The common harness agent should:

- Convert a user request into a clear task goal
- Read and apply the local project profile
- Create or update `handoff.md` and `session-queue.md`
- Split work into `main`, `analysis`, `worker`, `verify`, and `docs` roles
- Assign ownership boundaries for files and responsibilities
- Track status, blockers, verification, and residual risk
- Produce the final user-facing decision or summary

## Knowledge Boundary

The common harness agent must not contain private project facts.

Do not encode:

- Client or company-specific details
- Credentials, tokens, keys, or secrets
- Internal URLs or network locations
- Real order numbers, DB records, logs, or screenshots
- Real source paths, branch names, issue IDs, or deployment settings
- Project-specific build commands

Those belong in an approved local profile or company-controlled task record.

## Role Definitions

### main

The PM role. Owns user communication, task decomposition, final judgment, merge/push/deployment decisions, and queue state.

### analysis

Read-only investigation. Reviews code, logs, documentation, data, or test evidence. Does not edit code.

### worker

Implements PM-assigned changes within explicit ownership boundaries. Runs appropriate local verification when possible.

### verify

Checks behavior, screens, APIs, DB state, or test cases. Classifies failures without making code changes.

### docs

Maintains handoff, task records, test notes, spreadsheets, and summaries. Does not edit product code.

## Location Independence

Use conceptual paths in common documents:

- `<HARNESS_ROOT>`: location of this common harness repository
- `<WORKSPACE_ROOT>`: local project workspace
- `<PROJECT_PROFILE>`: local project profile file
- `<TASK_ROOT>`: task-specific queue and handoff location

Each computer maps these paths differently. The harness model remains the same.

## Recommended Storage

Keep this repository generic and portable. Store project-specific profiles and task records in one of these places:

- Local workspace approved for the project
- Company-controlled Git repository
- Company-approved document system
- Local encrypted storage

Do not store private company task records in a personal public or private repository unless company policy explicitly allows it.
