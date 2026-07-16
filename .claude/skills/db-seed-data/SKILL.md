---
name: db-seed-data
description: Seed reference and test data (occasion_templates, credit packs, sample orgs/songs) idempotently for local dev. Use when populating dev/test databases.
---
# DB Seed Data

Full spec: `research/skills.md` #4.

## Procedure
1. Define seeds: occasion templates (birthday, memorial, wedding, team_anthem…), credit-pack catalog, sample orgs/users/songs.
2. Write idempotent upserts (`ON CONFLICT DO NOTHING/UPDATE`) in `supabase/seed.sql` or a seed script.
3. Run against local/preview only.

## Output
Idempotent seed script; populated dev DB.

## References
- https://supabase.com/docs/guides/local-development/seeding-your-database
