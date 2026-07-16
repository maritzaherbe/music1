---
name: realtime-subscription-hook
description: Subscribe to Supabase Realtime for generation status ("your song is ready") pushed to the client, replacing tight polling. Use for live status UI.
---
# Realtime Subscription Hook

Full spec: `research/skills.md` #20.

## Procedure
1. `useSongStatus(songId)` subscribes to the org/song channel via `@supabase/supabase-js`.
2. Update cached song status on change; clean up on unmount.
3. Pairs with the server emit in `music-provider-webhook`; falls back to `tanstack-query-hooks` backoff polling.

## References
- https://supabase.com/docs/guides/realtime
