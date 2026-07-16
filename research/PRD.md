# Product Requirements Document — AI Music Creation App

**Working name:** (TBD) — referred to here as **"the App"**
**Version:** 1.0 (MVP definition)
**Date:** 2026-07-15
**Owner:** maritza.herbe@gmail.com
**Companion docs:** [`viability-analysis.md`](./viability-analysis.md) · [`tech-stack.md`](./tech-stack.md)

> **How to read this doc:** A developer new to the project should be able to build the MVP from this alone. Sections 1–3 define *what and why*; sections 4–5 define *how* (schema + API); sections 6–8 define *quality bars, boundaries, and success*. Two principles from the companion docs govern every decision:
> 1. **The music engine is a commodity — the product is the *experience* around it** (the "Disney moment"). We do not compete on generation quality; we compete on how effortless and emotional the journey is.
> 2. **Generation is asynchronous and costs real money per song.** Everything is shaped by the `create → generate → poll/webhook → re-host audio → deliver` pipeline and a metered **credits** economy. This is not a CRUD app.

---

## 1. Executive Summary

### 1.1 What we're building
The App turns an ordinary person's *feeling* — "I want a song for my mom's 60th," "an anthem for our team," "a lullaby for my daughter" — into a complete, produced song (lyrics, vocals, instrumentation) in under a minute, through a guided, emotionally intelligent flow that hides all the prompt-engineering complexity. It wraps a third-party AI music generation API (Suno via reseller today, Suno's official partner API when available) in a delightful cross-platform app (iOS, Android, web) that packages the result as a shareable keepsake.

### 1.2 Primary value proposition
**"Become the artist of your own song."** Anyone — with zero musical skill and zero prompt-writing skill — can create a personal, occasion-perfect song and share it as a gift or memory in minutes. We sell the *magic moment and the keepsake*, not "AI music generation."

> **Positioning guardrail (from viability analysis §4.4):** We deliberately say *"be the artist of your own song,"* **not** *"be your favorite [real] artist."* Cloning a specific real artist's voice/identity is a right-of-publicity minefield and is out of scope. The emotional payoff is the user being the star of *their* creation.

### 1.3 Target user persona (psychographic)

**"Sentimental Sam" — the Occasion Gifter** (primary persona)

- **Demographics (thin, on purpose):** 25–55, smartphone-first, comfortable buying digital goods, not a musician.
- **Motivations:** Wants to give something that feels *personal and thoughtful* without the time, money, or talent a custom song normally requires. Craves the reaction — the tears, the laugh, the "you made this for me?"
- **Fears:** That the gift will feel cheap, generic, or AI-slop; that they'll spend an hour fighting a tool and get something embarrassing; that they'll look cheap or lazy.
- **Goals:** Produce something that lands emotionally on the *first or second try*, in minutes, that they're proud to attach their name to and share.
- **Trigger events:** Birthday, anniversary, wedding, memorial, graduation, new baby, breakup, apology, "just because."

**Secondary persona — "Team-Builder Taylor" (the org/B2B seed):** an HR lead, community manager, coach, or small-agency creative who wants a custom anthem/jingle for a team, event, brand, or campaign, and needs a shared workspace with pooled credits. This persona is why the architecture is **multi-tenant from day one** (§4.3), even though the MVP go-to-market centers on Sentimental Sam.

---

## 2. User Avatar Deep Dive

### 2.1 Who exactly is this for?
People who feel a strong emotional impulse to mark a moment but lack the tools/skills to express it musically — **gift-givers, celebrants, and mourners first; hobbyist creators second.** Not professional musicians (they have Suno Studio and DAWs). Not developers (they'd hit the API directly).

### 2.2 Their current painful workflow (the "before")
Today, Sentimental Sam's options are all bad:
1. **Buy a generic gift** (mug, card) → feels impersonal, guilt.
2. **Commission a human songwriter** (e.g., legacy services) → $100–300+, days of turnaround, awkward back-and-forth.
3. **Try Suno/Udio directly** → confronted with a blank prompt box and jargon ("style", "persona", "v5"), generates something mediocre, doesn't understand why, gives up feeling incompetent. **This is the gap we exploit:** the raw tools assume you know what to ask for.
4. **Give up** and settle for words in a card.

The pain is **emotional friction + skill gap + fear of a bad result**, not lack of a generation engine.

### 2.3 What success looks like for them
- They answer a few warm, human questions ("Who's it for? What's the occasion? Tell me one story about them.").
- 45 seconds later they hear a real song that references *their* details.
- They tear up / laugh, pick their favorite of two versions, and send a beautiful link.
- The recipient reacts exactly as hoped. Sam feels like a hero.

### 2.4 What makes them tell a colleague/friend about it
- **The reaction shot.** "I made my dad cry with a song I created in 5 minutes." Word-of-mouth is driven by *the recipient's reaction*, so the **shareable song page and the recipient experience are core growth features, not afterthoughts.**
- **Disbelief that they made it.** "I can't write music and *I* made this."
- **Speed + low price** relative to the alternative (a $150 commissioned song).

---

## 3. Feature Specification

Priorities: **P0** = MVP-critical (no launch without it) · **P1** = important (fast-follow) · **P2** = nice-to-have.

> Legend for technical notes: **[Provider]** = music generation API (abstracted, swappable); **[EF]** = Supabase Edge Function; **[RLS]** = enforced by Row-Level Security; **[RT]** = Supabase Realtime.

### 3.1 Onboarding & Auth — P0
- **User story:** *As a new visitor, I want to sign up quickly (email, Google, or Apple) so that I can start creating without friction.*
- **Acceptance criteria:**
  - Sign-up/sign-in via email magic link, Google OAuth, and Apple OAuth (Apple required for iOS).
  - On first sign-up, a **personal organization** and **profile** are auto-created, and a small **free credit grant** is added to the ledger.
  - Session persists across app restarts; sign-out works on all platforms.
- **Technical notes:** Supabase Auth; DB trigger creates `organizations` (type=`personal`), `memberships` (role=`owner`), `profiles`, and an initial `credit_ledger` grant. [RLS]

### 3.2 Guided "Disney Moment" Creation Flow — P0  *(the core product)*
- **User story:** *As a non-musician gifter, I want to answer a few simple questions instead of writing a prompt so that I get a great song without knowing how AI music works.*
- **Acceptance criteria:**
  - A multi-step wizard collects: **occasion** (from templates), **recipient/subject**, **relationship**, **1–3 personal details/story**, **mood/vibe**, **genre** (friendly presets, not jargon), and **language**.
  - An **occasion template** pre-fills sensible defaults so a user can reach "Generate" in ≤ 5 taps.
  - The wizard composes a high-quality provider prompt + optional lyric guidance **server-side** (users never see raw prompt syntax unless they opt into "advanced").
  - Input is validated and **moderated** before generation (§3.9).
- **Priority:** P0. This flow *is* the differentiation; invest here.
- **Technical notes:** Wizard state in Zustand; prompt composition in [EF] `POST /songs` and `/songs/:id/generate`. Occasion templates stored in `occasion_templates`.

### 3.3 Song Generation (async pipeline) — P0
- **User story:** *As a creator, I want to tap "Generate" and reliably receive a finished song so that I get my result without babysitting a loading screen.*
- **Acceptance criteria:**
  - Tapping Generate **reserves credits atomically** (fails clearly if insufficient), then calls the provider.
  - A `generations` row tracks status: `queued → processing → complete | failed`.
  - On provider completion **webhook**, the system **downloads the audio and cover image and re-hosts them to our own storage** before marking `complete` (provider URLs are ephemeral — see viability §3.2 / tech-stack §3.2).
  - Provider returns **up to 2 clips per generation**; both are stored as selectable variants.
  - On `failed`, **reserved credits are automatically refunded** to the ledger.
  - User is **pushed** a "your song is ready" update via Realtime; polling with exponential backoff is the fallback.
- **Technical notes:** [EF] `POST /songs/:id/generate` (submit) + [EF] `POST /webhooks/provider` (idempotent completion handler → Storage re-host → status update → [RT] notify). Provider calls go through a **provider-abstraction interface** so reseller → official Suno API is a config swap. Webhook idempotency via `webhook_events` unique `(provider, external_id)`.

### 3.4 Playback & Variant Selection — P0
- **User story:** *As a creator, I want to listen to both versions and pick my favorite so that I keep the one that hits hardest.*
- **Acceptance criteria:** In-app audio player (play/pause/seek/scrub); both clips playable; user selects one as the song's "chosen" clip; selection persists.
- **Technical notes:** `expo-audio`; clips in `song_clips`; `songs.selected_clip_id`.

### 3.5 Regeneration & Light Editing — P1
- **User story:** *As a creator, I want to tweak and regenerate so that I can get closer to what I imagined.*
- **Acceptance criteria:** Edit brief fields and regenerate (consumes credits again); view generation history per song; optional "extend" via provider. Clear per-regeneration cost shown before spend.
- **Priority:** P1 (MVP can ship with regenerate-from-scratch only).

### 3.6 Credits & Payments — P0
- **User story:** *As a user, I want to buy credits and see my balance so that I can create songs and understand what each one costs.*
- **Acceptance criteria:**
  - Purchase credit packs via Stripe Checkout; balance updates on confirmed `checkout.session.completed` webhook.
  - Balance and per-action cost are always visible before spend.
  - **Append-only ledger** is the source of truth; balance is derived; refunds on failed generations are automatic.
  - Free grant on signup; **no unlimited free generation** (viability §1.3 / tech-stack §4.3).
- **Technical notes:** Stripe (official MCP). [EF] `POST /billing/checkout`, `POST /webhooks/stripe`. `credit_ledger` with `stripe_event_id` idempotency.

### 3.7 Shareable Song Page / Keepsake — P0  *(the growth engine)*
- **User story:** *As a gifter, I want to send a beautiful link of my song so that the recipient has a memorable experience and I look thoughtful.*
- **Acceptance criteria:**
  - Each song can be made public with a unique `share_slug`.
  - Public page (web, no login) shows title, cover art, player, optionally lyrics and a personal message; mobile-responsive; rich social/OG preview.
  - Download (MP3) and re-share; view/play counts recorded.
  - Public pages **only** expose songs explicitly shared (default private). [RLS + public view]
- **Technical notes:** Public page hosted on **Netlify**; audio served from Supabase Storage CDN (not proxied through Netlify — tech-stack §4.3). `share_events` for analytics.

### 3.8 Library / My Songs — P0
- **User story:** *As a user, I want to see all my songs so that I can revisit, replay, share, or download them.*
- **Acceptance criteria:** List of the org's songs with status, cover, date; open detail; delete; empty state guides to creation. [RLS scoped by org]

### 3.9 Content Moderation & Safety — P0
- **User story:** *As the platform, I must block harmful/infringing content so that we stay legal and safe (viability §1.3, §4.4).*
- **Acceptance criteria:**
  - **Input moderation:** reject prompts attempting real-artist voice cloning/impersonation, hateful, sexual-minor, defamatory, or violent content **before** spending credits.
  - **Output moderation:** flag/hold suspicious outputs.
  - Blocked attempts are logged; user gets a clear, non-preachy message; no credit charged for blocked input.
- **Technical notes:** Moderation step in [EF] before provider call; `moderation_flags` table; combine keyword/denylist + an LLM/classifier check.

### 3.10 Organizations / Team Workspaces — P1  *(architecture is P0, UI is P1)*
- **User story:** *As Team-Builder Taylor, I want a shared workspace with pooled credits so that my team can create songs together.*
- **Acceptance criteria:** Create an org; invite members by email; roles (owner/admin/member); credits and songs scoped to the active org; switch active org.
- **Priority:** **Schema & tenancy = P0** (retrofitting multi-tenancy later is painful). **Team-management UI = P1.** Every user still gets a personal org at signup.

### 3.11 Notifications — P1
- **User story:** *As a creator, I want to be notified when my song is ready so that I don't wait on a screen.*
- **Acceptance criteria:** In-app (Realtime) always; push (Expo Notifications) P1; email on completion P2.

### 3.12 Advanced / Pro Prompt Mode — P2
- **User story:** *As a power user, I want raw control over style/lyrics so that I can fine-tune.*
- **Priority:** P2. Explicitly de-prioritized; our users are not power users.

---

## 4. Database Schema

**Engine:** Supabase PostgreSQL. **Auth:** Supabase Auth (`auth.users`). **All access via Row-Level Security.** Types are Postgres types. Naming: `snake_case`, UUID PKs (`gen_random_uuid()`), `timestamptz` for time.

### 4.1 Multi-tenancy architecture
- **Tenant = `organization`.** Every tenant-scoped row carries `org_id`.
- **Every user gets a personal org** on signup (type=`personal`); teams are type=`team`.
- **Membership** (`memberships`) maps users↔orgs with a role.
- **Isolation is enforced by RLS**: a row is visible/writable only if the requesting user has a membership in that row's `org_id`. This keeps tenant isolation in the database, not scattered across app code.
- **Credits are org-scoped** (a team pools credits; a person uses their personal org's credits).

### 4.2 Entity-Relationship overview

```
auth.users 1───1 profiles
auth.users 1───* memberships *───1 organizations
organizations 1───* credit_ledger
organizations 1───* songs 1───* generations 1───* song_clips
organizations 1───* moderation_flags
songs 1───* share_events
occasion_templates 1───* songs        (template reference)
webhook_events                        (idempotency log, provider/stripe)
```

### 4.3 Tables

**`profiles`** — one per auth user
| field | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| display_name | text | 1–80 chars |
| avatar_url | text | nullable |
| default_org_id | uuid FK → organizations | active org |
| created_at | timestamptz | default now() |

**`organizations`** — the tenant
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | 1–120 chars |
| slug | text UNIQUE | url-safe |
| type | text | enum: `personal` \| `team` |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

**`memberships`** — user↔org with role
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations | ON DELETE CASCADE |
| user_id | uuid FK → auth.users | ON DELETE CASCADE |
| role | text | enum: `owner` \| `admin` \| `member` |
| created_at | timestamptz | |
| | | **UNIQUE(org_id, user_id)** |

**`credit_ledger`** — append-only source of truth for credits
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| delta | integer | non-zero; + grant/purchase/refund, − spend |
| reason | text | enum: `signup_grant` \| `purchase` \| `generation_spend` \| `generation_refund` \| `promo` \| `adjustment` |
| ref_type | text | nullable: `generation` \| `stripe_session` |
| ref_id | text | nullable id of the referenced object |
| stripe_event_id | text | nullable, UNIQUE when present (idempotency) |
| balance_after | integer | denormalized running balance; **CHECK ≥ 0** |
| created_by | uuid FK → auth.users | nullable (system) |
| created_at | timestamptz | |

> Balance = latest `balance_after` for the org (or `SUM(delta)`). Never mutate rows. Refunds are new rows.

**`occasion_templates`** — drives the guided flow
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| key | text UNIQUE | e.g. `birthday`, `memorial`, `wedding`, `team_anthem` |
| label | text | display |
| default_mood | text | |
| default_genre | text | |
| prompt_scaffold | jsonb | question set + prompt template |
| is_active | boolean | default true |

**`songs`** — a creation (draft or produced)
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| created_by | uuid FK → auth.users | |
| occasion_template_id | uuid FK → occasion_templates | nullable |
| title | text | 1–120 chars |
| brief | jsonb | structured wizard answers (recipient, story, mood, genre, language, etc.) |
| status | text | enum: `draft` \| `generating` \| `ready` \| `failed` |
| selected_clip_id | uuid FK → song_clips | nullable |
| share_slug | text UNIQUE | nullable; set when shared |
| is_public | boolean | default false |
| personal_message | text | nullable; shown on share page |
| created_at / updated_at | timestamptz | |

**`generations`** — one provider generation attempt for a song
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| song_id | uuid FK → songs | ON DELETE CASCADE |
| org_id | uuid FK → organizations | denormalized for RLS/indexing |
| provider | text | e.g. `suno_reseller`, `suno_official` |
| provider_task_id | text | UNIQUE (nullable until submitted) |
| model_version | text | e.g. `v5`, `v4_5plus` |
| prompt | text | composed server-side |
| style_tags | text[] | |
| lyrics | text | nullable |
| is_instrumental | boolean | default false |
| status | text | enum: `queued` \| `processing` \| `complete` \| `failed` |
| credits_cost | integer | reserved amount |
| cost_usd | numeric(10,4) | actual provider cost (analytics) |
| error_code | text | nullable |
| created_by | uuid FK → auth.users | |
| created_at / completed_at | timestamptz | |

**`song_clips`** — variant audio (provider returns up to 2)
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| generation_id | uuid FK → generations | ON DELETE CASCADE |
| org_id | uuid FK → organizations | denormalized |
| provider_clip_id | text | |
| audio_storage_path | text | **our** Storage path (re-hosted) |
| image_storage_path | text | cover art, re-hosted |
| duration_s | integer | |
| created_at | timestamptz | |

**`moderation_flags`**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| subject_type | text | `song_input` \| `generation_output` |
| subject_id | uuid | |
| source | text | `input` \| `output` |
| category | text | `impersonation` \| `hate` \| `sexual` \| `violence` \| `other` |
| verdict | text | `pass` \| `review` \| `block` |
| detail | text | |
| created_at | timestamptz | |

**`share_events`** — growth analytics for public pages
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| song_id | uuid FK → songs | |
| event | text | `view` \| `play` \| `download` \| `reshare` |
| ip_hash | text | hashed, privacy-safe |
| referrer | text | nullable |
| created_at | timestamptz | |

**`webhook_events`** — idempotency/audit for inbound webhooks
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| provider | text | `stripe` \| `suno_reseller` \| ... |
| external_id | text | provider event/task id |
| payload | jsonb | raw |
| status | text | `received` \| `processed` \| `error` |
| processed_at | timestamptz | nullable |
| | | **UNIQUE(provider, external_id)** |

### 4.4 Indexing strategy (common queries)
- `memberships`: **UNIQUE(org_id, user_id)**; index `(user_id)` for "my orgs".
- `songs`: index `(org_id, created_at DESC)` for library lists; **UNIQUE(share_slug)**; partial index `(org_id) WHERE status='generating'`.
- `generations`: **UNIQUE(provider_task_id)**; index `(song_id, created_at DESC)`; **partial index `(status) WHERE status IN ('queued','processing')`** for the reconciliation poller.
- `song_clips`: index `(generation_id)`.
- `credit_ledger`: index `(org_id, created_at DESC)`; **UNIQUE(stripe_event_id) WHERE stripe_event_id IS NOT NULL**.
- `share_events`: index `(song_id, created_at)`.
- `webhook_events`: **UNIQUE(provider, external_id)**.

### 4.5 Data validation rules
- Enums enforced via `CHECK` constraints (status, role, reason, verdict, type).
- `credit_ledger.delta <> 0`; `balance_after >= 0` (CHECK).
- `songs.title` length 1–120; `profiles.display_name` 1–80.
- `share_slug` matches `^[a-z0-9-]{6,}$`.
- `songs.is_public = true` requires non-null `share_slug` and a non-null `selected_clip_id` (enforce in app + trigger).
- Credit **reservation and generation insert happen in one transaction** (no spend without a generation row; no generation without a reservation).
- All tenant tables: RLS policy `org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())`.
- Public read policy on `songs` limited to `is_public = true` (via a dedicated public view exposing only shareable fields).

---

## 5. API Specification

**Base:** Supabase Edge Functions under `/functions/v1/*` for orchestration; direct Supabase client SDK (RLS-protected) for simple reads. **Auth:** Supabase JWT in `Authorization: Bearer <token>` unless marked *Public*. All responses JSON. All mutating endpoints require an **`Idempotency-Key`** header where noted.

### 5.1 Conventions
- Success: `200/201` `{ "data": ... }`. Error: `4xx/5xx` `{ "error": { "code": "...", "message": "..." } }`.
- Timestamps ISO-8601 UTC. IDs are UUIDs.
- **Active org** passed via `X-Org-Id` header; server verifies membership.

### 5.2 Endpoints

| Method & Path | Auth | Purpose | Request (key fields) | Response |
|---|---|---|---|---|
| *(Supabase Auth handles sign-up/in/OAuth/refresh natively)* | — | — | — | — |
| `GET /me` | User | Profile + orgs + memberships | — | `{ profile, orgs[], default_org_id }` |
| `GET /orgs` | User | List my orgs | — | `{ orgs[] }` |
| `POST /orgs` | User | Create team org | `{ name }` | `{ org }` (201) |
| `POST /orgs/:id/invites` | Admin+ | Invite member | `{ email, role }` | `{ invite }` |
| `GET /orgs/:id/members` | Member | List members | — | `{ members[] }` |
| `GET /occasions` | User | Occasion templates for wizard | — | `{ templates[] }` |
| `POST /songs` | User | Create draft from brief | `{ occasion_key, brief{} }` | `{ song }` (201) |
| `GET /songs` | User | List org's songs | `?status&limit&cursor` | `{ songs[], next_cursor }` |
| `GET /songs/:id` | User | Song detail + clips | — | `{ song, generations[], clips[] }` |
| `POST /songs/:id/generate` | User | **Reserve credits + submit generation** | `{ model_version?, is_instrumental? }` · `Idempotency-Key` | `{ generation, credits_balance }` (202) |
| `POST /songs/:id/regenerate` | User | New generation from edited brief | `{ brief_patch{} }` · `Idempotency-Key` | `{ generation }` (202) |
| `POST /songs/:id/select-clip` | User | Choose favorite variant | `{ clip_id }` | `{ song }` |
| `POST /songs/:id/share` | User | Toggle public + get slug | `{ is_public, personal_message? }` | `{ share_slug, url }` |
| `DELETE /songs/:id` | User | Delete song | — | `204` |
| `GET /credits` | User | Balance + recent ledger | — | `{ balance, ledger[] }` |
| `POST /billing/checkout` | User | Stripe Checkout for a credit pack | `{ pack_id }` | `{ checkout_url }` |
| `GET /public/songs/:slug` | **Public** | Public share page data | — | `{ title, cover_url, audio_url, lyrics?, message? }` |
| `POST /public/songs/:slug/event` | **Public** | Record view/play/download | `{ event }` | `204` |
| `POST /webhooks/stripe` | **Signed** | Stripe events → credit ledger | Stripe payload | `200` |
| `POST /webhooks/provider` | **Signed** | Generation complete/fail → re-host + notify | Provider payload | `200` |

### 5.3 Key request/response examples

**`POST /songs/:id/generate`** → `202 Accepted`
```json
// request
{ "model_version": "v5", "is_instrumental": false }
// response
{ "data": { "generation": { "id": "…", "status": "queued", "credits_cost": 8 },
            "credits_balance": 42 } }
// errors
409 { "error": { "code": "insufficient_credits", "message": "Need 8 credits, have 3." } }
422 { "error": { "code": "moderation_blocked", "message": "That request isn't allowed." } }
```

**`POST /webhooks/provider`** (internal flow, not client-facing):
1. Verify signature → upsert `webhook_events` (dedupe on `(provider, external_id)`; if already processed, `200` no-op).
2. Download audio + cover → upload to Supabase Storage → write `song_clips`.
3. Set `generations.status`; if `failed`, insert **refund** into `credit_ledger`.
4. Update `songs.status`; emit Realtime event to the org.

### 5.4 Authentication requirements per endpoint
- **User** = valid Supabase JWT + membership in `X-Org-Id`.
- **Admin+** = role `admin` or `owner` in the org.
- **Public** = no auth; only exposes `is_public` songs / accepts anonymous analytics.
- **Signed** = HMAC signature verification (Stripe signing secret; provider webhook secret). No user JWT. Reject unsigned/invalid.

### 5.5 Rate limiting considerations
- **Per-user generation:** e.g. ≤ 5 in-flight generations/user; ≤ N/min (protects our wallet + respects provider limits ~10–20 req/min per viability §1.3).
- **Auth endpoints:** strict (brute-force protection) — Supabase provides defaults.
- **Public share page + analytics:** IP-based rate limit; cache page data at the edge.
- **Provider calls:** exponential backoff + a **reconciliation poller** for missed webhooks (idempotent).
- **Implementation:** Upstash Redis token-bucket at the Edge Function layer (tech-stack §3.2) once concurrency warrants; DB-level guard (max in-flight) from day one.

---

## 6. Non-Functional Requirements

### 6.1 Performance targets
- Wizard step transitions: < 100 ms (client-side).
- API reads (library, song detail): p95 < 400 ms.
- `generate` submit acknowledged (202): p95 < 1.5 s (excludes generation time).
- **End-to-end song ready:** target median < 60 s, p90 < 120 s (bounded by provider; show progress + set expectations, don't block UI).
- Public share page **first meaningful paint:** < 2 s on 4G; audio starts within 2 s of play tap.

### 6.2 Security requirements
- **RLS on every tenant table**; deny-by-default. Verified tenant isolation tests.
- All webhooks **signature-verified**; secrets in env, never in client.
- Stripe handles card data (PCI scope minimized); we store no PANs.
- HTTPS everywhere; JWTs short-lived + refresh; OAuth via Supabase.
- **Moderation before spend** (§3.9); denylist for real-artist impersonation.
- PII minimization: hash IPs in `share_events`; audio buckets private-by-default, public only via signed/slug access for shared songs.
- Rate limiting + abuse monitoring (Sentry alerts on anomalies).
- Idempotency keys on all money/generation-affecting mutations.

### 6.3 Accessibility standards
- Target **WCAG 2.1 AA**: color contrast ≥ 4.5:1, focus states, screen-reader labels (VoiceOver/TalkBack), scalable text, and captions/lyrics available for audio content.
- Audio player fully keyboard-operable on web; all controls have accessible names.

### 6.4 Mobile responsiveness requirements
- Single Expo codebase → iOS, Android, and responsive web.
- Layouts fluid from 320 px (small phones) to desktop; wizard usable one-handed.
- Public share page mobile-first (most recipients open on a phone).
- Respect safe areas/notches; support light/dark; offline-tolerant library (cached last state).

---

## 7. Out of Scope

### 7.1 Explicitly NOT in MVP
- **Real-artist voice cloning / "sing like [celebrity]"** — legal red line (viability §4.4). Actively blocked.
- **Full DAW / multi-track editing, stems, MIDI export** — that's Suno Studio's turf; not our user.
- **Advanced raw-prompt mode** (P2, deferred).
- **Native Android/iOS push at launch** (in-app Realtime only; push is P1).
- **Team billing/seats management UI** (tenancy schema exists; team UI is P1).
- **Public discovery feed / social network / following** — no browse-others'-songs.
- **Marketplace, artist payouts, royalties.**
- **Guaranteed copyright ownership claims** — we set expectations, we don't promise legal ownership of AI output (viability §4.3).
- **Multi-language UI localization** (song *lyrics* can be multi-language; the *app UI* ships English-first).
- **Offline generation.**

### 7.2 Future considerations (v2+)
- Suno **official partner API** migration (apply now; swap behind provider abstraction) — de-risks viability §1.2.
- Team workspaces UI + pooled billing (activate Team-Builder Taylor).
- Physical/QR keepsakes (vinyl, cards), video export, lyric videos.
- Push + email notifications, referral loops built on the share page.
- Occasion-specific templates library expansion; seasonal campaigns.
- Recipient-side experience enhancements (reaction capture, thank-you loop).

---

## 8. Success Metrics

### 8.1 Guiding principle
Because the product is the *experience*, the north-star is **emotional completion + sharing**, not raw generations. **North Star Metric: number of songs *shared* per week** (a shared song = someone found it good enough to send — proof the "Disney moment" landed).

### 8.2 Metric definitions
- **Activation:** % of new signups who complete ≥ 1 song (`ready`) within 24 h.
- **"Disney moment" rate:** % of first-time creators who reach a `ready` song **and share or download it** (proxy for delight).
- **Share rate:** shared songs ÷ ready songs.
- **Paid conversion:** % of activated users who buy ≥ 1 credit pack.
- **Regeneration ratio:** generations ÷ shared songs (cost-efficiency; watch the wallet — viability §1.3).
- **Unit economics:** avg revenue per song vs. avg provider cost per shared song (must trend positive).
- **Virality (K):** new signups attributable to share-page referrals ÷ sharers.
- **Reliability:** generation success rate; webhook processing success; p90 time-to-ready.

### 8.3 Targets

| Metric | Launch **week 1** | **Month 1** | **Month 3** |
|---|---|---|---|
| Signups | 200 | 2,000 | 10,000 |
| Activation (≥1 ready song / 24h) | ≥ 40% | ≥ 50% | ≥ 60% |
| Share rate (shared ÷ ready) | ≥ 25% | ≥ 35% | ≥ 45% |
| Paid conversion | ≥ 3% | ≥ 5% | ≥ 8% |
| Songs shared / week (North Star) | 50 | 600 | 4,000 |
| Generation success rate | ≥ 95% | ≥ 97% | ≥ 98% |
| Median time-to-ready | < 75 s | < 60 s | < 60 s |
| Referral K-factor | (measure) | ≥ 0.2 | ≥ 0.4 |
| Contribution margin per shared song | ≥ break-even | positive | positive |

> Targets are hypotheses to validate, not commitments. If **activation** or **share rate** underperform in week 1, the guided flow (§3.2) — our core differentiator — is the first thing to fix. If **unit economics** go negative, revisit credit pricing before scaling spend (viability §1.3, tech-stack §4.3).

### 8.4 Instrumentation
- Product analytics events on every wizard step (find drop-off), generate, ready, select, share, download.
- `share_events` powers virality metrics; `credit_ledger` + `generations.cost_usd` power unit economics.
- Sentry for reliability; dashboard tying provider cost ↔ revenue per shared song.

---

## Appendix: Traceability to companion docs
- **Commodity engine / experience-is-the-product** → viability §2.2, §5.3 → PRD §1.1, §3.2, §8.1.
- **"Own song," not real-artist clone** → viability §4.4 → PRD §1.2, §3.9, §7.1.
- **Async re-host pipeline + provider abstraction** → tech-stack §3.2, §6.2 → PRD §3.3, §5.3, §7.2.
- **Metered credits, never unlimited** → viability §1.3, tech-stack §4.3 → PRD §3.6, §4.3, §8.3.
- **Multi-tenant via org + RLS** → tech-stack §2.3, §3.1 → PRD §4.1–4.5.
- **Netlify web hosting** → tech-stack §4.1 → PRD §3.7, §6.4.
