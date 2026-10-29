<div align="center">

# ⚡ Meridian Grid
### Universal Flexible-Load Orchestration & Carbon-Aware Dispatch Engine

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Optimization](https://img.shields.io/badge/MILP_Solver-PuLP%20%2F%20HiGHS-orange?style=for-the-badge)](https://github.com/coin-or/pulp)

<p align="center">
  <b>Built for CloudCampBD Congress — Idea to Unicorn (I2U)</b><br>
  <i>ClimaTech Domain &bull; Energy Brain Challenge</i>
</p>

[Key Features](#-key-features) &bull;
[Architecture](#-system-architecture) &bull;
[Screenshots](#-product-showcase) &bull;
[Quick Start](#-quick-start) &bull;
[API Reference](#-api-endpoints) &bull;
[Data Provenance](#-data-provenance)

---

</div>

## 📌 Executive Summary

Industrial facilities and commercial microgrids face high peak-demand electricity tariffs and rising grid emissions, yet operational schedules and battery cycles are still managed manually on instinct. Utilities and grid operators face the complementary challenge: severe grid stress during peak hours with little real-time demand-side flexibility.

**Meridian Grid** bridges this gap by unifying **solar generation forecasting**, **grid carbon telemetry**, and **Mixed-Integer Linear Programming (MILP) dispatch optimization** into an automated, explainable platform. It dynamically shifts interruptible industrial loads and coordinates battery charging/discharging into the cleanest, most cost-effective operating windows.

---

## 🚀 Key Features

### ☀️ AI-Powered Solar & Weather Forecasting
- **Multi-Source Ingestion**: Live regional GHI (Global Horizontal Irradiance) and temperature forecasts via Open-Meteo API.
- **Historical Ground-Truth Baseline**: Cached multi-year satellite solar irradiance datasets (NREL NSRDB & NOAA GFS).
- **Flexible Horizons**: Dynamic 6h, 12h, and 24h rolling lookahead horizons with configurable confidence bands.

### ⚙️ Mixed-Integer Linear Programming (MILP) Dispatch Solver
- **Dual-Objective Optimization**: Minimizes composite objective `Cost + (Carbon Price × Emissions)` across time-of-use (TOU) tariffs.
- **Asset Constraint Modeling**:
  - **Flexible Industrial Processes**: Solves optimal run hours respecting duration, deadlines, power ratings, and non-interruptibility constraints.
  - **Battery Energy Storage Systems (BESS)**: C-rate limits, state-of-charge (SoC) bounds (10%–100%), and round-trip efficiency losses (95%).
  - **Site Interconnection**: Shared feeder capacity caps and PV co-generation balancing.
- **High-Performance Solvers**: Native PuLP integration with HiGHS and CBC backends.

### 🌍 Real-Time Carbon Telemetry & Polling
- **Live Carbon Intelligence**: Native integration with Electricity Maps v4 API for real-time grid carbon intensity (`gCO2eq/kWh`).
- **Telemetry Persistence**: Scheduled background polling with SQLite storage and automated freshness tracking.
- **Failover Guarantee**: Graceful fallback to verified regional historical averages if external telemetry is unreachable.

### 🛡️ Enterprise-Grade Security & RBAC
- **Role-Based Access Control**:
  - `facility_manager`: Manage assets, run dispatch simulations, execute manual overrides.
  - `grid_operator`: Monitor aggregate load shifting, feeder utilization, and system-wide grid relief.
  - `admin`: User provisioning, role assignment, system health monitoring.
- **Cryptographic Standards**: Salted bcrypt password hashing and stateless JWT bearer token authentication.

### 🎨 Next.js 16 Web Interface
- **Next.js App Router & Tailwind CSS**: Modern glassmorphism aesthetic with high contrast data visualizations.
- **Interactive Gantt & Time-Series Charts**: Real-time visual schedule inspection powered by Recharts.
- **Live KPI Simulator**: Instant financial and carbon savings comparisons against baseline "run-immediately" scenarios.

---

## 🖥️ Product Walkthrough

The running frontend includes a public landing page and authenticated dashboard, forecast, dispatch, history, and data-source views. Administrators can edit and schedule the public `/docs` showcase at `/docs-admin`. Design concepts and submission media are kept outside the GitHub repository; use the deployed application to evaluate the implemented screens.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph DataSources["External Data Ingestion"]
        OM["Open-Meteo API<br/>(Live Regional Weather)"]
        EM["Electricity Maps API v4<br/>(Live Carbon Intensity)"]
        NSRDB["NREL NSRDB / NOAA GFS<br/>(Historical Benchmarks)"]
    end

    subgraph Backend["FastAPI Backend Layer"]
        Poller["Background Poller & APScheduler"]
        ForecastEngine["Forecasting Service<br/>(Regional GHI & Generation)"]
        SolverEngine["Dispatch Optimizer<br/>(PuLP MILP / HiGHS Solver)"]
        AuthService["Auth & RBAC Service<br/>(JWT / bcrypt)"]
        DB[(SQLite / SQLAlchemy<br/>Snapshots & Runs)]
    end

    subgraph Frontend["Next.js 16 Presentation Layer"]
        AuthUI["Secure Auth<br/>(Login / Role Guard)"]
        DashboardUI["Operations Dashboard<br/>(KPI Cards & Telemetry)"]
        DispatchUI["Dispatch Studio<br/>(Interactive Gantt & Overrides)"]
        ForecastUI["Forecast Studio<br/>(Generation Curves)"]
    end

    OM --> ForecastEngine
    EM --> Poller
    Poller --> DB
    NSRDB --> ForecastEngine
    ForecastEngine --> SolverEngine
    DB --> SolverEngine
    SolverEngine --> DB
    AuthService --> DB

    AuthService <--> AuthUI
    ForecastEngine <--> ForecastUI
    SolverEngine <--> DispatchUI
    DB <--> DashboardUI
```

---

## 📂 Repository Structure

```
CloudCamp/
├── backend/
│   ├── alembic/              # Database schema migrations
│   ├── auth/                 # JWT authentication, user roles, security tests
│   ├── db/                   # SQLAlchemy database engine and data models
│   ├── dispatch/             # PuLP optimization solver, adapters, joint constraints
│   ├── forecasting/          # Weather and solar forecasting engine (Open-Meteo)
│   ├── poller/               # Background scheduler for carbon intensity telemetry
│   ├── config.py             # Typed Pydantic application settings
│   ├── main.py               # FastAPI application entrypoint & API routers
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js 16 App Router pages (Auth, Dashboard, Dispatch)
│   │   ├── components/       # Reusable UI, Gantt charts, KPI metrics, layout
│   │   ├── hooks/            # Custom React hooks (role verification, theme)
│   │   ├── lib/              # API clients, state stores, adapters, TypeScript types
│   │   └── styles/           # Global styles and design tokens
│   ├── package.json          # Node.js dependencies and build scripts
│   └── tailwind.config.ts    # Tailwind CSS design system configuration
├── data/                     # Processed historical data and synthetic demo assets
├── docs/                     # Public architecture and product documentation
│   ├── architecture/         # System architecture and frontend design specs
│   └── product/              # Product concept and application flow
└── pytest.ini                # Pytest configuration
```

---

## ⚡ Quick Start

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 20.9 or higher (`npm` included)
- **Git**

### 1. Clone & Configure
```bash
git clone https://github.com/AshrafAbid078/CloudCamp_Hackathon.git
cd CloudCamp_Hackathon

# Copy sample environment configuration
cp .env.example .env
```
> **Note**: An Electricity Maps API key is optional. If left unconfigured, the application automatically uses verified regional fallback data.

### 2. Backend Setup
```bash
# Navigate to backend and create virtual environment
cd backend
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
- **Web Application**: `http://localhost:3000`

---

## Deploy with Vercel + Render + Turso

The frontend runs on Vercel, the FastAPI backend runs on a Render Python web service, and Turso stores the SQLite-compatible application database. Local development still uses `backend/meridian.db` when the Turso variables are unset. A fresh Turso database starts empty; the local SQLite file is not uploaded automatically.

1. Create a Turso Cloud database and a **Read & Write** database token. Keep the token private.
2. Push the backend changes to GitHub. In Render, create a **Web Service** from this repository's `main` branch. Use **Root Directory `/`**, **Runtime Python 3**, **Region Singapore**, and **Free** instance type. Build command: `pip install -r requirements.txt`. Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Set these Render environment variables before relying on the service:

   | Variable | Value |
   | --- | --- |
   | `TURSO_DATABASE_URL` | The database URL from Turso, beginning with `libsql://`. |
   | `TURSO_AUTH_TOKEN` | The private Read & Write token from Turso. |
   | `SECRET_KEY` | A unique random string of at least 32 characters. |
   | `INITIAL_ADMIN_PASSWORD` | A unique first-login password of at least 20 characters. |
   | `CORS_ORIGINS` | The final Vercel HTTPS origin, with no trailing slash. |
   | `PYTHON_VERSION` | `3.11.11` (the Turso SQLAlchemy driver does not support Render's newer default Python). |

   Generate `SECRET_KEY` with `python -c "import secrets; print(secrets.token_hex(32))"`. Never add these secrets to Git. Render assigns a public `onrender.com` URL; verify its `/health` endpoint. Use the `admin` username and `INITIAL_ADMIN_PASSWORD` for first sign-in, change the password immediately, then remove `INITIAL_ADMIN_PASSWORD` from Render and redeploy.
4. Import the same repository into Vercel with **Root Directory `frontend`**. Set `NEXT_PUBLIC_API_URL` and `API_INTERNAL_URL` to the Render HTTPS origin without a trailing slash. Deploy. If Vercel assigns a different production origin, update Render `CORS_ORIGINS` and redeploy.

Render Free sleeps after inactivity, so its in-process Electricity Maps scheduler cannot poll reliably while the service is asleep. The API can use its labelled archived carbon fallback. Set `ELECTRICITY_MAPS_API_KEY` only after rotating the key that appeared in Git history. Test a full login, dispatch history write, restart, and read-back to verify Turso persistence. The `sqlalchemy-libsql` driver supports Linux/macOS, so the hosted connection must be validated on Render; local Windows tests cover the SQLite path and configuration.

## Alternative: Deploy with Vercel + Railway

This repository uses **Railway Railpack** for FastAPI and **Vercel** for Next.js. The Railway service must use the **repository root** (`/`) because the backend reads `data/processed` and `data/synthetic` beside `backend/`. The root `requirements.txt`, `.python-version`, and `railpack.json` configure its Python build and start command.

1. Push the reviewed changes to GitHub. Keep `.env`, `backend/meridian.db`, `.local-jwt-secret`, and `.initial-admin-credential` private; `.gitignore` excludes them.
2. In Railway, create a service from this GitHub repository. Set **Root Directory** to `/` (the repository root) and use **Railpack**. Attach a volume at `/app/storage` **before the first deploy**, then set these service variables:

   | Variable | Value |
   | --- | --- |
   | `DB_PATH` | `/app/storage/meridian.db` |
   | `SECRET_KEY` | A unique random string of at least 32 characters; never commit it. |
   | `INITIAL_ADMIN_PASSWORD` | A unique first-login password of at least 20 characters. |
   | `CORS_ORIGINS` | The final Vercel origin, such as `https://your-app.vercel.app` (no trailing slash). |
   | `ELECTRICITY_MAPS_API_KEY` | Optional; omit if you do not have zone access. |

   Railway's `PORT` is used by the Railpack start command. Generate a public Railway domain in the service's Networking settings. The local SQLite database is **not** uploaded; the deployed instance starts with a fresh database. Sign in as `admin` with `INITIAL_ADMIN_PASSWORD` and change it immediately. After the change, remove `INITIAL_ADMIN_PASSWORD` from Railway and redeploy; the existing account remains in the volume.
3. In Vercel, import the same GitHub repository with **Root Directory** set to `frontend`. Set `NEXT_PUBLIC_API_URL` to the full Railway HTTPS origin, without a trailing slash. Set `API_INTERNAL_URL` to the same origin for the server-rendered `/docs` availability check. Deploy the frontend. If Vercel assigns a different final URL, update Railway `CORS_ORIGINS` to match it exactly and redeploy the backend.
4. Check the Railway `/health` endpoint and the Vercel login, forecast, dispatch, and data pages. `/health` can report `degraded` when optional live carbon access is unavailable; inspect `forecast_ready`, `solver_ready`, and `assets_loaded` separately. The public `/docs` page is scheduled for **10–14 June 2027, Asia/Dhaka** by default. To show it during a different judging window, sign in as admin, open `/docs-admin`, set the window, and publish the draft. Verify `/docs` in a signed-out browser before sharing its link.

Railway's free trial has a limited credit and duration; monitor the service's usage. Its attached volume preserves the SQLite database across normal redeploys. See the [Railway FastAPI guide](https://docs.railway.com/guides/fastapi), [volume guide](https://docs.railway.com/volumes), and [Vercel monorepo guide](https://vercel.com/docs/monorepos).

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate user and receive JWT access token | Public |
| `POST` | `/auth/register` | Create a user account | Admin |
| `GET` | `/auth/me` | Fetch currently authenticated user profile | Authenticated |
| `GET` | `/forecast/bd` | Retrieve solar irradiance and generation forecast | Authenticated |
| `POST` | `/dispatch/runs` | Execute MILP optimization solver over specified horizon | Authenticated |
| `GET` | `/dispatch/runs/latest` | Fetch the most recent optimized dispatch plan | Authenticated |
| `POST` | `/dispatch/override` | Apply operator manual adjustments to asset schedules | Facility Manager / Admin |
| `GET` | `/data/carbon-snapshots` | Query historical grid carbon intensity telemetry ledger | Authenticated |
| `GET` | `/health` | Verify solver, forecast engine, and system readiness | Public |

---

## 📊 Data Provenance & Reliability

| Source | Provider | Type | Application Usage |
|---|---|---|---|
| **NSRDB** | NREL | Public Satellite Dataset | Baseline multi-year historical solar irradiance (Dhaka, Bangladesh) |
| **NOAA GFS** | NOAA | Numerical Weather Prediction | Cloud-cover indices and historical feature benchmarks |
| **Open-Meteo** | Open-Meteo GmbH | Live Operational Forecast | Current hourly regional GHI and temperature forecasts |
| **Electricity Maps** | Electricity Maps ApS | Real-Time Grid API | Live carbon intensity telemetry for Bangladesh grid zone (`BD`) |
| **Synthetic Portfolio** | Internal Generator | Synthetic Benchmark Data | Industrial processes and battery models for reproducible evaluation |

*Note: No proprietary or private industrial facility data is utilized. All operational assets and tariffs in the demo environment are synthetically generated for benchmark evaluation.*

---

## 👥 Hackathon Submission

- **Event**: CloudCampBD Congress — Idea to Unicorn (I2U)
- **Track**: ClimaTech Domain &bull; Energy Brain Challenge
- **Team**: Meridian Grid Development Team
- **License**: MIT License
