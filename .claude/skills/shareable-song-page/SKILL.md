---
name: shareable-song-page
description: Build the public, login-free web page for a shared song (cover, player, lyrics, message) with rich OG preview, mobile-first, hosted on Netlify. This is the growth engine. Use for share-page work.
---
# Shareable Song Page  (growth engine)

Full spec: `research/skills.md` #18.

## Procedure
1. Route `/s/[slug]` fetches public data via `GET /public/songs/:slug` (only `is_public` songs).
2. Render cover, audio player, optional lyrics + personal message; mobile-first, responsive.
3. Add rich OG/social meta tags for link previews.
4. Fire `share_events` (view/play/download); offer download + re-share.
5. Serve audio from Supabase Storage CDN (not proxied through Netlify).

## References
- https://docs.expo.dev/guides/publishing-websites/
- https://docs.netlify.com/frameworks/next-js/overview/
