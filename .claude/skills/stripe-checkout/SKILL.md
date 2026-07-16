---
name: stripe-checkout
description: Create Stripe Checkout sessions for credit-pack purchases and return the checkout URL. Use for the buy-credits flow.
---
# Stripe Checkout

Full spec: `research/skills.md` #12.

## Procedure
1. Map `pack_id` → Stripe price.
2. Create a Checkout Session (mode=payment) with success/cancel URLs and org/user metadata.
3. Return `checkout_url` to the client.
4. Credits are granted only by the webhook (`stripe-webhook`), never here.

## Ask before
Changing pack pricing.

## References
- https://docs.stripe.com/checkout/quickstart
- https://docs.stripe.com/mcp
