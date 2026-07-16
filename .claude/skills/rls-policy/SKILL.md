---
name: rls-policy
description: Write and verify Postgres Row-Level Security policies enforcing multi-tenant isolation (org_id in my memberships) and public read for shared songs. Use for any RLS/tenancy change. Security-critical.
---
# RLS Policy

Deny-by-default tenant isolation. Full spec: `research/skills.md` #2.

## Procedure
1. Enable RLS on the table.
2. Policy: row visible/writable only if `org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())`.
3. Public read only via a dedicated view exposing `is_public = true` songs and safe fields.
4. Add role checks (owner/admin/member) where the PRD requires them.
5. ALWAYS pair with `rls-isolation-testing` proving org A cannot touch org B.

## Output
`CREATE POLICY` statements inside a migration; confirmed deny-by-default.

## Ask before
Shipping any RLS change you cannot fully isolation-test. Hand off to Architecture for review.

## References
- https://supabase.com/docs/guides/database/postgres/row-level-security
