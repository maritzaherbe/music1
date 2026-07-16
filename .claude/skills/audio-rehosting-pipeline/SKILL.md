---
name: audio-rehosting-pipeline
description: Download provider-generated audio + cover art and re-host to Supabase Storage before a song is marked ready. Provider URLs are ephemeral — this is mandatory. Use in the webhook completion path.
---
# Audio Re-hosting Pipeline

Full spec: `research/skills.md` #11. MANDATORY — provider URLs expire.

## Procedure
1. Receive ephemeral provider media URLs (audio + cover) for each clip.
2. Download bytes; upload to the private `songs` Storage bucket under an org/song-scoped path.
3. Write `audio_storage_path` / `image_storage_path` to `song_clips`.
4. Only after all clips are stored may the song become `ready`.

## References
- https://supabase.com/docs/guides/storage
