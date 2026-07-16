---
name: e2e-test-authoring
description: Write end-to-end tests of critical flows — signup → create → generate (mocked provider) → play → share — on mobile (Maestro/Detox) and web (Playwright). Use for golden-path and failure-path coverage.
---
# E2E Test Authoring

Full spec: `research/skills.md` #25.

## Procedure
1. Mock the music provider (never hit the paid API).
2. Script the golden path: signup → wizard → generate → webhook → play → share.
3. Script the failure→refund path (provider returns failure; assert credits refunded).
4. Web via Playwright; mobile via Maestro/Detox.

## References
- https://maestro.mobile.dev/
- https://playwright.dev/
