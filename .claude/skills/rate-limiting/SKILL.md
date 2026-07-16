---
name: rate-limiting
description: Protect the wallet and respect provider limits — per-user in-flight cap + token-bucket rate limits (Upstash Redis), plus public-page IP limits. Use for abuse/cost protection.
---
# Rate Limiting

Full spec: `research/skills.md` #34.

## Procedure
1. DB-level guard from day one: cap concurrent in-flight generations per user (e.g., 5).
2. Token-bucket per-user/min via Upstash Redis at the Edge Function layer.
3. IP-based limits on public share pages + analytics.
4. Return 429 with a retry hint.

## References
- https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
