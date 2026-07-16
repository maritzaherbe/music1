---
name: product-analytics-instrumentation
description: Emit product events for the funnel and North Star — wizard step drop-off, generate, ready, select, share, download; power share_events and unit-economics dashboards. Use for analytics work.
---
# Product Analytics Instrumentation

Full spec: `research/skills.md` #37. North Star = songs shared/week (PRD §8).

## Procedure
1. Define a typed event taxonomy: wizard_step_completed, generate_started, song_ready, clip_selected, song_shared, share_viewed/played/downloaded.
2. Fire events from client flows + `share_events` on the public page.
3. Build funnel (activation, share rate) + unit-economics (cost_usd vs revenue per shared song) views.

## References
- https://posthog.com/docs/libraries/react-native
