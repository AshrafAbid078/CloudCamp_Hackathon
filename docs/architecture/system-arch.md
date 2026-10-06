# system-arch.md — Meridian Grid Technical Architecture

## 1. Architecture overview

```
 [NSRDB]   [NOAA GFS]   [Electricity Maps: BD zone]   [Synthetic facility+battery gen]
      \         |                  |                          /
       \        |             [ APScheduler ]                /
        \       |             [ 24h Poller  ]               /
         v      v                  v                       v
              +----------------------------+
              |  Data Ingestion / Poller   |  RegionAdapter: BDAdapter (live),
              |  (backend/data_pipeline)   |  EUAdapter/USAdapter (stubs)
              +-------------+--------------+
                            |
                     [ SQLite DB ] (carbon_snapshots)
                            |
                            v
              +----------------------------+
              |  Forecasting Service       |  GET /forecast/{region}
              |  (solar + grid-stress)     |  (JWT Auth Required)
              +----------------------------+
                        |
                        v
              +----------------------------+
              |  Dispatch / Optimizer      |  GET /dispatch/plan
              |  AssetAdapter: Industrial  |  (JWT Auth Required)
              |  + Battery (live),         |
              |  EVFleet (stub)            |
              +-------------+--------------+
                            |
                     [ SQLite DB ] (dispatch_runs, users)
                            |
                            v
              +----------------------------+        +------------------+
              |  Copilot Agent             |<------->|  Ollama (local)  |
              |  role: facility_manager /  |         +------------------+
              |  grid_operator             |
              +----------------------------+
                        |
                        v
              +----------------------------+
              |  Dashboard (Next.js)       |  login, role toggle, adapter indicators
              +----------------------------+
                        ^
                        |
                  operator/manager override
```

## 2. Components

### 2.1 Data ingestion (`backend/data_pipeline/`) [IMPLEMENTED]
- **NSRDB loader** — solar irradiance/meteorological data, confirmed South/SE Asia coverage. Cached historical dataset (2018–2020) for Bangladesh, used for model training and the demo forecast.
- **NOAA GFS client** — cloud-cover/atmospheric data, feeds the cloud-motion features in the solar forecast. Global, usable for any region. The current cached sample covers 2020-01 to 2020-05 only; later rows are forward-filled.
- **Electricity Maps client** — real-time BD-zone CO2 intensity + power mix. Live. Must cache last-good response and degrade gracefully on error or missing key; BD's data tier is disclosed as estimated/lower-confidence, not fully measured.
- **Synthetic facility + battery generator** — flexible-process list (name, power draw, allowable shift window, deadline) and battery state (capacity, current SoC, charge/discharge rate). No real facility or personal data, seeded for reproducibility.
- **RegionAdapter protocol** — `BDAdapter` implemented live; `EUAdapter` / `USAdapter` are classes that raise a clear `NotImplementedError` with a docstring describing exactly what they'd wire to (Open Power System Data–style for EU, PJM Data Miner–style for US). The stub exists in code, not only in a diagram — that's what makes the "generalizes" claim checkable.

### 2.2 Forecasting service (`backend/forecasting/`) [IMPLEMENTED]
- **Solar forecast:** gradient-boosted trees (LightGBM/GBM) on lag + calendar + weather features as the MVP, forecasting solar output 6–24h ahead. LSTM/temporal-fusion-transformer is the stated stretch target behind the *same* interface.
- **Grid-stress forecast:** simple short-horizon extrapolation of the Electricity Maps signal — kept deliberately simple, not oversold.
- **Evaluation:** backtest against a held-out window, report MAPE/RMSE, surface on the dashboard as an explicit accuracy number.
- **Interface:** `GET /forecast/{region}?horizon_hours=24` → solar forecast + grid-stress forecast + confidence band + accuracy.
- **Current implementation notes:** the grid-stress forecast repeats the last known carbon value (persistence); the confidence band is a fixed ±15%; inference uses the last N rows of the cached feature table, so forecast timestamps follow the dataset's tail rather than the current time; live weather ingestion is planned.

### 2.3 Dispatch / optimization agent (`backend/dispatch/`) [IMPLEMENTED]
- **AssetAdapter protocol** — `IndustrialProcessAdapter` and `BatteryAdapter` implemented live; `EVFleetAdapter` a documented stub, same NotImplementedError pattern as the region stubs.
- **Objective:** minimize `w1 * cost + w2 * emissions` across whichever adapters are registered, subject to each asset's own constraints (shift window/deadline for processes; SoC/capacity/rate for battery).
- **MVP algorithm:** linear program via PuLP, or a clearly-commented greedy fallback. **Not RL for the MVP** — RL is a stretch goal, only claim it if it's actually running.
- **Output:** per-asset schedule + aggregate KPI deltas vs. a naive baseline, broken out by asset type (industrial vs. battery) so the dashboard can show each contribution separately.
- **Interface:** `GET /dispatch/plan`.
- **Current implementation notes:** inputs are TOU price (placeholder tariff) and the grid-carbon signal; the solar forecast is not yet an optimizer input; baseline is "start at earliest start"; assets are synthetic files loaded at start-up.

### 2.4 Copilot agent (`agent/`) [PLANNED / FUTURE]
- Function-calling over four tools: `get_forecast`, `get_dispatch_plan`, `run_whatif(perturbation)`, `explain_decision(asset_id)`.
- Takes a `role` parameter (`facility_manager` / `grid_operator`) — same tools, different system prompt/response shaping. This is the live, on-camera proof of the dual-track business model, so the tonal difference needs to be real, not cosmetic.
- Local model via Ollama, base URL and model name from env vars (`OLLAMA_HOST`, `COPILOT_MODEL`) — never hardcoded.
- Never invents a number without a tool call.
- Structured so the same tool schema could become an MCP server later with minimal changes (noted in comments, not built yet).
- **Interface:** `POST /copilot/chat {message, role}` → `{reply, tool_calls[]}`.

### 2.5 Dashboard (`frontend/`) [PLANNED / FUTURE]
- Next.js + React + Tailwind + recharts.
- Panels: solar + grid-stress forecast chart, dispatch schedule (industrial + battery, "EV fleet — coming soon" stub panel), KPI cards (visually dominant), region-adapter indicator ("Live: Bangladesh · Architecture-ready: EU, US"), asset-adapter indicator ("Live: Industrial + Battery · Architecture-ready: EV Fleet"), role toggle (Facility Manager / Grid Operator), chat panel.

## 3. Data flow (numbered)

1. Ingestion refreshes NSRDB/GFS cache, Electricity Maps snapshot, and the synthetic facility/battery state.
2. Forecasting service reads ingestion outputs, produces solar + grid-stress forecast, caches result.
3. Dispatch agent reads forecast + fleet/facility constraints, solves the LP across registered asset adapters, caches the plan + baseline comparison.
4. Dashboard fetches forecast + plan on load, renders all panels including adapter indicators.
5. User asks the copilot a question in their current role → copilot calls one or more tools → tools re-read/re-run the relevant service → copilot returns a grounded, numeric, role-appropriate answer.
6. Any override is logged and folded into the next dispatch cycle.

## 4. Storage

- **Parquet files:** Used for static historical cache (NSRDB, GFS).
- **SQLite (via SQLAlchemy):** The live operational database (`meridian.db`) storing `users`, `dispatch_runs` (history), and `carbon_snapshots` (accumulated via daily poller).

## 5. Deployment [PLANNED / FUTURE]

This project does not use Docker (see `CONTRIBUTING.md`). Services run locally: FastAPI with uvicorn, and the frontend and Ollama as regular local processes once built.

## 6. Local model → task mapping

| Task | Tool |
|---|---|
| Architecture, prompts, debugging strategy, business-model wording | **Claude** |
| Actual multi-file scaffolding (FastAPI + Next.js) | **opencode** (North Mini Code / Nemotron 3 Ultra / DeepSeek V4 Flash / Mimo V2.5 / Big Pickle, rotated) |
| Small isolated snippets | **qwen2.5-coder:1.5b** |
| Reasoning-heavy debugging (LP infeasible, copilot role tone not actually different, tool-call loops) | **deepseek-r1:14b** |
| Docs polish, multimodal work if the CV stretch goal is attempted | **gemma4:12b** |
| Copilot's runtime model (production) | Whichever local model is set as `COPILOT_MODEL` — chosen for function-calling reliability |

## 7. API contracts (sketch)

```
POST /auth/login       { username, password } -> JWT Token
GET  /health
GET  /forecast/{region}?horizon_hours=24 (Requires JWT Bearer Token)
GET  /dispatch/plan                      (Requires JWT Bearer Token)
GET  /dispatch/history                   (Requires JWT, Grid Operator / Admin only)
POST /whatif           { perturbation: string }
POST /copilot/chat     { message: string, role: "facility_manager" | "grid_operator" }
```

## 8. Security / privacy

No real personal or facility data anywhere — synthetic data only, clearly labeled in the UI and in Data & AI Provenance. All API keys via env vars, never committed; `.env.example` provided.
