# Sample Session Queue

## Operating State

- Main role: `main`
- User instruction path: user talks to the main agent only
- Project profile: `examples/sample-project-profile.md`
- Handoff: `docs/tasks/sample-task/handoff.md`
- Overall status: `todo`

## Queue

| ID | Role | Status | Scope | Goal | Owned Files |
| --- | --- | --- | --- | --- | --- |
| SAMPLE-PM-001 | main | in-progress | PM coordination | Define target behavior and review results | `handoff.md`, `session-queue.md` |
| SAMPLE-AN-001 | analysis | todo | UI flow | Identify current behavior and likely files | read-only |
| SAMPLE-WK-001 | worker | todo | Button behavior | Implement assigned UI change | PM-assigned files only |
| SAMPLE-VF-001 | verify | todo | Browser check | Verify expected UI behavior | no code changes |
| SAMPLE-DC-001 | docs | skipped | Documentation | No separate docs work needed | docs only |
