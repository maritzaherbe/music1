---
name: eas-build-submit
description: Configure EAS Build + Submit for iOS/Android and EAS Update for OTA JS fixes; manage credentials and store metadata. Use for mobile build/release.
---
# EAS Build & Submit

Full spec: `research/skills.md` #28.

## Procedure
1. Write `eas.json` build profiles (dev/preview/production).
2. Configure bundle ids, credentials, store metadata.
3. `eas build` → `eas submit` for App Store / Play.
4. Set up `eas update` OTA channel for JS-only fixes.

## References
- https://docs.expo.dev/eas/
- https://docs.expo.dev/eas-update/introduction/
