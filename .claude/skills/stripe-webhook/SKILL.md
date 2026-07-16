---
name: stripe-webhook
description: Verify and process Stripe events (checkout.session.completed, refunds) and append purchase credits to the ledger idempotently. Use for Stripe webhook handling.
---
# Stripe Webhook

Full spec: `research/skills.md` #13.

## Procedure
1. Verify signature with `STRIPE_WEBHOOK_SECRET`.
2. Dedupe on `stripe_event_id` (unique in `credit_ledger`) and `webhook_events`.
3. On `checkout.session.completed`: insert a `purchase` grant row via `credit-ledger-ops`.
4. Handle refunds/disputes by inserting compensating rows.

## References
- https://docs.stripe.com/webhooks
