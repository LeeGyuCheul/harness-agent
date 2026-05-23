# Codex And Claude Code Interoperability

## Recommendation

Use an agent-neutral task bundle as the source of truth. Codex and Claude Code should not depend on each other's private chat history, hidden memory, local token state, or provider-specific features.

The common contract is:

```text
project profile -> task bundle -> queue item -> result record -> handoff update
```

Both tools may execute work, but the durable state must live in these files:

```text
<TASK_ROOT>/<task-name>/handoff.md
<TASK_ROOT>/<task-name>/session-queue.md
<PROJECT_PROFILE>
```

This is the best default because it is portable across computers, survives token/session expiry, allows either tool to resume, and keeps private project facts out of this common harness repository.

## Operating Pattern

Use one active PM owner at a time.

- `main` owns user communication, queue ordering, final judgment, and publication decisions.
- Codex may act as `main`, `analysis`, `worker`, `verify`, or `docs`.
- Claude Code may act as `main`, `analysis`, `worker`, `verify`, or `docs`.
- Only one tool should own the same queue item at the same time.
- If PM ownership changes, record the change in `handoff.md` and the queue update log.

Do not use Codex and Claude Code as simultaneous writers on the same files unless the PM explicitly splits ownership boundaries.

## Local Adapter Files

Each project may keep lightweight startup files that point the tool to the same harness state:

```text
AGENTS.md
CLAUDE.md
```

Recommended mapping:

| File | Primary Reader | Purpose |
| --- | --- | --- |
| `AGENTS.md` | Codex-compatible agents | Tell Codex where the project profile, queue, and handoff live |
| `CLAUDE.md` | Claude Code | Tell Claude Code where the project profile, queue, and handoff live |

These files should not duplicate project policy. They should be thin adapters that say:

- Read the local project profile first.
- Read the current task queue and handoff.
- Work only on assigned queue items.
- Update the queue and handoff before stopping.
- Do not store secrets or private data in the common harness repository.

Templates are provided in:

```text
templates/agents.md
templates/claude.md
```

## Single Instruction Block Rule

When starting Codex or Claude Code, give one complete instruction block. Do not send the role, goal, file paths, and constraints as separate partial messages.

The runtime must be able to access the paths in the instruction block. A Windows path such as `C:\project\trade\...` only works when the runtime is actually running on that Windows machine or inside an environment where that path is mounted.

Claude.ai web/app chat is not the same as local Claude Code. If Claude is running in a web sandbox, it cannot read local Windows paths, run local `git status`, or update local `handoff.md` and `session-queue.md` unless the files are uploaded or mounted through an approved integration.

The instruction block must include:

- Workspace path
- Common harness root
- Project profile path
- Task root path
- Handoff path
- Session queue path
- Runtime adapter path, such as `AGENTS.md` or `CLAUDE.md`
- Assigned role
- Assigned queue item
- Goal
- Ownership boundary
- Publication restriction
- Required state updates before stopping

This prevents the runtime from acting on an incomplete command and makes the task portable across machines.

Before assigning work, confirm the runtime mode:

| Runtime mode | Local path access | Can update task files | Recommended use |
| --- | --- | --- | --- |
| Local Codex in the project workspace | Yes | Yes | Main PM, implementation, verification, publication |
| Local Claude Code in the project workspace | Yes | Yes | Queue-scoped analysis, implementation, verification |
| Claude.ai web/app with uploaded files | No direct local path access | No, unless user applies changes manually | Review, critique, planning, read-only analysis |
| Remote Linux sandbox without mounted workspace | No Windows path access | No | Not suitable for local queue execution |

If the runtime cannot access the workspace path, do not assign it a queue item that requires editing files. Use it only for read-only review with uploaded copies, or switch to a local runtime that can access the project workspace.

## Claude.ai Web Fallback

When using Claude.ai web/app instead of local Claude Code, send a single review bundle rather than local filesystem paths.

The bundle should include:

- Runtime adapter content, usually `templates/claude.md`
- Project profile content, sanitized if needed
- Handoff content
- Session queue content
- Specific files to review
- Explicit statement that Claude cannot edit local files directly

Use this format:

```text
You are reviewing an uploaded harness task bundle in Claude.ai web/app.

You do not have direct access to my local Windows filesystem.
Do not claim to run git, edit files, or update local task records.

Workspace path on my machine:
<WORKSPACE_ROOT>

Common harness root on my machine:
<HARNESS_ROOT>

Task root on my machine:
<TASK_ROOT>/<task-name>

Uploaded bundle contents:
1. Runtime adapter content
2. Project profile content
3. Handoff content
4. Session queue content
5. Files to review

Assigned role:
<analysis | verify | docs-review>

Assigned queue item:
<QUEUE-ID>

Goal:
<specific review goal>

Rules:
- Treat uploaded content as a snapshot.
- Do not assume local files are accessible.
- Do not say you updated session-queue.md or handoff.md.
- Return a patch-style recommendation or exact replacement text.
- List which local files I should update.
- Do not include secrets, credentials, internal URLs, customer data, raw logs, screenshots, or private project identifiers in the response.
```

For any task that requires direct edits, use local Claude Code or Codex in the same workspace instead of Claude.ai web/app.

## Automated Claude Code Bridge

When Claude Code CLI is installed and authenticated on the same machine, the PM runtime may invoke Claude Code directly instead of asking the user to copy and paste a prompt.

Use:

```powershell
.\scripts\run-claude-queue-item.ps1 `
  -WorkspaceRoot "<WORKSPACE_ROOT>" `
  -HarnessRoot "<HARNESS_ROOT>" `
  -ProjectProfile "<PROJECT_PROFILE>" `
  -TaskRoot "<TASK_ROOT>/<task-name>" `
  -Role "<analysis | worker | verify | docs>" `
  -QueueId "<QUEUE-ID>" `
  -Goal "<specific task goal>" `
  -PermissionMode "auto"
```

The script builds the required single instruction block, runs `claude -p --output-format json`, and writes the result JSON into the task folder.

Use the bridge only when:

- `claude auth status` reports logged in.
- Claude Code can access the same workspace path.
- The PM assigned a single queue item.
- The task has clear ownership boundaries.

Use `-PermissionMode "auto"` for routine queue work. Use stricter modes such as `plan` for analysis-only work. Do not use `bypassPermissions` unless the workspace is isolated and the PM explicitly accepts the risk.

If the bridge cannot connect to the Claude API from a restricted runtime, rerun it from an approved local shell or use the manual copy/paste bridge.

Use this format:

```text
You are running as <Codex | Claude Code> for this project.

Workspace path:
<WORKSPACE_ROOT>

Common harness root:
<HARNESS_ROOT>

Runtime adapter:
<WORKSPACE_ROOT>/AGENTS.md
or
<WORKSPACE_ROOT>/CLAUDE.md

Project profile:
<PROJECT_PROFILE>

Task root:
<TASK_ROOT>/<task-name>

Handoff:
<TASK_ROOT>/<task-name>/handoff.md

Session queue:
<TASK_ROOT>/<task-name>/session-queue.md

Read order:
1. Runtime adapter
2. Project profile
3. Handoff
4. Session queue

Assigned role:
<main | analysis | worker | verify | docs>

Assigned queue item:
<QUEUE-ID>

Goal:
<specific task goal>

Rules:
- Perform only the assigned queue item.
- Work only inside the ownership boundary listed in the queue.
- Preserve user changes and changes from other agent runtimes.
- Check local git status before and after work when git is available.
- Update session-queue.md and handoff.md before stopping.
- Record changed files, commands run, verification result, remaining work, and blockers.
- Do not commit, push, open a PR, deploy, or sync unless the user explicitly asks for publication.
- Do not record secrets, credentials, internal URLs, customer data, raw logs, screenshots, or private project identifiers in the common harness repository.
```

## State Contract

Every agent turn should start by reading:

1. `<PROJECT_PROFILE>`
2. `handoff.md`
3. `session-queue.md`

Every agent turn that changes state should end by updating:

1. Queue item status
2. Result record
3. Commands run and verification result
4. Remaining work or blocker
5. Handoff decisions, risks, and next action

If an agent cannot update the files, it must report the exact state delta in its final message so the PM can record it.

## Queue Ownership Rules

Use these ownership rules to avoid conflicts:

- `analysis`: read-only unless the queue explicitly allows docs updates.
- `worker`: edits only PM-assigned files.
- `verify`: does not edit product code.
- `docs`: edits task records, summaries, and documentation only.
- `main`: may update task state and decide whether to publish.

When Codex and Claude Code both participate, the PM should assign explicit queue items like:

```text
TASK-AN-001 -> Claude Code -> read-only backend investigation
TASK-WK-001 -> Codex -> frontend implementation in assigned files
TASK-VF-001 -> Claude Code -> verification only
TASK-DC-001 -> Codex -> handoff and docs update
```

The tool name can be recorded in the `Scope` or `Goal` field when useful, but the role remains the stable contract.

## Handoff Fields

Add these fields to local handoffs when both tools are involved:

```text
## Runtime Ownership

- Current PM owner:
- Previous PM owner:
- Active tool sessions:
- Last state writer:
- Next recommended tool:
```

Use this section to make session switching explicit.

## Conflict Handling

If both tools edit the same local workspace:

1. Stop new work.
2. Read `git status`.
3. Identify files changed by each tool.
4. Preserve user and tool changes unless the PM explicitly rejects them.
5. Merge manually.
6. Record the resolution in `handoff.md`.

Do not use destructive reset commands as a routine handoff strategy.

## GitHub Publication

Keep local task records and code edits local while the user is still iterating.

Publish only when the user explicitly asks to push, sync, reflect, or add the final state to GitHub. Before publishing:

1. Summarize changed files.
2. Run available validation.
3. Confirm no secrets or private project facts are included.
4. Commit once with a clear message.
5. Push or open a PR according to the project profile.

## Recommended Workflow

1. Create a task folder with `harness-init.ps1`.
2. Copy `templates/agents.md` to the local project as `AGENTS.md`.
3. Copy `templates/claude.md` to the local project as `CLAUDE.md`.
4. Fill the project profile with local paths, commands, and restrictions.
5. Assign the first PM owner in `handoff.md`.
6. Let the PM split work into queue items.
7. Start Codex or Claude Code with the queue item it owns.
8. Require each tool to update the queue and handoff before stopping.
9. Let the PM review results and decide the final publication step.

## What To Avoid

- Do not paste personal access tokens into prompts, dashboards, raw URLs, or task records.
- Do not depend on private chat history as the only task memory.
- Do not let both tools edit the same file without explicit ownership.
- Do not commit real client names, internal URLs, logs, order IDs, or source paths to this common repository.
- Do not publish intermediate drafts unless the user explicitly asks for publication.
