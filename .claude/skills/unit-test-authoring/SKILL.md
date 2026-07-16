---
name: unit-test-authoring
description: Write unit tests for pure logic — credit math (reserve/refund/balance), prompt composition, moderation rules, validation. Use after implementing logic-heavy functions.
---
# Unit Test Authoring

Full spec: `research/skills.md` #23.

## Procedure
1. Use Vitest (or Jest). Target pure functions.
2. Prioritize credit math: reserve, refund, double-spend, never-negative balance.
3. Cover prompt composition and moderation denylist rules.
4. Include happy/edge/failure cases.

## References
- https://vitest.dev/
- https://jestjs.io/
