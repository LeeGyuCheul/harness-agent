# Operating Model

## Goal

Run AI coding work through a PM-centered harness where the user talks to one main agent and the main agent manages queue, handoff, ownership, and verification structure.

## Flow

1. User gives the main agent a goal.
2. Main agent reads the local project profile.
3. Main agent creates or updates the task handoff and session queue.
4. Main agent assigns role-scoped work.
5. Optional sub-sessions execute only their queue items.
6. Results are written back to the queue and handoff.
7. Main agent reviews results and reports the final state.

## Required Task Files

Every task should have:

```text
handoff.md
session-queue.md
```

Optional task files:

```text
verification-rules.md
automation-rules.md
test-record.md
notes.md
```

## Completion Criteria

A task is complete when:

- Required queue items are `done`, `skipped`, or clearly `blocked`
- Changed files and intent are recorded
- Verification commands and results are recorded
- Unverified items have explicit reasons
- Remaining risk is clear
- The main agent has reported the final decision

## Failure Classification

Use these labels:

- `functional-failure`: product behavior appears wrong
- `environment-failure`: local service, network, account, or data issue
- `test-failure`: test harness, selector, fixture, or script issue
- `blocked`: decision, access, or dependency needed
- `not-reproducible`: current evidence does not reproduce the issue
