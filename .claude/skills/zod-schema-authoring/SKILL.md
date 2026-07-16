---
name: zod-schema-authoring
description: Author shared Zod schemas (briefs, API request/response, webhook payloads) used by both client and Edge Functions as the single validation source of truth. Use when defining or changing data shapes.
---
# Zod Schema Authoring

Full spec: `research/skills.md` #22.

## Procedure
1. Define schemas in `packages/shared/` and infer TS types from them.
2. Cover: wizard brief, each API request/response (PRD §5), provider + Stripe webhook payloads.
3. Enforce PRD §4.5 rules (lengths, enums, slugs).
4. Import the same schemas in client hooks and Edge Functions.

## References
- https://zod.dev/
