# Sample Task Handoff

## Current Goal

- Demonstrate the common harness handoff format with sanitized sample data.

## Harness Structure

- Current role: `main`
- Common harness spec: `docs/harness-agent-spec.md`
- Project profile: `examples/sample-project-profile.md`
- Session queue: `examples/sample-session-queue.md`
- The user talks to the main agent only. The main agent manages sub-session work through the queue and this handoff.

## Related Repositories

| Repository | Branch | Notes |
| --- | --- | --- |
| sample-app | main | sanitized example only |

## Related Files

- `templates/session-queue.md`
- `templates/handoff.md`

## Decisions

- Keep common harness content project-neutral.
- Keep local project details outside this repository unless fully sanitized.

## Verified Cases

- `SAMPLE-001`: queue status format renders correctly.

## Commands Run

- `scripts/harness-status.ps1 -TaskRoot examples -QueueFile sample-session-queue.md` -> expected queue lines are printed.

## Remaining Work

- None for the sample.

## Risks And Notes

- This file is sanitized and does not represent a real project.
