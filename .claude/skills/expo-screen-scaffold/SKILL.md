---
name: expo-screen-scaffold
description: Scaffold Expo Router screens/routes (auth, home, create wizard, song detail, library, settings) with navigation and typed params. Use when adding a new screen or route.
---
# Expo Screen Scaffold

Full spec: `research/skills.md` #15.

## Procedure
1. Create the route file under `app/` (Expo Router file-based; e.g. `app/song/[id].tsx`).
2. Type the route params; add auth-gating where required.
3. Compose from `design-system-components`; wire navigation.

## References
- https://docs.expo.dev/router/introduction/
