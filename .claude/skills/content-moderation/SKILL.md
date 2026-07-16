---
name: content-moderation
description: Screen creation input BEFORE spending credits (block real-artist impersonation, hate, sexual-minor, defamation, violence) and flag suspect output. Use in the generate path. Safety + legal red line.
---
# Content Moderation

Full spec: `research/skills.md` #14. Runs BEFORE credit reservation.

## Procedure
1. On input: run denylist + classifier check for impersonation of real artists/voices, hate, sexual-minor, defamation, violence.
2. Verdict `block` → no charge, clear non-preachy message, insert `moderation_flags` row. Verdict `review` → hold. `pass` → proceed to reserve+generate.
3. On output: optional secondary check; flag/hold suspicious results.

## Ask before
Relaxing any moderation rule. Real-artist voice cloning is a hard stop — never build it.

## References
- https://docs.anthropic.com/en/docs/build-with-claude
- https://docs.sunoapi.org/
