---
name: supabase-auth-setup
description: Configure Supabase Auth — email magic link, Google + Apple OAuth, session persistence, and the signup trigger that creates personal org + profile + free credit grant. Use for login/signup work.
---
# Supabase Auth Setup

Full spec: `research/skills.md` #6.

## Procedure
1. Enable providers: email magic link, Google, Apple (Apple required for iOS store).
2. Configure redirect URLs for iOS/Android/web.
3. Create a DB trigger/function on new `auth.users` that atomically inserts: `organizations` (type=personal), `memberships` (owner), `profiles`, and an initial `credit_ledger` grant.
4. Verify session persistence + sign-out on all platforms.

## Ask before
Changing the free grant amount (credit economics).

## References
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/auth/social-login/auth-apple
