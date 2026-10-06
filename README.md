# Meridian Grid

**Universal Flexible-Load Orchestration Engine**

Built for CloudCampBD Congress — Idea to Unicorn (I2U) team track — **ClimaTech** domain, **Energy Brain** challenge.

## One-line pitch

An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset — industrial processes, batteries, EV fleets — into the cheapest, cleanest window, and explains every decision in plain language, for factories and grid operators alike.

> **Build status:** the data pipeline, forecasting, dispatch optimizer, JWT/RBAC auth, and SQLite persistence are implemented and run on cached historical data and synthetic demo facilities. The copilot, dashboard, what-if simulation, and EV fleet adapter are **planned** (see *What it does*). Known limitations are listed below.

## The problem

Facility managers make load-timing and battery decisions on instinct — no tool connects a solar/grid-stress forecast to a specific, explained action for their equipment. Utilities face the same integration gap one level up. Meridian Grid closes forecast → optimized action → plain-language explanation into one engine that serves both.

Full structured problem statement: see `docs/product/DESIGN.md` and `docs/product/MERIDIAN_GRID_IDEA.md`.

## What it does

- JWT-secured API with Role-Based Access Control (Admin, Grid Operator, Facility Manager)
- 6–24h solar irradiance forecast (LightGBM trained on NSRDB 2018–2020, Bangladesh) plus a persistence-based grid-carbon signal; fixed ±15% placeholder band and a backtested accuracy report
- Dispatch schedule across industrial flexible processes + battery storage (PuLP LP) using TOU price and grid carbon, compared against a start-at-earliest-time baseline on synthetic demo facilities
- Background auto-polling of live carbon data with SQLite persistence for historical dispatch runs and user management
- Two pluggable adapter axes (region, asset type); EU/US/EV-fleet adapters are documented stubs, not live

**Planned (not built yet):**

- KPI dashboard: $ saved, tCO2 avoided, peak kW shaved (the API already returns cost saved, CO2 saved in kg, and peak kW shaved)
- Conversational copilot with a role toggle (Facility Manager / Grid Operator) grounded in real tool calls
- What-if scenario simulation
- Live weather ingestion and solar-aware dispatch

## Known limitations (current build)

- **Demo data only.** Facilities, batteries, and the TOU tariff are synthetic/placeholder files loaded at start-up; users cannot yet supply their own.
- **Forecast is a demo forecast.** It runs on a cached historical feature table, so forecast timestamps follow the dataset's tail (2020) rather than the current time. The GFS sample covers only 2020-01 to 2020-05; later rows are forward-filled.
- **Accuracy is modest.** On the held-out window RMSE is 122 W/m² vs 140 for persistence, but MAPE (0.506) is worse than persistence; the test set is small (771 rows) and the model is untuned.
- **Confidence band is a fixed ±15%**, not a statistical interval.
- **Grid-carbon forecast is persistence** (last known value repeated), and Bangladesh carbon data is an estimated, lower-confidence tier with about one day of history so far.
- **The solar forecast is not yet an optimizer input.** The optimizer currently schedules on TOU price and grid carbon; with a flat carbon signal it mainly optimizes cost.
- **Savings figures** are modeled on synthetic facilities against a start-at-earliest-time baseline, not measured at a real site.
- A default admin account (`admin` / `admin123`) is seeded on first run and flagged `must_change_password`, but the API does not enforce the change; change it before exposing the API.

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
| Forecasting | LightGBM/GBM (MVP), LSTM/transformer (stretch) |
| Optimization | PuLP (linear programming) |
| Copilot (planned) | Local LLM via Ollama, function-calling, role-aware |
| Frontend (planned) | Next.js, React, Tailwind, recharts |
| Storage | Parquet (historical data) / SQLite (live DB) |
| Deployment | Local run with uvicorn (no Docker) |

## Quick start

```bash
git clone <repo-url>
cd CloudCamp
cp .env.example .env      # add your Electricity Maps API key (optional — falls back to cached data without it)

# Start Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# backend:  http://localhost:8000
```

## Repo structure

```
backend/       [Implemented] FastAPI services: data ingestion, forecasting, dispatch (RegionAdapter, AssetAdapter)
data/          [Implemented] Cached NSRDB/GFS samples, synthetic facility+battery generator
notebooks/     [Implemented] EDA and prototyping
agent/         [Planned] Copilot function-calling service (role-aware)
frontend/      [Planned] Next.js dashboard
docs/          [Implemented] Categorized documentation (architecture, product, development, ai-ml, submission, reference)
prompts/       [Planned] Prompt library (verbatim prompts used to build this) — folder to be added
```

## Data & AI provenance

| Source | Type | Region | Used for |
|---|---|---|---|
| NREL NSRDB | Public dataset | South/SE Asia (confirmed BD) | Historical cached data (2018–2020) — model training and demo forecast |
| NOAA GFS | Public dataset | Global | Historical cached sample (2020-01 to 2020-05) — cloud-cover features |
| Electricity Maps API | Real-time API | Bangladesh zone | Live poll — CO2 intensity + power mix (disclosed as a lower/estimated data tier; history is just starting to accumulate) |
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
