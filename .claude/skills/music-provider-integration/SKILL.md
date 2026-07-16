---
name: music-provider-integration
description: Implement the swappable ProviderAdapter interface and a concrete adapter (Suno reseller → official) for submit/model-selection. Use for any music-provider integration work. Keep all provider detail behind the interface.
---
# Music Provider Integration

Full spec: `research/skills.md` #9. Provider detail lives ONLY in `src/lib/providers/`.

## Procedure
1. Define/extend `ProviderAdapter` interface: `submit(prompt, opts) -> { providerTaskId }`, `getStatus(id)`, signature-verify helper.
2. Implement the concrete adapter (e.g., `SunoResellerProvider`) using REST + `MUSIC_PROVIDER_*` env.
3. Called only AFTER Payments reserves credits; store `provider_task_id` on `generations`.
4. Selection of provider via config so reseller→official is a swap, not a rewrite.

## Ask before
Swapping or adding a provider; changing model-version defaults.

## References
- https://docs.sunoapi.org/
