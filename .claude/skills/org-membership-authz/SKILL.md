---
name: org-membership-authz
description: Enforce organization-scoped authorization — resolve active org (X-Org-Id), verify membership, and check roles (owner/admin/member) in Edge Functions and RLS. Use for any multi-tenant access control.
---
# Org Membership AuthZ

Full spec: `research/skills.md` #7.

## Procedure
1. From the JWT get `auth.uid()`; read requested org from `X-Org-Id`.
2. Verify a membership row exists for (user, org); else 403.
3. For privileged actions, require role `admin` or `owner`.
4. Provide a reusable guard util shared across Edge Functions; mirror in RLS.

## References
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/database/postgres/row-level-security
