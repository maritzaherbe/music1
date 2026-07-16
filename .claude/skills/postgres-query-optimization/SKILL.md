---
name: postgres-query-optimization
description: Design indexes and tune queries for common access patterns (library lists, in-flight generations, ledger) and verify with EXPLAIN ANALYZE. Use when a query is slow or a hot path needs an index.
---
# Postgres Query Optimization

Full spec: `research/skills.md` #5.

## Procedure
1. Identify the hot query and target latency (PRD §6.1).
2. `EXPLAIN ANALYZE` to see the plan.
3. Add the right index (composite `(org_id, created_at DESC)` for lists; partial `WHERE status IN ('queued','processing')` for the reconciliation poller).
4. Re-run EXPLAIN; confirm index use and improvement.

## References
- https://www.postgresql.org/docs/current/using-explain.html
- https://supabase.com/docs/guides/database/query-optimization
