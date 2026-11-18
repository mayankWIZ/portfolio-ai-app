# Mayank Ranghadiya · Agent Town portfolio

An interactive portfolio: a small 3D town where five agents answer questions about my work. The agents run on
[PyBot](https://github.com/mayankWIZ/pybot), a chatbot written in plain Python (rules, no model), extended with a
module that knows my CV. **No LLM, no API keys, no per-message cost, and no invented facts.**

| Agent | Building | Ask about |
|---|---|---|
| Ava | Town Hall | overview, where to go next |
| Theo | Career HQ | experience, skills, **paste a job description for a fit check** |
| Nova | Engineering Lab | projects and systems |
| Max | Services Studio | services and engagements |
| Iris | Research Tower | AI governance, RAG, agents, rule-based bots |

## How it fits together

```
frontend/  React + Vite + Tailwind + React Three Fiber (3D town)  ──POST /api/chat──▶  backend/
backend/   Flask + gunicorn, a thin wrapper around PyBot
             1. bot.portfolio.engine   CV questions, answered by rules from profile.json (ms)
             2. bot.runtime            everything else: PyBot's ~640k lines of general rules
pybot fork bot/portfolio/profile.json  the CV: the single source of truth
```

### Update the CV

Edit `bot/portfolio/profile.json` in the [pybot fork](https://github.com/mayankWIZ/pybot) and push. The backend
picks it up on its next deploy. Then refresh the frontend's copy and push:

```sh
cd frontend && npm run sync-profile
```

## Run locally

```sh
git clone https://github.com/mayankWIZ/pybot ../pybot
cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
PYBOT_PATH=../../pybot .venv/bin/gunicorn main:app --bind 127.0.0.1:8000 --threads 8
cd ../frontend && npm install && npm run dev      # http://localhost:5173
```

## API

| Method | Path | Body / result |
|---|---|---|
| GET | `/api/health` | `{"status":"ok","pybot":"ready"}` |
| POST | `/api/chat` | `{"message","agent","session_id"}` → `{"reply","source","suggestions","ms"}` |
| GET | `/api/agents`, `/api/profile` | agents and the CV |

## Deploy (free)

Full guide (what runs where, why, settings, manual deploys, rollback, troubleshooting): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).


- **Backend → Render** (free web service, Docker): `render.yaml` is a Blueprint. The free plan sleeps after
  15 minutes idle and takes ~1 minute to wake; the frontend pings `/api/health` on load and shows "waking the server".
  The image clones the pybot fork at build time (`PYBOT_REF`, default `main`).
- **Frontend → Vercel** (Hobby): root directory `frontend`, env `VITE_API_BASE_URL=https://<your-api>.onrender.com`.
- Set `ALLOWED_ORIGINS` on the backend to the Vercel URL once it is live.
