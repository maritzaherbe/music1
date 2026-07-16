# Tech Stack Recommendation: AI Music Creation App

**Prepared:** 2026-07-15
**Companion to:** [`viability-analysis.md`](./viability-analysis.md)
**Design goal:** Ship a validation MVP that tests the *experience* (the "Disney moment"), cheaply and quickly, on a stack that scales to a real business without a rewrite — while staying **under $50/month** in fixed hosting until revenue.

---

## 0. TL;DR — The Recommended Stack

| Layer | Choice | Why (one line) |
|---|---|---|
| **Frontend** | **React Native + Expo** (TypeScript), Expo Router, web export | One codebase → iOS + Android + web; matches your React Native preference; unlocks app-store distribution which the viability doc flags as your competitor's channel. |
| **Server state / async jobs** | **TanStack Query** | Polling music-generation jobs is the core client challenge; this is purpose-built for it. |
| **Client state** | **Zustand** (light) | Minimal global state; the server is the source of truth. |
| **Backend** | **TypeScript on Supabase Edge Functions** (Deno) for MVP; graduate hot paths to a **Hono/Node service on Railway** | End-to-end TypeScript; no always-on server to pay for at MVP; clean escape hatch when you outgrow it. |
| **API style** | **REST** for the music provider + your public endpoints; **Supabase client SDK (RLS)** for direct reads; consider **tRPC** if you want typed calls later | Pragmatic, no premature GraphQL. |
| **Auth** | **Supabase Auth** | Email/OAuth/magic-link, integrates with Postgres Row-Level Security for free. |
| **Database** | **Supabase (Postgres)** | Managed, great DX, official MCP server, generous free tier. |
| **File storage** | **Supabase Storage** (must re-host generated audio — see §3.2) | Reseller audio URLs expire; you must own the files. |
| **Payments** | **Stripe** (credits model) | Official MCP server; the variable-cost model in the viability doc *requires* metered credits. |
| **Hosting** | **Supabase** (backend/db) + **Netlify** (web) + **EAS** (mobile builds) | All have free/cheap tiers and official MCP servers. |
| **Errors/monitoring** | **Sentry** | Official MCP server; free tier fine for MVP. |
| **MVP fixed cost** | **$0–25/month** | Comfortably under budget. **Note:** music-generation API is a *variable* cost that dwarfs hosting at scale — see §4.3. |

**The single most important architectural fact:** music generation is **asynchronous and variable-cost**. Everything below is shaped by the `submit → poll/webhook → re-host audio → notify user` pipeline and the fact that *every generation costs you real money*. This is not a CRUD app.

---

## 1. Frontend Recommendation

### 1.1 Framework: React Native + Expo (managed workflow), TypeScript

**Choice:** [**Expo**](https://docs.expo.dev/) on top of [**React Native**](https://reactnative.dev/), written in TypeScript, with [**Expo Router**](https://docs.expo.dev/router/introduction/) for file-based navigation.

**Justification:**
- **One codebase, three targets.** Expo compiles to **iOS, Android, and web** (`react-native-web`). The viability doc's core competitive finding was that Suno's own iOS/Android app is your rival's front door — so you need to be *in the app stores*, not just on the web. Expo is the fastest credible path to all three from a single React codebase, and it matches your stated React/React Native preference directly.
- **Managed build & release via [EAS](https://docs.expo.dev/eas/).** Over-the-air updates, cloud builds, and store submission without maintaining native toolchains — critical for a small team validating quickly.
- **Modern Expo is production-grade.** (You'll see stale forum claims that "Expo isn't for production"; that hasn't been true for years — the prebuild/dev-client workflow supports any native module you need.)

**Trade-off considered:** If you were web-only, plain **[Next.js](https://nextjs.org/docs)** (React) would be simpler. But your requirement is cross-platform, and the viability analysis makes mobile distribution strategically important, so Expo wins. You still get a web build for free for shareable song pages (§1.2).

### 1.2 Key libraries for *our specific* features

| Feature (from viability doc) | Library | Docs |
|---|---|---|
| **Audio playback** (play the generated song) | `expo-audio` (the current audio API; replaces `expo-av`) | https://docs.expo.dev/versions/latest/sdk/audio/ |
| **Polling generation jobs / server cache** | TanStack Query (`@tanstack/react-query`) | https://tanstack.com/query/latest |
| **Guided "Disney moment" input flow / forms** | React Hook Form + Zod (validation) | https://react-hook-form.com/ · https://zod.dev/ |
| **Styling (shared with web)** | NativeWind (Tailwind for RN) | https://www.nativewind.dev/ |
| **Navigation** | Expo Router | https://docs.expo.dev/router/introduction/ |
| **Auth + DB client** | `@supabase/supabase-js` | https://supabase.com/docs/reference/javascript |
| **Realtime job status (push, not poll)** | Supabase Realtime | https://supabase.com/docs/guides/realtime |
| **Shareable song page (keepsake / gifting)** | Web export or a small Next.js page on Vercel | https://docs.expo.dev/guides/publishing-websites/ |
| **Payments UI** | `@stripe/stripe-react-native` | https://github.com/stripe/stripe-react-native |

> **Design note:** For job status, prefer **Supabase Realtime subscriptions** (server pushes "your song is ready") over tight polling. Fall back to **TanStack Query polling with exponential backoff** where Realtime isn't wired up. The viability doc explicitly warns that hammering a status endpoint gets you rate-limited.

### 1.3 State management approach

**Recommendation: keep client state tiny; make the server the source of truth.**
- **Server/async state → TanStack Query.** Generation jobs, song lists, credit balance — all remote data with loading/error/refetch semantics. This is 80% of your "state."
- **Global UI state → [Zustand](https://zustand.docs.pmnd.rs/).** Current draft prompt, playback state, onboarding step. Small, unopinionated, no boilerplate.
- **Do NOT reach for Redux.** There's no complex client-side domain logic here to justify it. The complexity lives in the async pipeline, which Query handles.

---

## 2. Backend Recommendation

### 2.1 Runtime & framework — and the Node-vs-Python decision

**Your question was Node vs Python "depending on library support." For this project, Node/TypeScript wins — clearly.**

The music provider is a **plain REST API** (submit, poll, webhook). There is **no Python-specific advantage** here — you are not doing model training, DSP, or numerical work; you're orchestrating HTTP calls, webhooks, storage, and payments. Given a React/React Native frontend, **end-to-end TypeScript** is the higher-leverage choice: shared types, shared validation (Zod), one language, one mental model, and it lines up with the strongest MCP tooling.

**Recommended shape (two phases, no rewrite):**

1. **MVP → [Supabase Edge Functions](https://supabase.com/docs/guides/functions)** (Deno/TypeScript). Handles: `POST /generate` (auth check → reserve credits → call provider), `POST /webhooks/provider` (receive completion callback → download & re-host audio → update DB → notify), `POST /webhooks/stripe`. **No always-on server = no idle hosting cost.**
2. **Growth → standalone [Hono](https://hono.dev/) or [Fastify](https://fastify.dev/) service on [Railway](https://docs.railway.app/)** when you need long-running workers, a real job queue, or heavier orchestration. Hono runs on Deno/Node/edge, so code moves over with minimal friction.

**If you strongly prefer Python** (e.g., team familiarity), use **[FastAPI](https://fastapi.tiangolo.com/)** on Railway/Render — it's excellent. You'd trade away end-to-end type sharing and the tightest MCP/Edge-Function integration. My recommendation is TypeScript, but this is a reasonable second choice, *not* a mistake.

### 2.2 API architecture: REST (+ optional tRPC later)

- **REST** for: the music provider (it's REST — you don't choose), your webhooks, and your own public endpoints. Simple, cacheable, universally understood.
- **Supabase auto-generated REST + client SDK** for straightforward reads/writes, protected by **Row-Level Security** — this removes a huge amount of boilerplate CRUD.
- **Skip GraphQL.** Your data graph is small; GraphQL is overhead you don't need at this stage.
- **Optional: [tRPC](https://trpc.io/)** later if you want fully typed client↔server calls across your TS monorepo. Nice-to-have, not day-one.

### 2.3 Authentication strategy

**[Supabase Auth](https://supabase.com/docs/guides/auth):**
- Email/password, magic links, and OAuth (Apple + Google — **Apple sign-in is effectively mandatory for iOS App Store approval** when you offer social login).
- Issues JWTs that flow straight into **Postgres Row-Level Security**, so authorization lives next to the data ("a user can only read their own songs and credit ledger") instead of being re-implemented in app code.
- One less vendor than bolting on Auth0/Clerk, and it's included in the tier you're already paying for.

---

## 3. Database Recommendation

### 3.1 Primary database: Supabase (PostgreSQL)

**Choice: [Supabase](https://supabase.com/docs) — managed Postgres.**

Why Postgres/Supabase over your other candidates (Firebase, MongoDB Atlas):
- **Relational data with a money ledger.** You have users → songs → generations, plus a **credits/transactions ledger** (the viability doc's variable-cost model demands accurate metering). Money + relations = you want **SQL, transactions, and constraints**, which favors Postgres over Firestore/Mongo's document model.
- **Best-in-class DX + official MCP server** (see §5) — Claude Code can read your real schema and write migrations against it.
- **Batteries included:** Auth, Storage, Realtime, Edge Functions in one product = fewer moving parts on a tiny budget.
- **[Firebase](https://firebase.google.com/docs)** is a strong alternative (great mobile SDKs, also has an official MCP server) but pushes you toward NoSQL and vendor lock-in; a financial ledger is awkward in Firestore. **[MongoDB Atlas](https://www.mongodb.com/docs/atlas/)** is fine but you don't have document-shaped or scale problems that justify leaving relational.

**Schema approach (starter):**

```
users            (id, auth_id, email, display_name, created_at)
credit_ledger    (id, user_id, delta, reason, stripe_event_id, balance_after, created_at)  -- append-only
songs            (id, user_id, title, occasion, status, share_slug, created_at)
generations      (id, song_id, provider, provider_task_id, model_version,
                  prompt, lyrics, status[queued|processing|complete|failed],
                  audio_storage_path, duration_s, cost_usd, created_at, completed_at)
moderation_flags (id, generation_id, type, verdict, detail, created_at)
```

- **Migrations:** version-controlled SQL via the [Supabase CLI](https://supabase.com/docs/guides/local-development) (`supabase migration new/up`). Never click-edit prod schema.
- **`credit_ledger` is append-only** (event-sourced balance) — never mutate balances in place; derive from the ledger. This keeps billing auditable and refund-safe.
- Enforce **Row-Level Security** on every user-owned table.

### 3.2 Secondary data stores

- **Object storage → [Supabase Storage](https://supabase.com/docs/guides/storage) (REQUIRED, not optional).** The viability doc found that reseller/provider **audio URLs are ephemeral and can expire or disappear**. On webhook completion you must **download the generated audio and re-host it in your own bucket**, then serve your URL. Skipping this = users' songs silently 404 later. This is the #1 backend correctness requirement.
- **Cache / rate-limit → [Upstash Redis](https://upstash.com/docs/redis) (add only when needed).** Serverless Redis, pay-per-request, free tier. Use it for provider-side rate-limit backoff coordination and idempotency keys once you have concurrency. Not needed on day one.
- **Search → none for MVP.** Postgres full-text search covers "find my songs." Add [Meilisearch/Typesense](https://www.meilisearch.com/docs) only if discovery/browse becomes a feature.

### 3.3 Backup & migration strategy

- **Backups:** Supabase Pro includes **daily automated backups** (with Point-in-Time Recovery as a paid add-on). On the free tier, schedule your own `pg_dump` to storage. Docs: https://supabase.com/docs/guides/platform/backups
- **Audio durability:** your Storage bucket *is* your source of truth for delivered songs — enable versioning/retention and treat it as production data.
- **Migrations:** all schema changes as CLI migration files in git, applied in CI before deploy (§4.2). Test against a branch/preview database first.

---

## 4. Infrastructure & Hosting

### 4.1 Deployment platform

| Component | Platform | Docs |
|---|---|---|
| Backend + DB + Auth + Storage + Edge Functions | **Supabase** | https://supabase.com/docs |
| Web app (shareable song pages, marketing) | **Netlify** | https://docs.netlify.com/ |
| Mobile builds & OTA updates | **Expo EAS** | https://docs.expo.dev/eas/ |
| Standalone Node service (growth phase only) | **Railway** *or* **Render** | https://docs.railway.app/ · https://render.com/docs |
| Error monitoring | **Sentry** | https://docs.sentry.io/ |

**Why this composition (and a caveat):** There's a fair critique that "Netlify + Supabase + Stripe" is a *composed* stack rather than one unified cloud. For a solo/small team validating an experience, that composition is the right call — each piece has a generous free tier, great DX, and an official MCP server, and you avoid AWS's operational tax. Revisit consolidation only if integration overhead becomes real pain (§6.2). **Netlify** hosts your web app well: it has first-class support for **Expo web exports** (static/SPA) and, if you build the shareable song pages in Next.js, a dedicated [Next.js runtime](https://docs.netlify.com/frameworks/next-js/overview/). Deploy previews, atomic deploys, and edge CDN come standard.

### 4.2 CI/CD

- **[GitHub](https://docs.github.com/en/actions) + GitHub Actions** (official MCP server too).
- Pipeline: PR → typecheck + lint + tests → **apply Supabase migrations to a preview DB** → deploy Edge Functions (`supabase functions deploy`) → **Netlify Deploy Preview** (automatic per-PR) → on merge to `main`, Netlify promotes to prod.
- Netlify's Git integration handles web deploys natively (connect the repo, deploy on push); use GitHub Actions for the Supabase/Edge-Function/mobile steps Netlify doesn't own.
- Mobile: **EAS Build + EAS Submit** for store releases; **EAS Update** for JS-only OTA fixes (ship bug fixes without a store review).

### 4.3 Estimated monthly costs — **fixed hosting vs. variable API cost**

**⚠️ Read this first:** Your dominant cost is **not hosting — it's the music-generation API**, which is *per-song and variable*. The viability doc pegged realistic provider cost at **~$0.20–0.50 per satisfied song** (2 variations/request + regenerations). Fixed hosting stays trivial; the generation bill scales with usage. Metered **credits (Stripe)** must cover it — never offer truly "unlimited" free generation.

**Fixed hosting (what your $50 budget covers):**

| Stage | Supabase | Web host (Netlify) | EAS | Sentry | **Fixed total** |
|---|---|---|---|---|---|
| **MVP / pre-launch** | Free ($0) | Free ($0) | Free tier / ($0) | Free ($0) | **$0** |
| **~1k users** | Pro **$25** | Free–$19 | Free–$0 | Free | **$25–44** ✅ under $50 |
| **~10k users** | Pro $25 + usage (storage/egress/compute) ≈ **$45–90** | $19 + bandwidth | ~$0–19 | $0–26 | **~$70–150** |

- **Netlify free tier** includes ~100 GB bandwidth and 300 build minutes/month — ample for MVP. Pro is **$19/member/month**. Watch **bandwidth** as your web-hosted shareable song pages get traffic; heavy audio egress should be served from Supabase Storage's CDN, not proxied through Netlify.

- **Free tier reality (Supabase):** ~500 MB Postgres, 1 GB file storage, 50k monthly active users on auth, plus Edge Function invocations. Fine for MVP; you'll hit **storage** first because you're re-hosting audio (each ~3-min song ≈ 3–7 MB) — plan the Pro upgrade around audio volume, not user count.
- **Apple/Google:** Apple Developer **$99/year**, Google Play **$25 one-time** — required for store distribution, separate from hosting.

**Variable generation cost (illustrative — the real number to watch):**

| Stage | Songs/mo (est.) | Provider cost @ ~$0.30/song | Notes |
|---|---|---|---|
| MVP | 500 | **~$150** | Cover with a free-credit cap + paid credits. |
| 1k users | ~5,000 | **~$1,500** | Must be revenue-backed via Stripe credits. |
| 10k users | ~50,000 | **~$15,000** | Unit economics decide viability, not hosting. |

**Takeaway:** You will stay under $50/month in *fixed* hosting through ~1k users. The number that makes or breaks the business is **price-per-credit vs. cost-per-generation** — design the credit pack margins before launch (ties directly to the viability doc's unit-economics warning).

---

## 5. MCP Server Availability

You asked to prioritize services with MCP servers for Claude Code. **This stack was deliberately chosen so nearly every layer has an official one.** (In 2026, public directories index ~100+ MCP servers; the ones below are first-party/official.)

| Component | Official MCP server? | What it enables in your dev workflow | Link |
|---|---|---|---|
| **Supabase** | ✅ Official | Claude Code reads your **real schema**, writes/reviews migrations, runs queries, inspects data — no guessing table names. Biggest day-to-day accelerator. | https://supabase.com/docs/guides/getting-started/mcp |
| **Stripe** | ✅ Official | Create/inspect products, prices, test payments, and query transactions from the agent while building the credits system. | https://docs.stripe.com/mcp |
| **Netlify** | ✅ Official | Create sites, manage deploys, env vars, and DNS; debug build/deploy failures conversationally from Claude Code. | https://docs.netlify.com/welcome/build-with-ai/netlify-mcp-server/ |
| **GitHub** | ✅ Official | Issues, PRs, Actions runs, code search from the agent. | https://github.com/github/github-mcp-server |
| **Sentry** | ✅ Official | Pull real stack traces/issues into Claude Code to debug the async pipeline. | https://docs.sentry.io/product/sentry-mcp/ |
| **Expo / EAS** | ⚠️ Community/emerging | Build/update status; verify via Expo docs before relying on it. | https://docs.expo.dev/ |
| **Music provider (Suno reseller / future official API)** | ❌ None | No MCP server — you integrate via plain REST. | https://docs.sunoapi.org/ |
| **Firebase** (if chosen over Supabase) | ✅ Official (Google) | Firestore/Auth management via MCP. | https://firebase.google.com/docs/cli/mcp-server |

**What this enables concretely:** with Supabase + Stripe + GitHub + Sentry MCP servers connected, Claude Code can **write a migration, apply it, wire the Stripe price, open the PR, and later read the production stack trace** — all against real systems instead of guesses. That is a material multiplier on a small team, and it's the reason to favor these vendors over equally-capable alternatives that lack MCP support.

> Note: MCP servers require one-time authorization in an interactive Claude Code session (`claude mcp` / `/mcp`); they can't be authorized from this non-interactive session.

---

## 6. Integration Map

### 6.1 How the pieces connect

```
                    ┌─────────────────────────────────────────────┐
                    │  React Native + Expo app (iOS/Android/web)   │
                    │  TanStack Query · Zustand · expo-audio       │
                    └───────┬───────────────────────┬─────────────┘
                            │ (Supabase JS SDK, JWT) │ (Stripe SDK)
                            ▼                        ▼
          ┌───────────────────────────┐    ┌──────────────────┐
          │        SUPABASE           │    │      STRIPE      │
          │  Auth (JWT) ─► RLS        │    │  Checkout/credits│
          │  Postgres (ledger, songs) │    │                  │
          │  Realtime (push status)   │    └───────┬──────────┘
          │  Storage (re-hosted audio)│            │ webhook
          │  Edge Functions ◄─────────┼────────────┘
          └──────┬─────────────▲──────┘
                 │ REST call    │ webhook callback (song ready)
                 ▼              │
        ┌────────────────────────────────┐
        │  MUSIC PROVIDER (Suno reseller  │
        │  now → official partner API     │
        │  later). submit → poll/callback │
        └────────────────────────────────┘
```

**Happy path:** user completes guided flow → app calls Edge Function `POST /generate` → function verifies auth + **reserves credits in the ledger** → calls provider REST `submit` → provider returns task ID (stored on `generations`) → provider **webhooks** the Edge Function on completion → function **downloads audio → re-hosts to Supabase Storage** → updates `generations.status = complete` → **Supabase Realtime pushes** "ready" to the app → user plays via `expo-audio` and gets a shareable page.

### 6.2 Potential integration pain points (and mitigations)

1. **Async orchestration is the whole ballgame.** Webhooks get lost, providers stall, users close the app mid-generation. **Mitigate:** persist every job in `generations` with a status machine; add a **reconciliation poller** (backoff) as a safety net for missed webhooks; make webhook handlers **idempotent** (dedupe on `provider_task_id`).
2. **Ephemeral provider audio URLs.** (§3.2) If you serve the provider's URL directly, songs die later. **Mitigate:** always re-host to Storage before marking complete. Non-negotiable.
3. **Credit/payment race conditions.** Double-spend or generate-without-paying. **Mitigate:** reserve credits *before* calling the provider; **refund the ledger on `failed`**; reconcile against Stripe webhooks; append-only ledger with DB constraints.
4. **Provider fragility / ToS risk** (from the viability doc). The unofficial API can break overnight. **Mitigate:** put a **thin provider-abstraction interface** behind your Edge Function so you can swap reseller → **Suno official partner API** → Udio without touching the app. This directly de-risks the viability doc's #1 concern.
5. **Edge Function limits.** Serverless functions have execution-time/memory caps — fine for "submit + webhook" but **not** for long polling loops. **Mitigate:** never block a function waiting for generation; rely on webhooks + Realtime. Move to the Railway/Hono worker if you need durable background jobs or a queue.
6. **App Store review friction.** AI-generated content, user accounts, and payments all draw scrutiny; Apple requires its own sign-in alongside Google. **Mitigate:** implement Apple Sign-In, add content moderation (block real-artist voice cloning / offensive lyrics — a viability-doc requirement) *before* submission, and use EAS Update for fast post-review fixes.
7. **"Composed stack" coordination.** Multiple vendors = multiple dashboards, secrets, and webhooks to keep in sync. **Mitigate:** centralize secrets, use MCP servers (§5) to inspect each system from one place, and keep env config in one source of truth.

---

## 7. Summary Recommendation

Build the MVP as an **end-to-end TypeScript** app: **Expo** frontend, **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) backend, **Stripe** credits, web hosted on **Netlify** with mobile builds via **EAS**, and **GitHub Actions** CI/CD plus **Sentry** monitoring. Nearly every layer has an **official MCP server**, so Claude Code operates against your real systems. Fixed hosting stays **$0 → ~$25–45/month** through 1k users — **under your $50 budget**.

**Keep two truths from the viability analysis front-of-mind while building:**
1. **The provider is a swappable commodity** — hide it behind an interface and get in line for Suno's official partner API.
2. **Generation is your real cost driver**, not hosting — the credit/pricing model is a first-class engineering feature, not an afterthought.

---

## Appendix: Documentation Links (all major technologies)

- Expo — https://docs.expo.dev/ · React Native — https://reactnative.dev/
- Expo Router — https://docs.expo.dev/router/introduction/ · expo-audio — https://docs.expo.dev/versions/latest/sdk/audio/
- TanStack Query — https://tanstack.com/query/latest · Zustand — https://zustand.docs.pmnd.rs/
- NativeWind — https://www.nativewind.dev/ · React Hook Form — https://react-hook-form.com/ · Zod — https://zod.dev/
- Supabase — https://supabase.com/docs (Auth https://supabase.com/docs/guides/auth · Functions https://supabase.com/docs/guides/functions · Storage https://supabase.com/docs/guides/storage · Realtime https://supabase.com/docs/guides/realtime · MCP https://supabase.com/docs/guides/getting-started/mcp)
- Hono — https://hono.dev/ · Fastify — https://fastify.dev/ · FastAPI (Python alt) — https://fastapi.tiangolo.com/
- tRPC — https://trpc.io/ · Stripe — https://docs.stripe.com/ (MCP https://docs.stripe.com/mcp)
- Netlify — https://docs.netlify.com/ (MCP https://docs.netlify.com/welcome/build-with-ai/netlify-mcp-server/ · Next.js runtime https://docs.netlify.com/frameworks/next-js/overview/)
- Railway — https://docs.railway.app/ · Render — https://render.com/docs · Upstash Redis — https://upstash.com/docs/redis
- GitHub Actions — https://docs.github.com/en/actions (MCP https://github.com/github/github-mcp-server) · Sentry — https://docs.sentry.io/ (MCP https://docs.sentry.io/product/sentry-mcp/)
- EAS — https://docs.expo.dev/eas/ · Supabase CLI/migrations — https://supabase.com/docs/guides/local-development
- Firebase (alt) — https://firebase.google.com/docs · MongoDB Atlas (alt) — https://www.mongodb.com/docs/atlas/
- Music provider (current, unofficial) — https://docs.sunoapi.org/
