---
name: audio-player-component
description: Build the in-app audio player (play/pause/seek/scrub) with two-variant playback and select-favorite. Use for playback UI.
---
# Audio Player Component

Full spec: `research/skills.md` #17.

## Procedure
1. Use `expo-audio` for playback (play/pause/seek/scrub).
2. Support both clips of a generation; let the user select the favorite (persist `songs.selected_clip_id`).
3. Accessible controls (labels, keyboard on web).

## References
- https://docs.expo.dev/versions/latest/sdk/audio/
