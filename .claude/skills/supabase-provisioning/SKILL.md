---
name: supabase-provisioning
description: Provision the Supabase project — databases, Storage buckets (private audio + public shared), Realtime config, function deploys, environment wiring. Use for infra setup.
---
# Supabase Provisioning

Full spec: `research/skills.md` #29.

## Procedure
1. Create the project; wire env NAMES.
2. Create Storage buckets: private `songs` (re-hosted audio) + public `shared`; set access policies.
3. Enable Realtime on the relevant tables.
4. Deploy Edge Functions.

## References
- https://supabase.com/docs/guides/getting-started
- https://supabase.com/docs/guides/storage/security/access-control
