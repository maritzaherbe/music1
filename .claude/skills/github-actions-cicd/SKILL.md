---
name: github-actions-cicd
description: Build the CI/CD pipeline — typecheck + lint + tests → apply migrations to preview DB → deploy Edge Functions → Netlify preview; promote on merge. Use for CI/CD setup.
---
# GitHub Actions CI/CD

Full spec: `research/skills.md` #30.

## Procedure
1. PR workflow: typecheck + lint + unit/RLS/contract tests.
2. Apply Supabase migrations to a preview DB.
3. `supabase functions deploy`; trigger Netlify Deploy Preview.
4. On merge to main: promote to prod (gated by human approval for prod).

## References
- https://docs.github.com/en/actions
- https://github.com/github/github-mcp-server
