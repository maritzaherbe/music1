---
name: guided-wizard-flow
description: Build the multi-step "Disney moment" creation wizard (occasion → recipient → story → mood → genre → language), ≤5 taps to Generate, no jargon. This is the core differentiator. Use for creation-flow work.
---
# Guided Wizard Flow  (core differentiator)

Full spec: `research/skills.md` #16. Read PRD §3.2 + CLAUDE.md §7 UX principles.

## Procedure
1. Model wizard state in Zustand; steps: occasion → recipient/relationship → 1–3 story details → mood → genre (friendly presets) → language.
2. Pre-fill from the chosen `occasion_template`; reach Generate in ≤5 taps.
3. Validate each step with React Hook Form + Zod.
4. Submit creates a draft `song`; server composes the provider prompt (never expose raw prompt syntax by default).
5. Warm, human copy; never make a non-musician feel dumb.

## Ask before
Major changes to the core flow.

## References
- https://react-hook-form.com/
- https://zustand.docs.pmnd.rs/
- https://docs.expo.dev/router/introduction/
