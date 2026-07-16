---
name: api-contract-testing
description: Verify each endpoint conforms to the PRD §5 contract — status codes, error envelope, auth tiers, idempotency. Use after building or changing an endpoint.
---
# API Contract Testing

Full spec: `research/skills.md` #26.

## Procedure
1. For each endpoint, assert success + documented error status codes.
2. Assert the `{ error: { code, message } }` envelope shape.
3. Assert auth tiers (User/Admin/Public/Signed) reject correctly.
4. Assert idempotency: repeated mutation with same key = one effect.

## References
- https://supabase.com/docs/guides/functions/unit-test
