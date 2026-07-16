# Skills Inventory — AI Music Creation App

**Date:** 2026-07-15
**Source:** Derived from [`PRD.md`](./PRD.md) (features §3, schema §4, API §5, NFRs §6, metrics §8) and [`tech-stack.md`](./tech-stack.md).
**Purpose:** The distinct, reusable **build skills** needed to develop this app, packaged as Claude Code [Skills](https://code.claude.com/docs/en/skills).

> **How these map to Claude Code Skills:** Each skill below would live at `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`). The **`description` drives auto-triggering** — Claude loads a skill when your prompt matches it — and any skill can be invoked directly with `/<skill-name>`. The skill *body* (procedure, references) loads only when used, so keep descriptions specific and action-oriented. Supporting files (templates, scripts) can sit alongside `SKILL.md`.
>
> **Scope note:** These are **development capabilities** (how we build the app), not runtime app features. "Be exhaustive" per the request — some listed skills are optional or fast-follow; priority/necessity is flagged.

---

## Master Index

| # | Skill | Category | Complexity | Necessity |
|---|---|---|---|---|
| 1 | `supabase-migration` | Database | Moderate | P0 |
| 2 | `rls-policy` | Database / AuthZ | Complex | P0 |
| 3 | `credit-ledger-ops` | Database (domain) | Complex | P0 |
| 4 | `db-seed-data` | Database | Simple | P0 |
| 5 | `postgres-query-optimization` | Database | Moderate | P1 |
| 6 | `supabase-auth-setup` | Auth | Moderate | P0 |
| 7 | `org-membership-authz` | AuthZ | Complex | P0 |
| 8 | `edge-function-scaffold` | Backend/API | Moderate | P0 |
| 9 | `music-provider-integration` | API integration | Complex | P0 |
| 10 | `music-provider-webhook` | API integration | Complex | P0 |
| 11 | `audio-rehosting-pipeline` | API integration / Storage | Moderate | P0 |
| 12 | `stripe-checkout` | API integration | Moderate | P0 |
| 13 | `stripe-webhook` | API integration | Moderate | P0 |
| 14 | `content-moderation` | API integration / Safety | Complex | P0 |
| 15 | `expo-screen-scaffold` | Frontend | Simple | P0 |
| 16 | `guided-wizard-flow` | Frontend (core) | Complex | P0 |
| 17 | `audio-player-component` | Frontend | Moderate | P0 |
| 18 | `shareable-song-page` | Frontend (web) | Moderate | P0 |
| 19 | `design-system-components` | Frontend | Moderate | P0 |
| 20 | `realtime-subscription-hook` | Frontend / Backend | Moderate | P0 |
| 21 | `tanstack-query-hooks` | Frontend | Moderate | P0 |
| 22 | `zod-schema-authoring` | Validation | Simple | P0 |
| 23 | `unit-test-authoring` | Testing | Moderate | P0 |
| 24 | `rls-isolation-testing` | Testing / Security | Complex | P0 |
| 25 | `e2e-test-authoring` | Testing | Complex | P1 |
| 26 | `api-contract-testing` | Testing | Moderate | P1 |
| 27 | `netlify-deploy-config` | Deployment | Simple | P0 |
| 28 | `eas-build-submit` | Deployment | Moderate | P0 |
| 29 | `supabase-provisioning` | Infrastructure | Moderate | P0 |
| 30 | `github-actions-cicd` | Infrastructure | Moderate | P1 |
| 31 | `env-secrets-management` | Infrastructure / Security | Simple | P0 |
| 32 | `structured-error-envelope` | Error handling | Simple | P0 |
| 33 | `idempotency-handling` | Error handling (cross-cutting) | Moderate | P0 |
| 34 | `rate-limiting` | Error handling / Infra | Moderate | P1 |
| 35 | `reconciliation-poller` | Error handling / reliability | Complex | P1 |
| 36 | `sentry-integration` | Logging/monitoring | Simple | P1 |
| 37 | `product-analytics-instrumentation` | Analytics | Moderate | P1 |
| 38 | `api-documentation` | Documentation | Simple | P1 |
| 39 | `adr-authoring` | Documentation | Simple | P2 |

**Legend:** P0 = MVP-critical · P1 = important/fast-follow · P2 = nice-to-have. Complexity: Simple / Moderate / Complex.

---

## Category A — Database Operations

### 1. `supabase-migration`
- **Description:** Author and apply versioned SQL migrations implementing the PRD §4 schema (tables, enums, constraints, indexes) via the Supabase CLI.
- **Input:** Target schema/table spec (PRD §4), migration intent (create/alter), existing migration history.
- **Output:** A timestamped SQL migration file in `supabase/migrations/`, applied to a preview/prod DB; updated schema.
- **Dependencies:** Supabase CLI, PostgreSQL. Depends on: `rls-policy` (policies ship with tables), `zod-schema-authoring` (keep types in sync).
- **Docs:** https://supabase.com/docs/guides/local-development · https://supabase.com/docs/guides/database/overview
- **Complexity:** Moderate.
- **Example invocation:** `/supabase-migration create the `songs` and `song_clips` tables per PRD §4.3 with constraints and indexes`.

### 2. `rls-policy`
- **Description:** Write and verify Row-Level Security policies enforcing multi-tenant isolation (`org_id ∈ my memberships`) and public read for shared songs.
- **Input:** Table name, tenancy rule, role requirements, public-exposure rules (PRD §4.1, §4.5, §6.2).
- **Output:** `CREATE POLICY` statements (in a migration); deny-by-default confirmed.
- **Dependencies:** PostgreSQL RLS, Supabase Auth (`auth.uid()`). Depends on: `supabase-migration`. Paired with: `rls-isolation-testing`.
- **Docs:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Complexity:** Complex (security-critical; easy to leak tenants).
- **Example invocation:** `/rls-policy add tenant-isolation + owner-only-delete policies to the `songs` table`.

### 3. `credit-ledger-ops`
- **Description:** Implement the append-only credit ledger: atomic **reserve-before-spend**, **auto-refund on failure**, derived balance, and Stripe/generation idempotency (PRD §3.6, §4.3, §4.5).
- **Input:** org_id, delta, reason, ref, idempotency key; current balance.
- **Output:** Transactional ledger insert(s) with `balance_after`; never a negative balance; refund rows on failure.
- **Dependencies:** PostgreSQL transactions, Supabase. Depends on: `supabase-migration`, `idempotency-handling`. Used by: `music-provider-integration`, `stripe-webhook`.
- **Docs:** https://supabase.com/docs/guides/database/functions · https://www.postgresql.org/docs/current/tutorial-transactions.html
- **Complexity:** Complex (money correctness; race conditions).
- **Example invocation:** `/credit-ledger-ops implement reserve+refund in the generate flow with an idempotency key`.

### 4. `db-seed-data`
- **Description:** Seed reference and test data — `occasion_templates`, credit-pack catalog, sample orgs/songs for local dev.
- **Input:** Seed definitions (occasions from PRD §3.2), environment target.
- **Output:** Idempotent seed SQL/script; populated local DB.
- **Dependencies:** Supabase CLI. Depends on: `supabase-migration`.
- **Docs:** https://supabase.com/docs/guides/local-development/seeding-your-database
- **Complexity:** Simple.
- **Example invocation:** `/db-seed-data seed the birthday/memorial/wedding/team-anthem occasion templates`.

### 5. `postgres-query-optimization`
- **Description:** Design indexes and tune queries for common access patterns (library lists, in-flight generations, ledger) per PRD §4.4; verify with `EXPLAIN ANALYZE`.
- **Input:** Query, table sizes, target latency (PRD §6.1).
- **Output:** Index DDL / rewritten queries; before/after plans.
- **Dependencies:** PostgreSQL. Depends on: `supabase-migration`.
- **Docs:** https://www.postgresql.org/docs/current/using-explain.html · https://supabase.com/docs/guides/database/query-optimization
- **Complexity:** Moderate.
- **Example invocation:** `/postgres-query-optimization add partial index for the reconciliation poller's in-flight query`.

---

## Category B — Authentication & Authorization

### 6. `supabase-auth-setup`
- **Description:** Configure Supabase Auth — email magic link, Google OAuth, **Apple Sign-In** (required for iOS), session persistence, and the signup trigger that creates personal org + profile + free credit grant.
- **Input:** OAuth provider credentials (env names), signup-side-effect spec (PRD §3.1).
- **Output:** Auth config + DB trigger/function; working sign-up/in/out on all platforms.
- **Dependencies:** Supabase Auth, `@supabase/supabase-js`, Apple/Google developer accounts. Depends on: `supabase-migration`, `env-secrets-management`.
- **Docs:** https://supabase.com/docs/guides/auth · https://supabase.com/docs/guides/auth/social-login/auth-apple
- **Complexity:** Moderate.
- **Example invocation:** `/supabase-auth-setup wire Apple + Google login and the create-personal-org signup trigger`.

### 7. `org-membership-authz`
- **Description:** Enforce organization-scoped authorization: resolve active org (`X-Org-Id`), verify membership, and check roles (owner/admin/member) in Edge Functions and RLS (PRD §4.1, §5.4).
- **Input:** JWT (user id), requested org, required role.
- **Output:** Authz guard/util used across endpoints; 403 on violation; reusable role check.
- **Dependencies:** Supabase Auth, PostgreSQL. Depends on: `rls-policy`, `edge-function-scaffold`.
- **Docs:** https://supabase.com/docs/guides/auth/managing-user-data · https://supabase.com/docs/guides/database/postgres/row-level-security
- **Complexity:** Complex (multi-tenant correctness).
- **Example invocation:** `/org-membership-authz add an admin-or-owner guard to the invite-member endpoint`.

---

## Category C — Backend / API Integration

### 8. `edge-function-scaffold`
- **Description:** Scaffold a Supabase Edge Function (Deno/TS) with the standard skeleton: JWT auth, org authz, Zod input validation, error envelope, and typed response.
- **Input:** Endpoint name, method, auth tier, request/response shape (PRD §5).
- **Output:** `supabase/functions/<name>/index.ts` following house conventions.
- **Dependencies:** Supabase Edge Functions (Deno), Zod. Depends on: `zod-schema-authoring`, `structured-error-envelope`, `org-membership-authz`.
- **Docs:** https://supabase.com/docs/guides/functions · https://deno.land/manual
- **Complexity:** Moderate.
- **Example invocation:** `/edge-function-scaffold create the `songs-generate` function (User auth, Idempotency-Key)`.

### 9. `music-provider-integration`
- **Description:** Implement the **provider-abstraction interface** and a concrete adapter (Suno reseller → official) for submit/model-selection; called after credit reservation. Swappable via config.
- **Input:** Composed prompt/lyrics, model version, provider config (base URL, key), song/generation ids.
- **Output:** `provider_task_id` stored on `generations`; standardized submit result; provider isolated behind an interface.
- **Dependencies:** `fetch`/HTTP; music provider REST API. Depends on: `credit-ledger-ops`, `edge-function-scaffold`, `structured-error-envelope`. Feeds: `music-provider-webhook`.
- **Docs:** https://docs.sunoapi.org/ (current reseller) · Suno official partner API (when available)
- **Complexity:** Complex (external, fragile, must stay swappable).
- **Example invocation:** `/music-provider-integration add a `SunoResellerProvider` implementing the ProviderAdapter interface`.

### 10. `music-provider-webhook`
- **Description:** Handle the provider completion/failure callback: verify signature, dedupe (idempotent), trigger audio re-hosting, update `generations`/`songs` status, refund on failure, emit Realtime event.
- **Input:** Signed provider webhook payload (`provider_task_id`, clips/URLs, status).
- **Output:** Updated status, stored clips, refund-on-fail, "ready" push. `200` no-op on duplicates.
- **Dependencies:** Supabase (DB, Realtime, Storage). Depends on: `audio-rehosting-pipeline`, `idempotency-handling`, `credit-ledger-ops`, `realtime-subscription-hook`.
- **Docs:** https://supabase.com/docs/guides/functions · https://docs.sunoapi.org/ (callbacks)
- **Complexity:** Complex (the reliability crux of the app).
- **Example invocation:** `/music-provider-webhook implement webhooks-provider with dedupe, re-host, and refund-on-fail`.

### 11. `audio-rehosting-pipeline`
- **Description:** Download provider-generated audio + cover art and **re-host to our Supabase Storage** before a song is marked `ready` (provider URLs are ephemeral — mandatory per PRD §3.3 / tech-stack §3.2).
- **Input:** Ephemeral provider media URLs, org/song/clip ids.
- **Output:** Files in our Storage bucket; `audio_storage_path`/`image_storage_path` written to `song_clips`.
- **Dependencies:** Supabase Storage. Depends on: `supabase-provisioning` (buckets). Used by: `music-provider-webhook`.
- **Docs:** https://supabase.com/docs/guides/storage
- **Complexity:** Moderate.
- **Example invocation:** `/audio-rehosting-pipeline download clip URLs to the songs bucket and persist paths`.

### 12. `stripe-checkout`
- **Description:** Create Stripe Checkout sessions for credit-pack purchases and return the checkout URL (PRD §3.6, §5.2).
- **Input:** pack_id, user/org, success/cancel URLs.
- **Output:** `checkout_url`; pending purchase reconciled by webhook.
- **Dependencies:** Stripe SDK. Depends on: `edge-function-scaffold`, `env-secrets-management`. Paired with: `stripe-webhook`.
- **Docs:** https://docs.stripe.com/checkout/quickstart · https://docs.stripe.com/mcp
- **Complexity:** Moderate.
- **Example invocation:** `/stripe-checkout implement billing-checkout for the credit packs`.

### 13. `stripe-webhook`
- **Description:** Verify and process Stripe events (`checkout.session.completed`, refunds) → append `purchase` credits to the ledger, idempotently.
- **Input:** Signed Stripe payload, signing secret.
- **Output:** Credit grant on confirmed payment; `stripe_event_id` dedupe; audit in `webhook_events`.
- **Dependencies:** Stripe SDK. Depends on: `credit-ledger-ops`, `idempotency-handling`.
- **Docs:** https://docs.stripe.com/webhooks
- **Complexity:** Moderate.
- **Example invocation:** `/stripe-webhook credit the org on checkout.session.completed`.

### 14. `content-moderation`
- **Description:** Screen creation input **before spending credits** (block real-artist impersonation, hate, sexual-minor, defamation, violence) and flag suspect output; log to `moderation_flags` (PRD §3.9, §6.2).
- **Input:** User brief/prompt (input) or generated result (output); policy rules.
- **Output:** `pass|review|block` verdict; user-safe message; no charge on blocked input; flag rows.
- **Dependencies:** Denylist + LLM/classifier (e.g., an Anthropic model or a moderation API). Depends on: `edge-function-scaffold`, `credit-ledger-ops` (gate before reserve).
- **Docs:** https://docs.anthropic.com/en/docs/build-with-claude (for classifier) · https://docs.sunoapi.org/ (provider limits)
- **Complexity:** Complex (safety + legal red line).
- **Example invocation:** `/content-moderation add pre-generation input screening that blocks celebrity-voice requests`.

---

## Category D — Frontend Component Generation

### 15. `expo-screen-scaffold`
- **Description:** Scaffold Expo Router screens/routes (auth, home, create wizard, song detail, library, settings) with navigation and typed params.
- **Input:** Route name, layout, params, auth-gating.
- **Output:** Route file(s) under `app/`; navigation wired.
- **Dependencies:** Expo, Expo Router. Depends on: `design-system-components`.
- **Docs:** https://docs.expo.dev/router/introduction/
- **Complexity:** Simple.
- **Example invocation:** `/expo-screen-scaffold create the `song/[id]` detail route`.

### 16. `guided-wizard-flow`  ★ core differentiator
- **Description:** Build the multi-step "Disney moment" creation wizard (occasion → recipient → story → mood → genre → language), ≤5 taps to Generate, no jargon; composes the provider prompt server-side.
- **Input:** Occasion templates, wizard state model, prompt-scaffold spec (PRD §3.2).
- **Output:** Wizard screens + Zustand state + submit that creates a draft song.
- **Dependencies:** Expo, React Hook Form, Zod, Zustand. Depends on: `design-system-components`, `tanstack-query-hooks`, `zod-schema-authoring`.
- **Docs:** https://react-hook-form.com/ · https://zustand.docs.pmnd.rs/ · https://docs.expo.dev/router/introduction/
- **Complexity:** Complex (this is where the product wins or loses).
- **Example invocation:** `/guided-wizard-flow build the occasion→story→vibe wizard with template defaults`.

### 17. `audio-player-component`
- **Description:** In-app audio player (play/pause/seek/scrub) with two-variant playback and "select favorite" (PRD §3.4).
- **Input:** Clip URLs/paths, selected clip id.
- **Output:** Reusable player component; selection persisted.
- **Dependencies:** `expo-audio`. Depends on: `design-system-components`, `tanstack-query-hooks`.
- **Docs:** https://docs.expo.dev/versions/latest/sdk/audio/
- **Complexity:** Moderate.
- **Example invocation:** `/audio-player-component build the two-clip player with variant selection`.

### 18. `shareable-song-page`  ★ growth engine
- **Description:** Public, login-free web page for a shared song (cover, player, lyrics, personal message) with rich OG/social preview and mobile-first layout; records view/play/download (PRD §3.7).
- **Input:** `share_slug`, public song data, OG metadata.
- **Output:** Netlify-hosted responsive page; analytics events fired.
- **Dependencies:** Expo web export or a small Next.js page; Netlify. Depends on: `netlify-deploy-config`, `share`/`product-analytics-instrumentation`, `rls-policy` (public view).
- **Docs:** https://docs.expo.dev/guides/publishing-websites/ · https://docs.netlify.com/frameworks/next-js/overview/
- **Complexity:** Moderate.
- **Example invocation:** `/shareable-song-page build the /s/[slug] public page with OG tags`.

### 19. `design-system-components`
- **Description:** Reusable NativeWind UI primitives (buttons, inputs, cards, sheets, loading/empty states) shared across mobile + web, theme + a11y aware.
- **Input:** Design tokens, component spec.
- **Output:** Component library in `src/components/`.
- **Dependencies:** NativeWind (Tailwind), React Native. Consider the `dataviz`/`artifact-design` skills for any charts/marketing.
- **Docs:** https://www.nativewind.dev/ · https://reactnative.dev/docs/components-and-apis
- **Complexity:** Moderate.
- **Example invocation:** `/design-system-components create Button, TextField, and EmptyState`.

### 20. `realtime-subscription-hook`
- **Description:** Subscribe to Supabase Realtime for generation status ("your song is ready") pushed to the client, replacing tight polling (PRD §3.3, §3.11).
- **Input:** org/song id, channel/table filter.
- **Output:** React hook that updates song status live; cleanup on unmount.
- **Dependencies:** Supabase Realtime, `@supabase/supabase-js`. Depends on: `rls-policy`. Pairs with server emit in `music-provider-webhook`.
- **Docs:** https://supabase.com/docs/guides/realtime
- **Complexity:** Moderate.
- **Example invocation:** `/realtime-subscription-hook add a useSongStatus(songId) realtime hook`.

### 21. `tanstack-query-hooks`
- **Description:** Standardized data hooks (queries/mutations) for songs, credits, generation — including **polling with exponential backoff** as the Realtime fallback.
- **Input:** Endpoint, query key, cache/poll policy.
- **Output:** Typed hooks (`useSongs`, `useGenerate`, `useCredits`) with loading/error/retry.
- **Dependencies:** TanStack Query. Depends on: `zod-schema-authoring`, `structured-error-envelope`.
- **Docs:** https://tanstack.com/query/latest
- **Complexity:** Moderate.
- **Example invocation:** `/tanstack-query-hooks add useGenerate mutation with backoff polling`.

---

## Category E — Testing & Validation

### 22. `zod-schema-authoring`
- **Description:** Author shared Zod schemas (briefs, API request/response, webhook payloads) used by both client and Edge Functions; the single validation source of truth (PRD §6.2).
- **Input:** Data shape + rules (PRD §4.5, §5).
- **Output:** Schemas in `packages/shared/`; inferred TS types.
- **Dependencies:** Zod. Consumed by nearly every backend/frontend skill.
- **Docs:** https://zod.dev/
- **Complexity:** Simple.
- **Example invocation:** `/zod-schema-authoring define GenerateRequest and ProviderWebhook schemas`.

### 23. `unit-test-authoring`
- **Description:** Unit tests for pure logic — credit math (reserve/refund/balance), prompt composition, moderation rules, validation.
- **Input:** Function under test, cases (happy/edge/failure).
- **Output:** Passing test suite (Vitest/Jest).
- **Dependencies:** Vitest or Jest. Depends on: `credit-ledger-ops`, `zod-schema-authoring`.
- **Docs:** https://vitest.dev/ · https://jestjs.io/
- **Complexity:** Moderate.
- **Example invocation:** `/unit-test-authoring cover credit reserve/refund edge cases including double-spend`.

### 24. `rls-isolation-testing`  ★ security
- **Description:** Automated tests proving **no cross-tenant access** — a user in org A cannot read/write org B's songs, clips, or ledger.
- **Input:** Two test orgs/users, each RLS-protected table.
- **Output:** Test suite asserting deny-by-default; runs in CI.
- **Dependencies:** Supabase test client, Vitest/Jest. Depends on: `rls-policy`, `db-seed-data`.
- **Docs:** https://supabase.com/docs/guides/database/postgres/row-level-security · https://supabase.com/docs/guides/local-development/testing/overview
- **Complexity:** Complex.
- **Example invocation:** `/rls-isolation-testing assert org A cannot read org B's credit_ledger`.

### 25. `e2e-test-authoring`
- **Description:** End-to-end tests of critical flows — signup → create → generate (mocked provider) → play → share — on mobile (Maestro/Detox) and web (Playwright).
- **Input:** Flow spec, test env, provider mock.
- **Output:** E2E suite for the golden path + failure/refund path.
- **Dependencies:** Maestro or Detox; Playwright. Depends on: most P0 feature skills.
- **Docs:** https://maestro.mobile.dev/ · https://playwright.dev/
- **Complexity:** Complex.
- **Example invocation:** `/e2e-test-authoring script the create→generate→share golden path with a mocked provider`.

### 26. `api-contract-testing`
- **Description:** Verify each endpoint conforms to the PRD §5 contract (status codes, error envelope, auth tiers, idempotency).
- **Input:** Endpoint spec, request fixtures.
- **Output:** Contract test suite; catches drift.
- **Dependencies:** Vitest + supertest-style HTTP, or Supabase function test harness. Depends on: `edge-function-scaffold`, `zod-schema-authoring`.
- **Docs:** https://supabase.com/docs/guides/functions/unit-test
- **Complexity:** Moderate.
- **Example invocation:** `/api-contract-testing assert /songs/:id/generate returns 409 on insufficient credits`.

---

## Category F — Deployment & Infrastructure

### 27. `netlify-deploy-config`
- **Description:** Configure Netlify (`netlify.toml`, build command, redirects, deploy previews) for the web app / share pages. **Web host is Netlify — not Vercel/Cloudflare.**
- **Input:** Build settings, env var names, redirect rules.
- **Output:** `netlify.toml`; working preview + prod deploys.
- **Dependencies:** Netlify. Depends on: `env-secrets-management`.
- **Docs:** https://docs.netlify.com/ · https://docs.netlify.com/welcome/build-with-ai/netlify-mcp-server/
- **Complexity:** Simple.
- **Example invocation:** `/netlify-deploy-config set up the Expo web export deploy with previews`.

### 28. `eas-build-submit`
- **Description:** Configure EAS Build + Submit for iOS/Android, plus EAS Update for OTA JS fixes; manage credentials and store metadata.
- **Input:** `eas.json`, bundle ids, store credentials, build profiles.
- **Output:** Store-ready builds; OTA channel.
- **Dependencies:** Expo EAS; Apple Developer ($99/yr), Google Play ($25). Depends on: `supabase-auth-setup` (Apple Sign-In requirement).
- **Docs:** https://docs.expo.dev/eas/ · https://docs.expo.dev/eas-update/introduction/
- **Complexity:** Moderate.
- **Example invocation:** `/eas-build-submit configure production build profiles and OTA updates`.

### 29. `supabase-provisioning`
- **Description:** Provision the Supabase project: databases, **Storage buckets (private audio + public shared)**, Realtime config, function deploys, environment wiring.
- **Input:** Project settings, bucket policies, function list.
- **Output:** Provisioned project; buckets with correct visibility; deployed functions.
- **Dependencies:** Supabase CLI/dashboard. Depends on: `env-secrets-management`. Enables: `audio-rehosting-pipeline`.
- **Docs:** https://supabase.com/docs/guides/getting-started · https://supabase.com/docs/guides/storage/security/access-control
- **Complexity:** Moderate.
- **Example invocation:** `/supabase-provisioning create private `songs` bucket and public `shared` bucket`.

### 30. `github-actions-cicd`
- **Description:** CI/CD pipeline: typecheck + lint + tests → apply migrations to preview DB → deploy Edge Functions → Netlify preview; promote on merge (PRD/tech-stack §4.2).
- **Input:** Workflow steps, secrets, environments.
- **Output:** `.github/workflows/*.yml`; green pipeline.
- **Dependencies:** GitHub Actions, Supabase CLI, Netlify CLI. Depends on: `env-secrets-management`, `unit-test-authoring`, `rls-isolation-testing`.
- **Docs:** https://docs.github.com/en/actions · https://github.com/github/github-mcp-server
- **Complexity:** Moderate.
- **Example invocation:** `/github-actions-cicd add the PR pipeline with migration + function deploy`.

### 31. `env-secrets-management`
- **Description:** Define and wire environment variables/secrets across local, preview, prod (names in CLAUDE.md §6); ensure nothing sensitive reaches the client bundle.
- **Input:** Required var names, per-environment values (out-of-band).
- **Output:** `.env.example`, configured secrets in Supabase/Netlify/EAS/GitHub; no secrets in git.
- **Dependencies:** Platform secret stores. Cross-cutting.
- **Docs:** https://supabase.com/docs/guides/functions/secrets · https://docs.netlify.com/environment-variables/overview/
- **Complexity:** Simple (but security-sensitive).
- **Example invocation:** `/env-secrets-management scaffold .env.example and document all required keys`.

---

## Category G — Error Handling & Logging

### 32. `structured-error-envelope`
- **Description:** Standard error response shape `{ error: { code, message } }` + a shared error-code registry, used by every endpoint and client hook (PRD §5.1).
- **Input:** Error condition/domain.
- **Output:** Error util + typed codes; consistent client handling.
- **Dependencies:** None (foundational). Consumed everywhere.
- **Docs:** https://supabase.com/docs/guides/functions (response handling)
- **Complexity:** Simple.
- **Example invocation:** `/structured-error-envelope add the error codes for insufficient_credits and moderation_blocked`.

### 33. `idempotency-handling`
- **Description:** Reusable idempotency for money/generation mutations and inbound webhooks — `Idempotency-Key` handling + `webhook_events` dedupe (PRD §4.3, §5.2, §6.2).
- **Input:** Request/webhook id, operation.
- **Output:** Middleware/util that makes retries safe; duplicate → no-op.
- **Dependencies:** PostgreSQL (unique constraints). Used by: `credit-ledger-ops`, `stripe-webhook`, `music-provider-webhook`.
- **Docs:** https://docs.stripe.com/api/idempotent_requests
- **Complexity:** Moderate.
- **Example invocation:** `/idempotency-handling add a dedupe wrapper for the provider webhook`.

### 34. `rate-limiting`
- **Description:** Protect the wallet and respect provider limits: per-user in-flight cap + token-bucket rate limits (Upstash Redis), plus public-page IP limits (PRD §5.5).
- **Input:** Limit policy per endpoint, identity key.
- **Output:** Rate-limit middleware; 429s with retry hints.
- **Dependencies:** Upstash Redis. Depends on: `edge-function-scaffold`.
- **Docs:** https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- **Complexity:** Moderate.
- **Example invocation:** `/rate-limiting cap concurrent generations at 5 per user`.

### 35. `reconciliation-poller`
- **Description:** Safety-net background job that polls the provider for in-flight generations whose webhook never arrived, then completes them idempotently (PRD §3.3, §6.2).
- **Input:** In-flight `generations` (partial index), provider status API.
- **Output:** Recovered songs; no stuck "generating" states.
- **Dependencies:** Supabase scheduled function / cron, provider status endpoint. Depends on: `music-provider-integration`, `idempotency-handling`.
- **Docs:** https://supabase.com/docs/guides/functions/schedule-functions
- **Complexity:** Complex.
- **Example invocation:** `/reconciliation-poller add a cron that recovers generations stuck >5min`.

### 36. `sentry-integration`
- **Description:** Wire Sentry for client (Expo) and Edge Functions; capture the async-pipeline failures and alert on anomalies (PRD §6.2, §8.4).
- **Input:** DSN (env), environments, alert rules.
- **Output:** Error reporting + source maps + alerts.
- **Dependencies:** Sentry SDKs. Depends on: `env-secrets-management`.
- **Docs:** https://docs.sentry.io/platforms/react-native/ · https://docs.sentry.io/product/sentry-mcp/
- **Complexity:** Simple.
- **Example invocation:** `/sentry-integration add Sentry to the Expo app and the generate function`.

---

## Category H — Analytics & Documentation

### 37. `product-analytics-instrumentation`
- **Description:** Emit product events for the funnel and North Star — wizard step drop-off, generate, ready, select, share, download; power `share_events` and unit-economics dashboards (PRD §8).
- **Input:** Event taxonomy, properties.
- **Output:** Typed analytics client + events wired into flows.
- **Dependencies:** An analytics SDK (e.g., PostHog) + Supabase `share_events`. Depends on: `tanstack-query-hooks`, `shareable-song-page`.
- **Docs:** https://posthog.com/docs/libraries/react-native
- **Complexity:** Moderate.
- **Example invocation:** `/product-analytics-instrumentation track wizard step completion and share events`.

### 38. `api-documentation`
- **Description:** Generate/maintain the API reference from the PRD §5 spec (endpoints, payloads, auth, errors) for developer onboarding.
- **Input:** Endpoint definitions, schemas.
- **Output:** `docs/api.md` (or OpenAPI); kept in sync with contracts.
- **Dependencies:** Optional OpenAPI tooling. Depends on: `zod-schema-authoring` (source of truth).
- **Docs:** https://swagger.io/specification/
- **Complexity:** Simple.
- **Example invocation:** `/api-documentation generate the reference for all /songs endpoints`.

### 39. `adr-authoring`
- **Description:** Record architecture decisions (provider abstraction, tenancy model, credits design) as lightweight ADRs so rationale survives.
- **Input:** Decision, context, alternatives, consequence.
- **Output:** `docs/adr/NNNN-*.md`.
- **Dependencies:** None.
- **Docs:** https://adr.github.io/
- **Complexity:** Simple.
- **Example invocation:** `/adr-authoring record the decision to keep the provider behind an interface`.

---

## Skills We Deliberately Do NOT Need (MVP)

Called out per the "identify what we don't need" instruction — these are tempting but out of scope (see PRD §7):

- **ML / model training / fine-tuning / DSP** — generation is a commodity API; we never train models.
- **Audio editing / stem separation / MIDI export** — that's Suno Studio's domain, not ours.
- **Voice-cloning / TTS-of-real-people** — hard legal red line; actively blocked, never built.
- **GraphQL schema/resolver skills** — we use REST + Supabase SDK (PRD §5, tech-stack §2.2).
- **Kubernetes / Docker / self-managed infra / Terraform** — managed PaaS (Supabase/Netlify/EAS); no ops layer.
- **Redux/state-machine libraries** — Zustand + TanStack Query suffice.
- **Multi-region / sharding / data-warehouse skills** — premature at MVP scale.
- **Social-graph / discovery-feed skills** — no public feed in MVP.
- **Localization/i18n of the app UI** — English-first UI (song *lyrics* can be multilingual, but that's a provider param, not an i18n skill).
- **Push-notification skill** — deferred to P1 (Realtime in-app only at launch).

---

## Build-Order Dependency Notes

Rough critical path (foundational → feature → polish):

1. **Foundation:** `env-secrets-management` → `supabase-provisioning` → `supabase-migration` → `rls-policy` → `zod-schema-authoring` → `structured-error-envelope`.
2. **Auth & tenancy:** `supabase-auth-setup` → `org-membership-authz` → `rls-isolation-testing`.
3. **Money & generation core:** `credit-ledger-ops` + `idempotency-handling` → `edge-function-scaffold` → `music-provider-integration` → `music-provider-webhook` → `audio-rehosting-pipeline` → `content-moderation`.
4. **Payments:** `stripe-checkout` → `stripe-webhook`.
5. **Frontend:** `design-system-components` → `expo-screen-scaffold` → `tanstack-query-hooks` + `realtime-subscription-hook` → `guided-wizard-flow` → `audio-player-component` → `shareable-song-page`.
6. **Reliability & ship:** `rate-limiting`, `reconciliation-poller`, `sentry-integration`, `netlify-deploy-config`, `eas-build-submit`, `github-actions-cicd`.
7. **Measure & document:** `product-analytics-instrumentation`, `api-documentation`, `adr-authoring`.

> The three skills most worth investing extra care in (they carry the most risk from the viability/PRD analysis): **`credit-ledger-ops`** (money correctness), **`music-provider-webhook` + `audio-rehosting-pipeline`** (the async reliability crux), and **`rls-policy` + `rls-isolation-testing`** (multi-tenant data safety).
