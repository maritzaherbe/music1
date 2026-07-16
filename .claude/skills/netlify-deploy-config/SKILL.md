---
name: netlify-deploy-config
description: Configure Netlify (netlify.toml, build, redirects, deploy previews) for the web app / share pages. Web host is Netlify — not Vercel/Cloudflare. Use for web deploy setup.
---
# Netlify Deploy Config

Full spec: `research/skills.md` #27.

## Procedure
1. Write `netlify.toml`: build command (Expo web export or Next.js), publish dir, redirects/SPA fallback.
2. Configure env var NAMES in Netlify (values out-of-band).
3. Enable Deploy Previews per PR; promote on merge to main.
4. Do NOT proxy audio egress through Netlify — serve from Supabase Storage CDN.

## References
- https://docs.netlify.com/
- https://docs.netlify.com/welcome/build-with-ai/netlify-mcp-server/
