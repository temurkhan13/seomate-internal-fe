# SEOMATE Web

Next.js 16 + Tailwind CSS 4 inspection UI for SEOMATE captures. Server Components fetch directly from the FastAPI service via the typed client in `lib/api.ts`. Deploy target: Vercel.

## Stack

- Next.js 16.2 (App Router, React Server Components, Turbopack)
- React 19.2
- TypeScript 5
- Tailwind CSS 4
- No client-side data-fetching library at H1 (Server Components + native `fetch`)

## Setup

```bash
# from repo root
docker compose up -d                 # boot Postgres + pgvector
cd auditor && seomate migrate        # apply migrations once
seomate audit --config=configs/pixelette.yml   # produce a capture

# api terminal
cd api
UVICORN_LOG_LEVEL=warning ../auditor/.venv/Scripts/python -m seomate_api

# web terminal
cd web
npm install                          # one-time
API_BASE_URL=http://127.0.0.1:8000 npm run dev
# open http://localhost:3000
```

## Pages

| Route | Server-rendered |
|-------|-----------------|
| `/` | Redirects to `/audits` |
| `/audits` | List of all audits with status, duration, cost, outcome counts |
| `/audits/[auditId]` | Audit overview: stats, outcome counts, captures grouped by pillar |
| `/audits/[auditId]/captures/[variableId]` | Capture detail: rules with evidence, raw value, errors, data sources, taxonomy citations |

All pages are React Server Components. They fetch from the FastAPI layer at request time with `cache: "no-store"` — appropriate for the dogfood phase where every audit run produces fresh data.

## Environment

| Variable | Purpose | Default |
|----------|---------|---------|
| `API_BASE_URL` | Where Server Components fetch from | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_API_BASE_URL` | (reserved) browser-side fetches if/when we add Client Components | — |

---

## Multi-Repo Layout

This repo is one of three sibling repos that together form **SEOMATE Phase 1**:

| Repo | What |
|---|---|
| [`temurkhan13/seomate-ai`](https://github.com/temurkhan13/seomate-ai) | Auditor pipeline (Python CLI). Sole writer to the shared Postgres. Carries `docs/o1-taxonomy.md`. |
| [`temurkhan13/seomate-be`](https://github.com/temurkhan13/seomate-be) | Read-only FastAPI serving the inspection UI. Imports SQLAlchemy models from `seomate-ai`. |
| [`temurkhan13/seomate-fe`](https://github.com/temurkhan13/seomate-fe) | Next.js 16 + React 19 inspection UI. Talks to `seomate-be` over HTTP. |

**Original monorepo** (preserves the full 50-commit build history): [`h-chishty/seomate`](https://github.com/h-chishty/seomate). Handover authored 2026-05-15 by Humza Chishty. See `HANDOVER.md` and `ROADMAP.md` in this repo for full context, architecture, deferred work, and Phase 2/3 plans.

### Local dev across all three

Clone them as siblings under one parent directory:

```bash
mkdir seomate && cd seomate
git clone https://github.com/temurkhan13/seomate-ai.git
git clone https://github.com/temurkhan13/seomate-be.git
git clone https://github.com/temurkhan13/seomate-fe.git
```

Then per the setup notes above, `seomate-be` installs `seomate-ai` as an editable sibling: `pip install -e ../seomate-ai`.

`docker-compose.yml` lives in `seomate-be`; it boots the Postgres + pgvector instance that both the auditor and the API talk to.
