---
name: supabase-migration
description: Author and apply versioned Supabase/Postgres SQL migrations for the PRD §4 schema (tables, enums, constraints, indexes). Use when creating or altering database tables.
---
# Supabase Migration

Author versioned SQL migrations via the Supabase CLI. Full spec: `research/skills.md` #1.

## When to use
Any create/alter of tables, enums, constraints, or indexes.

## Procedure
1. Read the target schema from PRD §4.3–§4.5.
2. `supabase migration new <descriptive_name>`.
3. Write idempotent SQL: UUID PKs (`gen_random_uuid()`), `snake_case`, `timestamptz`, CHECK constraints for enums, `balance_after >= 0`.
4. Add indexes per PRD §4.4 in the same migration.
5. Pair any tenant table with an RLS policy (see `rls-policy` skill).
6. Apply to DEV/PREVIEW (`supabase db push` / `migration up`); NEVER hand-edit prod.

## Output
A timestamped file in `supabase/migrations/`, applied to dev/preview.

## Ask before
Destructive changes (drop/rename/type-alter on populated tables) or prod application.

## References
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/database/overview
