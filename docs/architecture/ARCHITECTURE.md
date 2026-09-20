# ARCHITECTURE.md — Meridian Grid System Architecture

**Version:** 1.0 | **Last Updated:** 2026-09-19

---

## Overview

Meridian Grid is an AI-powered energy optimization platform for Bangladesh. It provides:
- **Solar + grid-stress forecasting** using LightGBM on 3-year NSRDB data
- **Flexible load dispatch optimization** using a Linear Program (PuLP)
- **JWT-authenticated REST API** with role-based access control
- **Daily auto-polling** of live carbon intensity data (Electricity Maps)
- **SQLite persistence** for dispatch history and accumulated carbon readings

---

## System Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    External Sources                      │
│  NREL NSRDB    NOAA GFS    Electricity Maps API         │
└────┬───────────────┬────────────────┬────────────────────┘
     │ (parquet)     │ (parquet)      │ (REST, daily poll)
     ▼               ▼               ▼
┌──────────────┐ ┌──────────┐ ┌──────────────────────────┐
│ NSRDB Loader │ │GFS Loader│ │ poller/electricity_maps   │
│ (historical) │ │(~17 days)│ │ APScheduler 24h job       │
└──────┬───────┘ └────┬─────┘ └──────────┬───────────────┘
       │              │                  │
       │     features.py                 ▼
       └──────────────┴──→  ┌────────────────────────┐
                             │  carbon_snapshots (DB) │
                             └────────────┬───────────┘
                                          │
                             ┌────────────▼───────────┐
                             │  Forecasting Service    │
                             │  GET /forecast/{region} │
                             │  LightGBM + Persistence │
                             └────────────┬───────────┘
                                          │
                                          ▼
                             ┌────────────────────────┐
                             │  Dispatch Optimizer     │
                             │  GET /dispatch/plan     │
                             │  PuLP LP Solver         │
                             └────────────┬───────────┘
                                          │
                             ┌────────────▼───────────┐
                             │  dispatch_runs (DB)     │
                             │  KPI history            │
                             └────────────┬───────────┘
                                          │
                              ┌───────────▼──────────┐
                              │ Frontend Dashboard   │
                              │ Copilot Agent        │
                              └──────────────────────┘
```

---

## Component Reference

| Component | Package | Input | Output | Auth | Status |
|---|---|---|---|---|---|
| Config | `config.py` | `.env` | `settings` singleton | — | **[IMPLEMENTED]** |
| DB Engine | `db/database.py` | `settings.db_path` | SQLite sessions | — | **[IMPLEMENTED]** |
| Auth | `auth/` | `POST /auth/login` | JWT Bearer token | Public | **[IMPLEMENTED]** |
| User Mgmt | `auth/router.py` | JWT + request body | UserOut JSON | Admin only | **[IMPLEMENTED]** |
| NSRDB Loader | `data_pipeline/loaders/` | CSV files | `bangladesh_nsrdb_clean.parquet` | — | **[IMPLEMENTED]** |
| GFS Loader | `data_pipeline/loaders/` | CSV files | `bangladesh_gfs_clean.parquet` | — | **[IMPLEMENTED]** |
| Electricity Maps Loader | `data_pipeline/loaders/` | CSV files | `*carbon_intensity_clean.parquet` | — | **[IMPLEMENTED]** |
| Carbon Poller | `poller/` | Electricity Maps API | `CarbonSnapshot` DB rows | Background job | **[IMPLEMENTED]** |
| Feature Builder | `forecasting/features.py` | NSRDB + GFS parquet | Feature DataFrame | — | **[IMPLEMENTED]** |
| Forecaster | `forecasting/router.py` | Feature DataFrame | Solar GHI + carbon arrays | Any role | **[IMPLEMENTED]** |
| Optimizer | `dispatch/` | Forecast + assets | Schedule + KPIs | Any role | **[IMPLEMENTED]** |
| Dispatch History | `dispatch/api.py` | DB query | Last N run records | grid_operator+ | **[IMPLEMENTED]** |
| Copilot Agent | `agent/` | Chat + Role | Grounded answers + tool execution | Any role | **[PLANNED]** |
| Dashboard | `frontend/` | Next.js App | Visual interface | Any role | **[PLANNED]** |

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `username` | VARCHAR(64) UNIQUE | Login name |
| `hashed_password` | VARCHAR(256) | bcrypt |
| `role` | ENUM | `admin`, `grid_operator`, `facility_manager` |
| `must_change_password` | BOOLEAN | True for seeded admin |
| `is_active` | BOOLEAN | False = soft-deleted |
| `created_at` | DATETIME(tz) | UTC |

### `dispatch_runs`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `timestamp` | DATETIME(tz) | UTC, when run was triggered |
| `region` | VARCHAR(8) | e.g. `bd` |
| `hours` | INTEGER | Optimization horizon |
| `industrial_count` | INTEGER | Number of processes scheduled |
| `battery_count` | INTEGER | Number of batteries optimized |
| `cost_saved_usd` | FLOAT | System KPI: USD saved vs baseline |
| `co2_saved_kg` | FLOAT | System KPI: kg CO2 avoided |
| `peak_shaved_kw` | FLOAT | System KPI: kW peak demand shaved |
| `model_used` | VARCHAR(64) | `LightGBM` or `PersistenceBaseline` |
| `triggered_by` | VARCHAR(64) | Username of caller |

### `carbon_snapshots`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `polled_at` | DATETIME(tz) | UTC, when the API was called |
| `reading_datetime` | DATETIME(tz) | UTC, when the reading applies |
| `region` | VARCHAR(8) | Electricity Maps zone (e.g. `BD`) |
| `carbon_intensity_gco2eq_kwh` | FLOAT | gCO2eq per kWh |
| `is_estimated` | BOOLEAN | Whether value is estimated |
| `estimation_method` | VARCHAR(128) | e.g. `TIME_SLICER_AVERAGE` |
| `source` | VARCHAR(64) | `electricity_maps_api_v3` |

---

## Auth Flow

```
Client                         API
  │                             │
  │── POST /auth/login ─────────►│
  │   {username, password}       │  verify bcrypt hash
  │                             │  create JWT (HS256, 60min)
  │◄─ {access_token, role} ─────│
  │                             │
  │── GET /forecast/bd ─────────►│
  │   Authorization: Bearer <t>  │  decode JWT
  │                             │  check role in [facility_manager, grid_operator, admin]
  │◄─ {forecast JSON} ───────────│
  │                             │
  │── GET /dispatch/history ────►│
  │   Authorization: Bearer <t>  │  decode JWT
  │                             │  check role in [grid_operator, admin]
  │◄─ {runs JSON} ───────────────│
```

---

## API Endpoint Reference

### Auth (`/auth`)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Get JWT token |
| GET | `/auth/me` | Any | Your profile |
| PUT | `/auth/me/password` | Any | Change your password |
| POST | `/auth/register` | admin | Create a new user |
| GET | `/auth/users` | admin | List all users |
| DELETE | `/auth/users/{id}` | admin | Deactivate a user |

### Forecasting (`/forecast`)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/forecast/{region}` | Any | Solar + carbon forecast (24h default) |

### Dispatch (`/dispatch`)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/dispatch/plan` | Any | Run LP optimizer, log to DB |
| GET | `/dispatch/history` | grid_operator, admin | Last N dispatch runs |

### Meta
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/health` | Public | Server health check |
| GET | `/` | Public | Endpoint directory |
| GET | `/docs` | Public | Interactive Swagger UI |

---

## Running Locally

```bash
cd backend/

# 1. Copy and configure environment
cp .env.example .env
# Edit .env — add SECRET_KEY, ELECTRICITY_MAPS_API_KEY

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start server
uvicorn main:app --reload --port 8000

# 4. Open API docs
open http://localhost:8000/docs

# 5. Login as admin
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 6. Run tests
pytest -v
```

> **First boot:** Tables are created automatically. Default admin (`admin / admin123`) is seeded with `must_change_password=True`. Change via `PUT /auth/me/password`.
