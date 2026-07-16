# Own Song — Frontend MVP 🎵

Turn a feeling into a real, produced song in about a minute. Answer a few warm
questions ("who's it for? tell us one story"), and the app composes a song for
you via the [sunoapi.org](https://docs.sunoapi.org/) music API.

This is a **frontend prototype** (Next.js) — no database, no accounts, no
payments. Just the create-a-song experience, ready to deploy on Netlify.

---

## How it works

```
Browser ──POST /api/generate──▶ Next.js API route (server)
                                   │  holds SUNO_API_KEY (never sent to browser)
                                   ▼
                                sunoapi.org  ── returns taskId
Browser ──GET /api/status?taskId──▶ API route ──▶ sunoapi.org (poll every 6s)
                                   ◀── ready: 2 tracks (audio + cover art)
```

- **The API key never touches the browser.** The frontend only calls our own
  `/api/*` routes; those run server-side (as Netlify Functions) and hold the key.
  This also avoids CORS.
- Generation is async: submit → poll `/api/status` until the tracks are ready
  (~30–60s for streamable audio, up to ~2–3 min for final MP3s).
- The Suno API returns **2 versions** per request; both are shown so you can pick.

---

## Run locally

```bash
npm install
cp .env.example .env.local     # then paste your sunoapi.org key into .env.local
npm run dev                    # http://localhost:3000
```

`.env.local` is gitignored — your key is never committed.

---

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub**, pick this repo.
   Build settings are auto-detected from `netlify.toml` (Next.js runtime plugin).
3. **⚠️ Set the API key as an environment variable** (this is the step to remember):
   **Site configuration → Environment variables → Add:**
   ```
   SUNO_API_KEY = <your sunoapi.org key>
   ```
   Without this, deployed generation will fail with a 401.
4. Deploy. Netlify turns the `app/api/*` routes into serverless functions
   automatically.

Optional env overrides: `SUNO_MODEL` (default `V4_5`), `SUNO_BASE_URL`.

---

## Project structure

```
app/
  page.tsx              # landing + mounts the creator
  layout.tsx            # shell, metadata
  api/
    generate/route.ts   # POST: compose prompt, screen input, submit to Suno
    status/route.ts     # GET:  poll generation status
    callback/route.ts   # POST: no-op webhook ack (API requires a callBackUrl)
components/
  Creator.tsx           # the whole guided experience (client component)
lib/
  providers/suno.ts     # Suno adapter — all provider detail lives here (swappable)
  prompt.ts             # turns wizard answers into a Suno prompt
  moderation.ts         # blocks real-artist impersonation (legal red line)
  types.ts              # shared types
```

---

## Known MVP limitations (by design)

- **No database.** Songs aren't saved; refresh loses them. Provider audio URLs
  expire after ~15 days (a production build would re-host them — see
  `research/PRD.md`).
- **No auth / no credit metering.** Every generation spends real credits on the
  configured account.
- Uses the unofficial sunoapi.org reseller. The provider is isolated behind
  `lib/providers/suno.ts` so it can be swapped for Suno's official API later.

See `research/` for the full product/tech context this prototype is a slice of.
