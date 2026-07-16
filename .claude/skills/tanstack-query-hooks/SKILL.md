---
name: tanstack-query-hooks
description: Build standardized TanStack Query data hooks (queries/mutations) for songs, credits, generation — including polling with exponential backoff as the Realtime fallback. Use for client data fetching.
---
# TanStack Query Hooks

Full spec: `research/skills.md` #21.

## Procedure
1. Typed hooks: `useSongs`, `useSong`, `useGenerate`, `useCredits`.
2. Mutations carry `Idempotency-Key`; parse responses with shared Zod types.
3. For in-flight generations, poll status with exponential backoff (fallback to Realtime).
4. Standard loading/error/retry via the error envelope.

## References
- https://tanstack.com/query/latest
