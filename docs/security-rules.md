# Security Rules

## Repository Boundary

This repository is for common harness methods only. It must remain free of confidential project content.

## Do Not Store

Never commit:

- Secrets, passwords, tokens, keys, cookies, or certificates
- Internal URLs, VPN details, or private hostnames
- Customer data, order numbers, DB rows, logs, or screenshots
- Company-specific branch names, issue IDs, source paths, or release notes
- Proprietary business rules from a private project
- Generated artifacts that include private data

## Safe To Store

Allowed content:

- Generic operating principles
- Generic role definitions
- Queue and handoff templates
- Sanitized examples
- Generic scripts that do not contain project data

## MCP Guidance

If this model is exposed through MCP:

- Start with read/write access only to queue and handoff records
- Do not expose Git push, deployment, DB update, or server control tools by default
- Require authentication for any remote MCP server
- Keep audit logs for task updates
- Filter or reject sensitive patterns before storing content

## Local Project Profiles

Local profiles may describe project constraints, but should still avoid secrets. Keep sensitive execution values in approved secret managers or local environment configuration.
