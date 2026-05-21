# MCP Interface Draft

## Purpose

This document defines a future MCP interface for the common harness agent. It is an interface draft only; the repository does not currently provide an MCP server.

## Storage Boundary

The MCP server should store or access only generic harness records and approved local task records. It should not expose tools for deployment, database mutation, Git force push, or secret retrieval by default.

## Tools

### get_harness_spec

Returns the common harness agent spec and operating model.

Input:

```json
{}
```

Output:

```json
{ "spec": "...", "operatingModel": "..." }
```

### get_template

Returns a named template.

Input:

```json
{ "name": "project-profile|handoff|session-queue" }
```

### create_task

Creates a task record from templates.

Input:

```json
{
  "taskName": "string",
  "taskRoot": "string",
  "projectProfileRef": "string"
}
```

### read_queue

Reads a task queue.

Input:

```json
{ "taskRef": "string" }
```

### update_task_status

Updates one queue item status.

Input:

```json
{
  "taskRef": "string",
  "itemId": "string",
  "status": "todo|in-progress|done|blocked|skipped",
  "note": "string"
}
```

### append_handoff

Appends a sanitized handoff entry.

Input:

```json
{
  "taskRef": "string",
  "heading": "string",
  "body": "string"
}
```

### summarize_task

Returns a concise task status summary.

Input:

```json
{ "taskRef": "string" }
```

## Security Requirements

- Authenticate remote access.
- Maintain audit logs for writes.
- Reject known secret patterns before storing data.
- Keep role-scoped write permissions.
- Prefer local or company-controlled storage for private project records.
