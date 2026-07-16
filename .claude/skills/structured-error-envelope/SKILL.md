---
name: structured-error-envelope
description: Provide the standard error response shape { error: { code, message } } plus a shared error-code registry used by every endpoint and client hook. Use when defining error handling.
---
# Structured Error Envelope

Full spec: `research/skills.md` #32.

## Procedure
1. Define a shared error util returning `{ error: { code, message } }` with correct HTTP status.
2. Maintain a typed error-code registry (e.g., `insufficient_credits`, `moderation_blocked`, `not_found`, `forbidden`).
3. Success responses use `{ data }`.
4. Client hooks branch on `error.code`.

## References
- https://supabase.com/docs/guides/functions
