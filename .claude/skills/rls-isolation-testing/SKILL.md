---
name: rls-isolation-testing
description: Write automated tests proving no cross-tenant access — a user in org A cannot read/write org B's songs, clips, or ledger. Use whenever RLS changes. Security-critical.
---
# RLS Isolation Testing

Full spec: `research/skills.md` #24.

## Procedure
1. Seed two orgs/users (A, B) via `db-seed-data`.
2. As user A, attempt reads/writes on B's `songs`, `song_clips`, `credit_ledger` → assert denied.
3. Assert deny-by-default (no policy = no access).
4. Run in CI on every RLS/migration change.

## References
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/local-development/testing/overview
