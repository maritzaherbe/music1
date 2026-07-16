---
name: reconciliation-poller
description: Safety-net background job that polls the provider for in-flight generations whose webhook never arrived, then completes them idempotently. Use for generation reliability.
---
# Reconciliation Poller

Full spec: `research/skills.md` #35.

## Procedure
1. Scheduled function queries `generations` where status IN ('queued','processing') older than a threshold (partial index).
2. Call the provider `getStatus`; if complete, run the same re-host + finalize path as the webhook (idempotent).
3. If failed, trigger refund via Payments.
4. No song stuck in 'generating'.

## References
- https://supabase.com/docs/guides/functions/schedule-functions
