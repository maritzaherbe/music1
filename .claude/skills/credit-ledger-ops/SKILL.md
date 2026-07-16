---
name: credit-ledger-ops
description: Implement the append-only credit ledger — atomic reserve-before-spend, auto-refund on failure, derived balance, idempotency. Use for any credit/balance/refund logic. Money-critical.
---
# Credit Ledger Ops

Append-only ledger; correctness over cleverness. Full spec: `research/skills.md` #3.

## Rules
- Never mutate a row or stored balance. Refunds/grants are NEW rows.
- Reserve credits in the SAME transaction that inserts the `generations` row, BEFORE calling the provider.
- Auto-refund (new row) on generation failure.
- Idempotent: unique `stripe_event_id`; dedupe via `webhook_events`.
- `balance_after >= 0` enforced by CHECK.

## Procedure
1. On generate: `BEGIN` → check balance → insert reservation (delta negative) → insert generation → `COMMIT`. Fail closed if insufficient.
2. On failure webhook: insert refund row (delta positive, reason `generation_refund`).
3. On Stripe purchase: insert grant row keyed by `stripe_event_id`.

## Ask before
Any change to pricing/credit economics or refund policy.

## References
- https://supabase.com/docs/guides/database/functions
- https://www.postgresql.org/docs/current/tutorial-transactions.html
