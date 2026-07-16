---
name: sentry-integration
description: Wire Sentry for client (Expo) and Edge Functions; capture async-pipeline failures and alert on anomalies. Use for error monitoring setup.
---
# Sentry Integration

Full spec: `research/skills.md` #36.

## Procedure
1. Add Sentry SDK to the Expo app and to Edge Functions (`SENTRY_DSN`).
2. Upload source maps in CI.
3. Alert rules on generation failure spikes, webhook errors, and payment errors.
4. Route alerts to the owning specialist agent/domain.

## References
- https://docs.sentry.io/platforms/react-native/
- https://docs.sentry.io/product/sentry-mcp/
