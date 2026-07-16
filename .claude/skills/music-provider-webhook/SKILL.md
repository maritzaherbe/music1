---
name: music-provider-webhook
description: Handle the provider completion/failure callback — verify signature, dedupe, trigger re-hosting, update status, refund on failure, emit Realtime. Use for the generation webhook. Reliability crux.
---
# Music Provider Webhook

Full spec: `research/skills.md` #10.

## Procedure
1. Verify webhook signature (`MUSIC_PROVIDER_WEBHOOK_SECRET`).
2. Upsert `webhook_events` on `(provider, external_id)`; if already processed → `200` no-op.
3. On success: run `audio-rehosting-pipeline` → write `song_clips` → set `generations`/`songs` status → emit Realtime "ready".
4. On failure: set failed status and tell Payments to refund (`credit-ledger-ops`).

## Rules
Idempotent always. NEVER mark a song ready before audio is re-hosted.

## References
- https://supabase.com/docs/guides/functions
- https://docs.sunoapi.org/
