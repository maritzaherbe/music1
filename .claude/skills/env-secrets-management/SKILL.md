---
name: env-secrets-management
description: Define and wire environment variables/secrets across local, preview, prod; ensure nothing sensitive reaches the client bundle. Use for secrets/config work. Security-sensitive.
---
# Env & Secrets Management

Full spec: `research/skills.md` #31. Var names: CLAUDE.md §6.

## Procedure
1. Maintain `.env.example` with NAMES only (no values).
2. Set real values in platform secret stores (Supabase/Netlify/EAS/GitHub).
3. Only public (`EXPO_PUBLIC_*` / anon) keys may reach the client; service-role and webhook secrets stay server-side.
4. Never commit secrets; verify `.gitignore`.

## References
- https://supabase.com/docs/guides/functions/secrets
- https://docs.netlify.com/environment-variables/overview/
