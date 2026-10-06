# Meridian Grid — Agent Project Structure & Rules

This document serves as the master structural reference for AI agents working on the Meridian Grid project. It synthesizes the architecture, design, application flow, and build prompts into a single source of truth.

**Project:** Meridian Grid — Universal Flexible-Load Orchestration Engine
**Core Concept:** One Forecast → Optimize → Explain engine, pluggable on two axes (Region and Asset) to generalize globally.

---

## 1. Directory Structure

The project is built as a monorepo. Agents must adhere to this structure:

```text
CloudCamp/
├── backend/                  # [IMPLEMENTED] Python 3.11, FastAPI
│   ├── config.py             # Pydantic-settings: all env config (.env → Settings)
│   ├── main.py               # Unified FastAPI app — mounts all routers, runs lifespan
│   ├── requirements.txt      # All backend dependencies
│   ├── .env.example          # Template — copy to .env and fill secrets
│   │
│   ├── auth/                 # JWT authentication & role management
│   │   ├── __init__.py
│   │   ├── router.py         # POST /auth/login, GET /auth/me, POST /auth/register, ...
│   │   ├── schemas.py        # Pydantic: LoginRequest, Token, UserCreate, UserOut
│   │   └── utils.py          # hash_password, create_access_token, require_role()
│   │
│   ├── db/                   # SQLAlchemy ORM — SQLite persistence
│   │   ├── __init__.py
│   │   ├── database.py       # Engine, SessionLocal, Base, get_db(), init_db()
│   │   └── models.py         # User, DispatchRun, CarbonSnapshot tables
│   │
│   ├── poller/               # Background auto-poll (APScheduler)
│   │   ├── __init__.py
│   │   ├── electricity_maps.py  # poll_carbon_intensity() → CarbonSnapshot row
│   │   └── scheduler.py      # start_scheduler() / stop_scheduler() lifespan hooks
│   │
│   ├── data_pipeline/        # Data ingestion, loaders, synthetic generators
│   │   ├── loaders/          # nsrdb_loader.py, gfs_loader.py, electricity_loader_map.py
│   │   ├── generators/       # facility_generator.py, battery_generator.py
│   │   └── validate_pipeline.py
│   │
│   ├── forecasting/          # Solar output & grid stress forecasting service
│   │   ├── features.py       # build_features() — lag + cyclic + GFS join
│   │   ├── router.py         # GET /forecast/{region}?horizon_hours=N
│   │   └── models/           # base.py, baseline.py, lgbm.py, saved/
│   │
│   └── dispatch/             # Optimization agent (PuLP LP solver)
│       ├── adapters.py       # AssetAdapter Protocol + IndustrialProcess/Battery adapters
│       ├── api.py            # GET /dispatch/plan, GET /dispatch/history
│       ├── objective.py      # calculate_objective(cost, emissions, w1, w2)
│       ├── planner.py        # dispatch_plan() orchestrator
│       └── solver.py         # solve_process_schedule(), solve_battery_schedule()
│
├── frontend/                 # [PLANNED] Next.js + React + Tailwind + recharts (Dashboard)
├── agent/                    # [PLANNED] Copilot function-calling service (Ollama integration)
├── data/                     # [IMPLEMENTED] Strictly datasets (raw, processed, synthetic)
│   ├── DATA_PROVENANCE.md    # Full dataset registry with sources, gaps, and DB info
│   ├── processed/            # Cleaned parquet files (output of data_pipeline)
│   └── synthetic/            # Generated facilities, batteries, tariff JSON
└── docs/                     # Documentation
    ├── ARCHITECTURE.md       # Full system architecture, data flow, API reference
    └── ROLES.md              # Auth role reference card and permissions matrix
```

---

## 2. Core Architecture & Components

### A. Config (`backend/config.py`)
Central `pydantic-settings` `BaseSettings` object. Reads from `.env`.
**Rule:** Never hard-code secrets, API keys, or paths anywhere. Always import from `config.settings`.

### B. Database (`backend/db/`)
SQLite via SQLAlchemy. Three tables: `users`, `dispatch_runs`, `carbon_snapshots`.
- `init_db()` called at startup — creates tables if missing, never drops data.
- Default admin user (`admin / admin123`, `must_change_password=True`) seeded on first run.
- `get_db()` used as `Depends()` throughout the API for session-per-request.

### C. Auth (`backend/auth/`)
JWT-based authentication with three roles: `admin`, `grid_operator`, `facility_manager`.
- `POST /auth/login` → returns a signed JWT (HS256, 60 min default).
- All forecast and dispatch endpoints require a Bearer token.
- `require_role(*roles)` is a FastAPI `Depends()` factory — one line to protect any route.
- See `docs/ROLES.md` for full permissions matrix.

### D. Auto-Poll (`backend/poller/`)
APScheduler `BackgroundScheduler` runs `poll_carbon_intensity()` every `POLL_INTERVAL_HOURS` (default: 24).
- First poll runs immediately on startup to populate the DB right away.
- Requires `ELECTRICITY_MAPS_API_KEY` in `.env`. Fails gracefully if missing.
- Written readings go to the `carbon_snapshots` table, growing the carbon history daily.

### E. Data Ingestion (`backend/data_pipeline/`)
- **NSRDB Loader:** Pulls solar irradiance data (cached historical data: Bangladesh).
- **NOAA GFS Client:** Pulls cloud-cover/atmospheric data.
- **Electricity Maps Client:** Pulls real-time CO2 intensity + power mix. **Rule:** Must cache last-good response and degrade gracefully.
- **Synthetic Generators:** Seeds flexible industrial processes and battery states. **Rule:** No real personal/facility data allowed.

### F. Forecasting Service (`backend/forecasting/`)
- **Solar Forecast:** Uses gradient-boosted trees (GBM) on lag + calendar + weather features (MVP).
- **Grid-Stress Forecast:** Short-horizon persistence of the Electricity Maps carbon signal.
- **API:** `GET /forecast/{region}?horizon_hours=24` (returns forecasts, confidence band, and backtested accuracy).
- **Auth:** All roles required (Bearer token).

### G. Dispatch / Optimizer (`backend/dispatch/`)
- **Objective:** Minimize `w1 * cost + w2 * emissions` subject to asset constraints.
- **Algorithm:** Linear Program (LP) via PuLP. **Rule:** Do NOT use Reinforcement Learning (RL) for the MVP.
- **API:** `GET /dispatch/plan` — runs optimizer, logs `DispatchRun` to DB, returns schedule + KPI deltas.
- **History:** `GET /dispatch/history` — grid_operator + admin only, returns last N runs from DB.
- **Auth:** `facility_manager`, `grid_operator`, `admin` for `/plan`; `grid_operator`, `admin` for `/history`.

### H. Copilot Agent (`agent/`)
- **Tools:** `get_forecast`, `get_dispatch_plan`, `run_whatif(perturbation)`, `explain_decision(asset_id)`.
- **Role Toggle:** Must adapt tone between `facility_manager` (action-first) and `grid_operator` (numbers-first, technical).
- **Rule:** Never invent a number without a tool call.

---

## 3. The Adapter Pattern (Crucial Rule)

The architecture generalizes via two adapter axes.

1. **RegionAdapter:**
   - **Live:** `BDAdapter` (Bangladesh)
   - **Stubs:** `EUAdapter`, `USAdapter`
2. **AssetAdapter:**
   - **Live:** `IndustrialProcessAdapter`, `BatteryAdapter`
   - **Stubs:** `EVFleetAdapter`

**STUB RULE:** Do not let stub adapters silently do nothing. Each stub class MUST raise a clear `NotImplementedError` with a docstring describing exactly what external API it would wire to.

---

## 4. Application Data Flow

```
[Electricity Maps Poll] ──→ carbon_snapshots (DB, daily)
                                    │
[NSRDB / GFS parquet] ─────────────┼──→ Forecasting Service ──→ solar_ghi + grid_stress_gco2
                                    │           │
                                    └───────────┘
                                                │
                                     Dispatch Optimizer (PuLP LP)
                                                │
                                    dispatch_runs (DB) + JSON response
                                                │
                                     Dashboard + Copilot
```

1. **Ingestion:** Refreshes data caches (NSRDB, GFS, Electricity Maps) and synthetic states.
2. **Forecast:** Service reads ingestion outputs → solar + grid-stress forecasts.
3. **Dispatch:** Solves LP across registered adapters → logs run to DB → returns KPI deltas.
4. **Dashboard:** Renders forecast charts, dispatch schedules, KPI cards, adapter indicators.
5. **Copilot:** User interacts in their role; Copilot calls tools → grounded numeric answers.

---

## 5. Agent Development Rules

- **API Keys:** Must be handled via `.env` variables. Never commit secrets. Use `.env.example`.
- **Honesty in Demo:** Always disclose data provenance (e.g., Bangladesh Electricity Maps data is estimated).
- **Tool Fallbacks:** If Electricity Maps is down, use the parquet cache. If a stub is called, return the architecture-ready NotImplementedError.
- **No Hallucinations:** The Copilot must strictly rely on the forecasting and dispatch APIs for numbers.
- **Auth:** All new routes must declare a `require_role()` dependency. No unprotected write endpoints.
- **DB Sessions:** Use `Depends(get_db)` — never create `SessionLocal()` directly in a route handler.
