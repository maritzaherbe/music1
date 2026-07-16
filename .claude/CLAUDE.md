# CLAUDE.md — AI Music Creation App

<!-- Maintainer note: keep this under ~200 lines. Link to research docs; don't duplicate them here.
     Update §3 (Current State) as work progresses. HTML comments are stripped from Claude's context. -->

Persistent project context. Full detail lives in `research/` — read those on demand (they are intentionally **not** auto-imported to keep session context lean):
`research/PRD.md` · `research/tech-stack.md` · `research/viability-analysis.md`

---

## 1. Project Identity

- **What:** A cross-platform app (iOS / Android / web) that turns an ordinary person's *feeling* ("a song for my mom's 60th") into a complete, produced song — lyrics, vocals, instrumentation — in under a minute, via a guided flow that hides all prompt-engineering.
- **Value prop:** *"Become the artist of your own song."* We sell the **magic moment + shareable keepsake**, not "AI music generation."
- **Core mission / success criteria:** Deliver the "Disney moment" so reliably that people share the result. **North Star = songs *shared* per week.** Not generations — *shared* songs prove the emotion landed.
- **Full context:** `research/PRD.md` (this file is the summary; the PRD is the source of truth).

---

## 2. Technical Context

**Stack (end-to-end TypeScript). Full rationale + doc links: `research/tech-stack.md`.**

- **Frontend:** React Native + **Expo** (managed), TypeScript, Expo Router. One codebase → iOS/Android/web.
- **Client state:** **TanStack Query** for server/async state (polling generation jobs); **Zustand** for light UI state. No Redux.
- **UI/forms:** NativeWind (Tailwind), React Hook Form + Zod, `expo-audio` for playback.
- **Backend:** **Supabase Edge Functions** (Deno/TS) for orchestration in MVP. Graduate hot paths to **Hono on Railway** only when durable workers/queues are needed.
- **DB / Auth / Storage / Realtime:** **Supabase** (PostgreSQL). Auth = Supabase Auth (email magic link, Google, **Apple**). Access via **Row-Level Security**.
- **Payments:** **Stripe** (credits model).
- **Web hosting:** **Netlify** (NOT Vercel/Cloudflare — this is a firm user decision). Mobile builds via **EAS**.
- **CI/CD:** GitHub Actions (+ Netlify Deploy Previews). **Monitoring:** Sentry.
- **Music generation:** third-party Suno reseller (`sunoapi.org`) today → Suno **official partner API** later. Always behind a **provider-abstraction interface**.

### Key architectural decisions (the rationale that must not be lost)
1. **The music engine is a commodity — the product is the experience around it.** Don't over-invest in generation; invest in the guided flow (PRD §3.2) and the share page (PRD §3.7).
2. **Generation is async + costs real money per song.** Pipeline: `create → reserve credits → submit → poll/webhook → RE-HOST audio → notify`. This is not a CRUD app.
3. **Re-host every generated audio + cover to our own Supabase Storage before marking a song `ready`.** Provider URLs are ephemeral; serving them directly means songs 404 later. Non-negotiable.
4. **Credits: reserve before spend, auto-refund on failure. `credit_ledger` is append-only; balance is derived.** Never offer unlimited free generation.
5. **Provider behind a swappable interface** — reseller violates Suno ToS and can break overnight; swapping to the official API must be a config change, not a rewrite.
6. **Multi-tenant from day one.** Tenant = `organization`; every user gets a personal org at signup; every tenant table carries `org_id` guarded by RLS. (Team-management *UI* is P1; the tenancy *schema* is P0.)
7. **"Own song," never real-artist voice cloning** — legal red line; blocked by moderation before spend.

### Coding standards & conventions
- **TypeScript, strict mode.** Shared types + Zod schemas between client and Edge Functions. No `any` without justification.
- **Validate all external input with Zod** at the boundary (API handlers, webhooks).
- **All money/generation mutations are idempotent** (require `Idempotency-Key`; webhooks dedupe on provider event id).
- **DB:** `snake_case`, UUID PKs (`gen_random_uuid()`), `timestamptz`. Schema changes only via versioned Supabase CLI migrations — never edit prod schema by hand.
- **RLS on every tenant table**, deny-by-default.
- **Secrets in env only**, never in client bundles or committed. Verify webhook signatures.
- Match surrounding code style; keep comment density consistent with the file.

---

## 3. Current State

<!-- UPDATE THIS SECTION as work progresses. -->

- **Phase:** Pre-development / greenfield. Research + planning complete; **no application code written yet.**
- **Done:** Viability analysis, tech-stack decision, PRD (all in `research/`). Netlify chosen as web host.
- **In progress:** Nothing in code yet. Next likely steps: scaffold Expo app + Supabase project, author the migration for the PRD §4 schema, build the `generate` + `webhooks/provider` Edge Functions.
- **Not started:** everything in PRD §3.
- **Known constraints / debt to watch:** unofficial provider API (ToS + fragility risk); unit economics (provider cost per shared song must stay below credit revenue); RIAA/Suno litigation overhang (see viability §4).
- **Open item:** product name is still **(TBD)**.

---

## 4. Agent Instructions

**How to approach this codebase:**
- Treat `research/PRD.md` as the spec. When implementing a feature, re-read its PRD entry (user story + acceptance criteria) first.
- Prefer the existing stack (§2) over introducing new dependencies. End-to-end TypeScript.
- When touching the generation flow, preserve the async + re-host + credit-refund invariants (§2 decisions 3–4) — these are the most common places to introduce silent bugs.

**Ask before proceeding when:**
- A change would alter the **credit/billing logic**, the **credit ledger**, or Stripe integration.
- A change touches **RLS policies or multi-tenancy** boundaries (risk of cross-tenant data leaks).
- The **provider-abstraction interface** would change, or you'd swap/add a music provider.
- Requirements are ambiguous or a decision isn't covered by the PRD — pick the obvious default and say so, or ask if it's genuinely the user's call.

**Never do without explicit approval:**
- Never build **real-artist voice cloning / "sing like [celebrity]"** — hard legal line (PRD §7.1).
- Never **serve provider audio URLs directly** to users (must re-host first).
- Never **spend credits without a reservation + generation row in one transaction**, and never skip the refund-on-failure path.
- Never **commit secrets** or hardcode API keys; never disable RLS or signature verification.
- Never **push to a remote or deploy** unless asked. This repo is **not** yet a git repo — don't `git init`/commit without asking.
- Never swap the web host away from **Netlify**, or add Vercel/Cloudflare, without asking.
- Never introduce "unlimited free generation."

---

## 5. File Structure Map

<!-- Intended layout — the repo is greenfield. Update as directories are created. -->

- `research/` — planning docs (PRD, tech-stack, viability). Source of truth for *what/why*.
- `.claude/CLAUDE.md` — this file.
- **Planned (not yet created):**
  - `app/` — Expo app (Expo Router file-based routes); `app/(wizard)/` = guided creation flow.
  - `src/components/`, `src/lib/`, `src/hooks/` — shared UI, clients, hooks.
  - `src/lib/providers/` — music **provider-abstraction** implementations (reseller, official).
  - `supabase/functions/` — Edge Functions (`generate`, `webhooks-provider`, `webhooks-stripe`, `billing-checkout`).
  - `supabase/migrations/` — versioned SQL migrations (schema = PRD §4).
  - `packages/shared/` — shared TS types + Zod schemas (client ↔ functions).
  - `netlify.toml` — web deploy config.

**Naming conventions:** `snake_case` for DB objects and SQL files; `kebab-case` for Edge Function directories; `PascalCase` for React components; `camelCase` for TS variables/functions. Migration files timestamp-prefixed via Supabase CLI.

---

## 6. External Dependencies

| Service | Purpose | Docs |
|---|---|---|
| Supabase | Postgres, Auth, Storage, Realtime, Edge Functions | https://supabase.com/docs |
| Stripe | Payments / credit packs | https://docs.stripe.com/ |
| Netlify | Web app hosting + deploy previews | https://docs.netlify.com/ |
| Expo / EAS | Cross-platform app + mobile builds | https://docs.expo.dev/ |
| Music provider (Suno reseller → official) | Song generation (behind abstraction) | https://docs.sunoapi.org/ |
| Sentry | Error monitoring | https://docs.sentry.io/ |
| Upstash Redis | Rate limiting (add when concurrency warrants) | https://upstash.com/docs/redis |

**Environment variables (names only — never commit values):**
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
`MUSIC_PROVIDER_API_KEY`, `MUSIC_PROVIDER_BASE_URL`, `MUSIC_PROVIDER_WEBHOOK_SECRET`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`,
`SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

**MCP servers available** (official; authorize interactively via `/mcp`): Supabase, Stripe, Netlify, GitHub, Sentry. Use these to inspect real schema/deploys/errors instead of guessing.

---

## 7. User Avatar Reminder

- **Primary: "Sentimental Sam," the occasion gifter.** 25–55, smartphone-first, **not a musician**. Wants something personal + thoughtful without the time/money/talent a custom song normally needs. Craves the recipient's reaction.
- **Their pain is emotional, not technical:** *friction + skill gap + fear of a bad result* — Suno already exists; the gap is that its blank prompt box makes non-musicians feel incompetent.
- **Secondary: "Team-Builder Taylor"** — HR/community/agency wanting a team/brand anthem with a shared workspace + pooled credits (why tenancy is built in).

**UX principles for this audience:**
1. **Guide, don't configure.** Ask warm human questions ("Who's it for? Tell me one story about them."), never expose prompt syntax/jargon by default.
2. **Reach a great result in the first try or two** — ≤5 taps to Generate; sensible occasion-template defaults.
3. **Design for the emotional payoff and the share** — the recipient's reaction is the growth loop; the share page is a core feature, not an afterthought.
4. **Set expectations during the ~60s wait** (progress, don't block the UI); push "it's ready" via Realtime.
5. **Never make them feel dumb.** Clear, non-preachy errors (incl. moderation blocks); no charge on blocked input.
