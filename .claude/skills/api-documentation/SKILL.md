---
name: api-documentation
description: Generate and maintain the API reference from the PRD §5 spec (endpoints, payloads, auth, errors) for developer onboarding. Use to keep API docs in sync.
---
# API Documentation

Full spec: `research/skills.md` #38.

## Procedure
1. Derive docs from the shared Zod schemas (source of truth) + PRD §5.
2. Document each endpoint: method, path, auth tier, request/response, error codes, idempotency.
3. Output `docs/api.md` (or OpenAPI); update when contracts change.

## References
- https://swagger.io/specification/
