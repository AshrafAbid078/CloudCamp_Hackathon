# Meridian Grid

> **Current data setup (October 2026):** `frontend/` and `backend/` run a demo with a current Open-Meteo regional weather forecast when available. Electricity Maps v4 carbon forecasts require your API key; without one, carbon remains an explicitly labelled archived fallback. Facilities, batteries, and tariffs are synthetic/placeholder data. See [live data setup](docs/development/LIVE_DATA_SETUP.md). Some older design and pitch sections below describe planned capabilities.

**Universal Flexible-Load Orchestration Engine**

Built for CloudCampBD Congress — Idea to Unicorn (I2U) team track — **ClimaTech** domain, **Energy Brain** challenge.

## One-line pitch

An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset — industrial processes, batteries, EV fleets — into the cheapest, cleanest window, and explains every decision in plain language, for factories and grid operators alike.

> **Build status:** the API, JWT/RBAC auth, SQLite persistence, Next.js dashboard, optimizer, and PV scenario comparison run locally. Current Open-Meteo weather is used when available; Electricity Maps v4 carbon requires a key. Assets and tariffs remain synthetic. Live equipment control and a natural-language copilot are not connected.

## The problem

Facility managers make load-timing and battery decisions on instinct — no tool connects a solar/grid-stress forecast to a specific, explained action for their equipment. Utilities face the same integration gap one level up. Meridian Grid closes forecast → optimized action → plain-language explanation into one engine that serves both.

Full structured problem statement: see `docs/product/DESIGN.md` and `docs/product/MERIDIAN_GRID_IDEA.md`.

## What it does

- JWT-secured API with Role-Based Access Control (Admin, Grid Operator, Facility Manager)
- 6–24h current Open-Meteo regional GHI forecast when available, with explicitly labelled archived 2020 fallback and fixed ±15% display bounds
- Dispatch schedule across industrial flexible processes + battery storage (PuLP LP) using TOU price and grid carbon, compared against a start-at-earliest-time baseline on synthetic demo facilities
- Optional Electricity Maps v4 carbon forecast and latest-reading polling with SQLite persistence for snapshots, runs, and user management
- Two pluggable adapter axes (region, asset type); EU/US/EV-fleet adapters are documented stubs, not live

**Planned (not built yet):**

- Conversational copilot with a role toggle (Facility Manager / Grid Operator) grounded in real tool calls
- On-site weather and equipment telemetry, plus operational dispatch controls

## Known limitations (current build)

- **Demo data only.** Facilities, batteries, and the TOU tariff are synthetic/placeholder files loaded at start-up; users cannot yet supply their own.
- **Forecast is regional and modeled.** Open-Meteo provides current hourly weather-model predictions near Dhaka, not measured irradiance at a facility. If unavailable, the API clearly falls back to archived 2020 NSRDB/GFS sample data.
- **Accuracy is modest.** On the held-out window RMSE is 122 W/m² vs 140 for persistence, but MAPE (0.506) is worse than persistence; the test set is small (771 rows) and the model is untuned.
- **Confidence band is a fixed ±15%**, not a statistical interval.
- **Carbon depends on API access.** With an Electricity Maps key, the optimizer can use its v4 hourly BD forecast when available. Otherwise it uses a fresh reading held constant or an archived constant, with the source reported in the API and frontend.
- **Solar affects PV scenarios when capacity is supplied.** Default demo plans have zero installed PV and no measured facility base load. The placeholder TOU tariff and synthetic assets remain the dominant planning inputs.
- **Savings figures** are modeled on synthetic facilities against a start-at-earliest-time baseline, not measured at a real site.
- A fresh database receives a generated admin password in `backend/.initial-admin-credential`. Change it at first sign-in; this is a local demo, not a public deployment.

## Architecture at a glance

```
Data sources -> Ingestion -> Forecasting -> Dispatch/Optimizer -> Copilot <-> Dashboard
```

Full breakdown, API contracts, and adapter pattern: see `docs/architecture/system-arch.md`.
Full user journey and demo script: see `docs/product/APPLICATION_FLOW.md`.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy, APScheduler |
| Auth & DB | JWT (HS256), bcrypt, SQLite |
| Forecasting | Open-Meteo current regional weather; archived persistence fallback; LightGBM artifact disabled locally |
| Optimization | PuLP (linear programming) |
| Copilot (planned) | Local LLM via Ollama, function-calling, role-aware |
| Frontend | Next.js, React, Tailwind, recharts |
| Storage | Parquet (historical data) / SQLite (live DB) |
| Deployment | Local run with uvicorn (no Docker) |

## Quick start

The current application uses `frontend/` with `backend/`. Open-Meteo supplies a current regional forecast when reachable; carbon uses Electricity Maps v4 only when a key and BD forecast access are available. Assets and tariffs are still synthetic, and the app does not control live equipment. See [live data setup](docs/development/LIVE_DATA_SETUP.md) and [review remediation status](docs/development/PROJECT_REVIEW_2026-10-22.md#remediation-progress-23-october-2026).

```bash
git clone <repo-url>
cd CloudCamp
cp .env.example .env      # add your Electricity Maps API key (optional — falls back to cached data without it)

# Start Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# backend:  http://localhost:8000

# In another terminal, start the original frontend
cd frontend
npm ci
npm run dev
# frontend: http://localhost:3000
```

## Repo structure

```
backend/       [Implemented] FastAPI services: data ingestion, forecasting, dispatch (RegionAdapter, AssetAdapter)
data/          [Implemented] Cached NSRDB/GFS samples, synthetic facility+battery generator
notebooks/     [Implemented] EDA and prototyping
agent/         [Planned] Copilot function-calling service (role-aware)
frontend/      [Implemented demo] Next.js dashboard connected to the backend
docs/          [Implemented] Categorized documentation (architecture, product, development, ai-ml, submission, reference)
prompts/       [Planned] Prompt library (verbatim prompts used to build this) — folder to be added
```

## Data & AI provenance

| Source | Type | Region | Used for |
|---|---|---|---|
| NREL NSRDB | Public dataset | South/SE Asia (confirmed BD) | Historical cached data (2018–2020) — model training and demo forecast |
| NOAA GFS | Public dataset | Global | Historical cached sample (2020-01 to 2020-05) — cloud-cover features |
| Electricity Maps API v4 | Optional key | Bangladesh zone BD | Hourly forecast when available; latest reading stored by poller; archived fallback otherwise |
| Open-Meteo Forecast API | Current weather model | Near Dhaka | Hourly regional GHI forecast, with archived 2020 fallback |
| Open Power System Data | Public dataset | Europe only | Architecture reference only — not pulled |
| PJM Data Miner | Public/registered API | US (PJM) only | Architecture reference only — not pulled |
| Synthetic facility & battery data | Generated | N/A | Used for demo and tests — **no real personal or facility data used anywhere** |

Foundation models used: [fill in the specific local model wired as `COPILOT_MODEL` at submission time].

## Tooling & IDE disclosure

- **Claude** — planning, architecture, prompt drafting, debugging advice
- **opencode** — actual multi-file implementation (North Mini Code, Nemotron 3 Ultra, DeepSeek V4 Flash, Mimo V2.5, Big Pickle)
- **Ollama (local)** — deepseek-r1:14b (reasoning-heavy debugging), qwen2.5-coder:1.5b (small snippets), gemma4:12b (docs/multimodal)
- Memory/context files: `docs/reference/build-prompt.md` (project build/rules file fed to opencode), `docs/product/MERIDIAN_GRID_IDEA.md` (canonical spec reference)

## MCP usage disclosure

[Fill in once decided — the copilot's four tools are structured to become an MCP server; state whether that wrapper was actually built for this submission, or note it as a documented next step if not.]

## Prompt library

See `prompts/` — each entry is a verbatim prompt sent to opencode, with purpose, output summary, and a proprietary toggle.

## Business model

One engine, two go-to-market tracks, pitched in parallel: **Facility SaaS** (per-facility subscription + shared-savings option, sold to industrial plant managers) and a **Utility/DERMS platform** (white-label/API tier for utilities and VPP aggregators). Full detail: see `docs/product/MERIDIAN_GRID_IDEA.md` §4.

## Demo video

3–5 min, structured as: problem → solution walkthrough → live demo → role-toggle beat → team intro → CTA. Full script in `docs/product/APPLICATION_FLOW.md` §5. [Add YouTube link once recorded — must be Public or Unlisted, not Private.]

## Team & roles

[Fill in: names, roles, who owned which module, team leader identified.]

## Disclaimer

No real personal or facility data is used anywhere in this project — demo/training data is either public (NSRDB, NOAA GFS, Electricity Maps) or synthetically generated.
