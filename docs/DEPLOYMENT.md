# Deployment

What runs where, why it was set up this way, and how to deploy by hand when something needs a push.

_Last verified: 18 Nov 2026, both services deploying from `main` (commit `ac2fc11`)._

## At a glance

| Piece | Where | URL | Deploys from | How |
|---|---|---|---|---|
| Frontend (React + Vite: 3D town, Journey, mini-games) | **Vercel**, Hobby plan, project `mayank-ranghadiya` | https://mayank-ranghadiya.vercel.app | `mayankWIZ/portfolio-ai-app` · branch `main` · root `frontend/` | Automatic on every push to `main` |
| Backend API (Flask + gunicorn wrapping PyBot) | **Render**, free web service `mayank-portfolio-api`, Docker, Ohio | https://mayank-portfolio-api.onrender.com | `mayankWIZ/portfolio-ai-app` · branch `main` · root `backend/` | Automatic on commit to `main` (changes under `backend/`) |
| Chatbot engine + CV data | **GitHub** fork `mayankWIZ/pybot` | — | branch `main` (`PYBOT_REF`) | Cloned into the backend image **at build time** |

```
 visitor ──▶ Vercel (static SPA, frontend/dist)
               │  POST /api/chat, GET /api/health   (VITE_API_BASE_URL)
               ▼
            Render (Docker: python 3.12 + gunicorn, 1 worker × 8 threads)
               │  at build: git clone mayankWIZ/pybot @ PYBOT_REF → /opt/pybot
               ▼
            bot/portfolio/profile.json  ← the CV, single source of truth
```

## Why this setup

- **Free and keyless.** PyBot is rules-based Python (no LLM), so there are no API keys, no per-message cost and no invented facts. Both hosts are on free tiers.
- **Vercel for the frontend.** It's a static Vite build: global CDN, preview deploys per branch, zero server cost. `frontend/vercel.json` rewrites all paths to `index.html` so hash/SPA routes (e.g. `#journey`) work.
- **Render for the backend.** PyBot needs a long-running Python process with ~250 MB of rules in memory, which serverless functions can't hold. Render's free Docker web service can. One gunicorn worker keeps a single copy in memory; threads serve concurrent visitors.
- **PyBot cloned at build time.** The CV and chat rules live in the fork so they can be edited without touching this repo. `PYBOT_REF` pins which branch/tag gets baked into the image.
- **Everything tracks `main`.** One branch to merge into; feature branches get Vercel preview URLs without affecting production.

**Trade-off:** Render's free plan sleeps after ~15 minutes idle and takes about a minute to wake. The frontend pings `/api/health` on load and shows "waking the server" while it does.

## Prerequisites

| Need | Why |
|---|---|
| GitHub access to `mayankWIZ/portfolio-ai-app` and `mayankWIZ/pybot` | Source for both deploys |
| Vercel account owning project `mayank-ranghadiya` (team `mayankr143's projects`), with the GitHub app installed on the repo | Frontend deploys. Redeploys from the dashboard may ask for a **passkey** |
| Render account owning `mayank-portfolio-api`, with GitHub connected | Backend deploys |
| Local only: Node 18+ (tested on 24), npm; Python 3.12; git | Building and running locally |
| Optional: `gh` CLI, Vercel CLI (`npm i -g vercel`) | Scripted merges and CLI deploys |

## Configuration

### Vercel: project `mayank-ranghadiya`

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework / Build / Output | Vite · `npm run build` · `dist` |
| Production branch | `main` (Settings → Environments → Production → Branch Tracking) |
| Env `VITE_API_BASE_URL` | `https://mayank-portfolio-api.onrender.com` (no trailing slash; baked in at **build** time, so redeploy after changing it) |

### Render: service `mayank-portfolio-api`

| Setting | Value |
|---|---|
| Runtime / plan / region | Docker · Free · Ohio (US East) |
| Repo / branch / root | `mayankWIZ/portfolio-ai-app` · `main` · `backend/` (Dockerfile `./Dockerfile`) |
| Health check | `/api/health` |
| Auto-deploy | On commit |
| Env `ALLOWED_ORIGINS` | Comma-separated CORS origins: `https://mayank-ranghadiya.vercel.app` plus `http://localhost:5173` for local dev |
| Env `PYBOT_REF` | `main`: branch/tag of the pybot fork to clone (Render passes env vars to Docker as build args) |
| Optional env | `RATE_LIMIT_PER_MIN` (default 40), `LOG_LEVEL` (default INFO) |

`render.yaml` is a Blueprint matching this service. The **dashboard values are what's live**; note the Blueprint's `ALLOWED_ORIGINS: "*"` is overridden in the dashboard.

## Normal flow (automatic)

1. Work on a branch, open a PR to `main`. Vercel posts a preview URL on the PR.
2. Merge the PR. Then:
   - **Vercel** builds `frontend/` and promotes it to production (~1 min).
   - **Render** rebuilds the Docker image and swaps it in with zero downtime (~1–3 min).
3. [Verify](#verify-a-deploy).

**CV or chat-rule changes** (pybot fork): push to the fork's `main`, then [redeploy Render manually](#render-backend). A push to the fork does **not** trigger Render. Then refresh the frontend's copy of the CV (used by the 3D town and Journey):

```sh
cd frontend && npm run sync-profile   # copies bot/portfolio/profile.json from the fork's main
git commit -am "Sync profile" && git push   # via a PR to main
```

## Manual deploys

### Vercel (frontend)

**Dashboard:** Project → Deployments → the latest `main` deployment → ⋯ → **Redeploy** → Environment *Production* → Redeploy. Confirm with your passkey if asked.

**CLI:**

```sh
cd frontend
vercel link            # once: pick team "mayankr143's projects", project "mayank-ranghadiya"
vercel --prod          # build & deploy the current directory to production
```

**Rollback:** Deployments → pick an older production deployment → ⋯ → **Instant Rollback**.

### Render (backend)

**Dashboard:** `mayank-portfolio-api` → **Manual Deploy** (top right) → **Deploy latest commit**. Use **Clear build cache & deploy** after changing the pybot fork, so the `git clone` layer isn't reused from cache.

Changing an env var with **Save, rebuild, and deploy** also triggers a deploy.

**Rollback:** Events/Deploys → pick a previous successful deploy → **Rollback**.

### Pin a different pybot version

Render → Environment → set `PYBOT_REF` to a branch or tag (e.g. `portfolio-module`, `v1.2`) → Save, rebuild, and deploy.

## Verify a deploy

```sh
# Backend health ("pybot" goes loading → ready about a minute after a cold start)
curl https://mayank-portfolio-api.onrender.com/api/health

# A real answer from the CV module (look for "module":"portfolio")
curl -X POST https://mayank-portfolio-api.onrender.com/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tell me about his time at Crest Data","agent":"career","session_id":"check"}'

# CORS from the live site (expect 200)
curl -o /dev/null -w '%{http_code}\n' -X OPTIONS https://mayank-portfolio-api.onrender.com/api/chat \
  -H 'Origin: https://mayank-ranghadiya.vercel.app' -H 'Access-Control-Request-Method: POST'
```

Frontend: open https://mayank-ranghadiya.vercel.app. Check "Explore my career in 3D" opens the Journey, and ask any agent a question. Test on a phone too (joystick and Jump/Inspect buttons).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chat shows "waking the server" for ~1 min | Render free instance was asleep | Normal; wait. Upgrade the plan to avoid it |
| Browser console: CORS error | Site origin not in `ALLOWED_ORIGINS` | Add the origin (comma-separated) on Render, save and deploy |
| Frontend calls `localhost:8000` in production | `VITE_API_BASE_URL` missing at build time | Set it on Vercel, then redeploy |
| Merged to `main` but site unchanged | Production branch not `main`, or build failed | Vercel → Settings → Environments → Production; check the deployment log |
| New CV text not in chat answers | Render didn't rebuild after the fork changed | Render → Manual Deploy → Clear build cache & deploy |
| Render build fails at `git clone` | `PYBOT_REF` names a branch/tag that doesn't exist | Fix `PYBOT_REF` |

## Run locally

See the README's "Run locally" section. Run the backend on `:8000` and the frontend with `VITE_API_BASE_URL=http://localhost:8000 npm run dev` (`http://localhost:5173` is already allowed by CORS).
