# Naming Rules

## Files and Folders

Use lowercase English with hyphens.

Examples:

```text
harness-agent-spec.md
session-queue.md
project-profile.md
security-rules.md
```

## Role Codes

Use fixed role codes in queue IDs.

```text
PM = main
AN = analysis
WK = worker
VF = verify
DC = docs
```

## Task IDs

Use a short neutral prefix and a three-digit number.

```text
TASK-PM-001
TASK-AN-001
TASK-WK-001
TASK-VF-001
TASK-DC-001
```

For local projects, replace `TASK` with a safe project-neutral local prefix.

## Status Values

Use these values only:

```text
todo
in-progress
done
blocked
skipped
```

## Result Labels

Use these labels for verification outcomes:

```text
pass
fail
blocked
not-run
not-applicable
```
