# Meridian Grid

**Universal Flexible-Load Orchestration Engine**

Built for CloudCampBD Congress — Idea to Unicorn (I2U) team track — **ClimaTech** domain, **Energy Brain** challenge.

## One-line pitch

An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset — industrial processes, batteries, EV fleets — into the cheapest, cleanest window, and explains every decision in plain language, for factories and grid operators alike.

## The problem

Facility managers make load-timing and battery decisions on instinct — no tool connects a solar/grid-stress forecast to a specific, explained action for their equipment. Utilities face the same integration gap one level up. Meridian Grid closes forecast → optimized action → plain-language explanation into one engine that serves both.

Full structured problem statement: see `docs/product/DESIGN.md` and `docs/product/MERIDIAN_GRID_IDEA.md`.

## What it does

- JWT-secured API with Role-Based Access Control (Admin, Grid Operator, Facility Manager)
- 6–24h solar output + grid-stress forecast (Bangladesh live pilot), with confidence bands and backtested accuracy
- Dispatch schedule across industrial flexible processes + battery storage, optimizing a blended cost + CO2 objective against baseline
- Background auto-polling of live carbon data with SQLite persistence for historical dispatch runs and user management
- KPI dashboard: $ saved, tCO2 avoided, peak kW shaved
- Conversational copilot with a role toggle (Facility Manager / Grid Operator) — same tools, different tone, grounded in real tool calls
- What-if scenario simulation
- Two pluggable adapter axes (region, asset type) so the architecture visibly generalizes beyond what's built live

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
| Auth & DB | JWT (HS256), passlib (bcrypt), SQLite |
| Forecasting | LightGBM/GBM (MVP), LSTM/transformer (stretch) |
| Optimization | PuLP (linear programming) |
| Copilot | Local LLM via Ollama, function-calling, role-aware |
| Frontend | Next.js, React, Tailwind, recharts |
| Storage | Parquet (historical data) / SQLite (live DB) |
| Deployment | docker-compose |

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
prompts/       [Implemented] Prompt library (verbatim prompts used to build this)
```

## Data & AI provenance

| Source | Type | Region | Used for |
|---|---|---|---|
| NREL NSRDB | Public dataset | South/SE Asia (confirmed BD) | Live — solar irradiance input |
| NOAA GFS | Public dataset | Global | Live — cloud-cover input |
| Electricity Maps API | Real-time API | Bangladesh zone | Live — CO2 intensity + power mix (disclosed as a lower/estimated data tier) |
| Open Power System Data | Public dataset | Europe only | Architecture reference only — not pulled |
| PJM Data Miner | Public/registered API | US (PJM) only | Architecture reference only — not pulled |
| Synthetic facility & battery data | Generated | N/A | Live — **no real personal or facility data used anywhere** |

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
