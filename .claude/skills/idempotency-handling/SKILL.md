---
name: idempotency-handling
description: Provide reusable idempotency for money/generation mutations and inbound webhooks — Idempotency-Key handling + webhook_events dedupe. Use for any retry-sensitive operation.
---
# Idempotency Handling

Full spec: `research/skills.md` #33.

## Procedure
1. Mutations require an `Idempotency-Key`; store first result keyed by it and replay on retry.
2. Inbound webhooks dedupe on `webhook_events (provider, external_id)` unique constraint; duplicates → no-op.
3. Ledger writes dedupe on unique `stripe_event_id`.
4. Ensure all effects are safe to repeat.

## References
- https://docs.stripe.com/api/idempotent_requests
