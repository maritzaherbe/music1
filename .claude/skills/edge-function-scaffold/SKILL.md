---
name: edge-function-scaffold
description: Scaffold a Supabase Edge Function (Deno/TS) with the standard skeleton — JWT auth, org authz, Zod input validation, error envelope, typed response. Use when creating a new backend endpoint.
---
# Edge Function Scaffold

Full spec: `research/skills.md` #8.

## Procedure
1. Create `supabase/functions/<name>/index.ts`.
2. Standard skeleton: verify JWT → `org-membership-authz` guard → parse+validate body with shared Zod schema → business call → return `{ data }` or `{ error: { code, message } }`.
3. Require `Idempotency-Key` on mutations.
4. Deploy with `supabase functions deploy <name>`.

## References
- https://supabase.com/docs/guides/functions
- https://deno.land/manual
