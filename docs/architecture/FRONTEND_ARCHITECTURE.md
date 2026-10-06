# Frontend Architecture & Product Showcase
## Project: Meridian Grid — Universal Flexible-Load Orchestration Engine
### CloudCampBD, Idea to Unicorn — Domain: ClimaTech · Challenge: Energy Brain (Smart energy optimization and demand response)

Structure: 9 separate full pages/routes.

---

## 🏗️ Core Technology Stack (Industry-Level Architecture)

To ensure Meridian Grid is scalable, robust, and production-ready for enterprise applications, the frontend architecture relies on the following technologies:

- **Framework**: Next.js (App Router) with TypeScript for type-safety, modular routing, and optimized rendering.
- **State Management**: Zustand for global state management (e.g., toggling between Facility Manager vs. Grid Operator role context) to avoid prop-drilling across deep component trees.
- **Data Fetching & Caching**: TanStack React Query for efficient background polling (e.g., checking Electricity Maps data), intelligent caching, and streamlined error/loading states.
- **Real-Time Communications**: Server-Sent Events (SSE) or WebSockets for real-time Copilot chat streaming and instant dispatch override confirmations.
- **Styling & Design System**: Vanilla CSS with CSS Modules, strictly mapped to the "Twilight Grid" palette via CSS Variables. Radix UI Primitives (headless components) are used for building accessible, keyboard-friendly interactive components.
- **Resilience**: Next.js Error Boundaries (`error.tsx`) and Suspense boundaries (`loading.tsx`) to ensure graceful degradation. The core principle remains: *"Never fail silently, never a blank screen."*

---

## 📁 File Structure Map

```text
frontend/
├── src/
│   ├── app/                    # Next.js App Router (Pages & Routing)
│   │   ├── (auth)/             # Route Group: Authentication
│   │   │   └── login/page.tsx  # PAGE 2: /login (Auth Form)
│   │   ├── (dashboard)/        # Route Group: Authenticated App
│   │   │   ├── dashboard/page.tsx # PAGE 3: /dashboard (Overview & KPIs)
│   │   │   ├── forecast/page.tsx  # PAGE 4: /forecast (GHI Analysis)
│   │   │   ├── dispatch/page.tsx  # PAGE 5: /dispatch (Optimization Plan)
│   │   │   ├── copilot/page.tsx   # PAGE 6: /copilot (LLM Chat Interface)
│   │   │   ├── settings/page.tsx  # PAGE 7: /settings (System Health)
│   │   │   ├── data/page.tsx      # PAGE 8: /data (Data Provenance)
│   │   │   └── layout.tsx         # Dashboard layout (Sidebar, Navbar, Role Toggle)
│   │   ├── about/page.tsx      # PAGE 9: /about (Business Case)
│   │   ├── page.tsx            # PAGE 1: / (Landing Page)
│   │   ├── layout.tsx          # Root Layout (Providers, Global CSS)
│   │   ├── loading.tsx         # Global loading skeleton
│   │   └── error.tsx           # Global error boundaries
│   ├── components/             # Reusable UI Components
│   │   ├── common/             # Button, Input, Modal, Chip
│   │   ├── layout/             # Sidebar, Header, CopilotToggle
│   │   ├── charts/             # Recharts wrappers (ForecastChart, DispatchGantt)
│   │   └── features/           # Page specific logic (KPI Cards, OverridePanel)
│   ├── lib/                    # Core Utilities
│   │   ├── api/                # Fetch interceptors (services)
│   │   ├── store/              # Global State (Zustand)
│   │   ├── utils/              # Helper functions (date formatting, metrics calculation)
│   │   └── types/              # TypeScript Interfaces
│   ├── hooks/                  # Custom React Hooks (useRole, useCopilot)
│   └── styles/                 # Global CSS and Variables
```

---

## PAGE 1: `/` — Landing Page

**Purpose:** First impression, looks good in demo video, doubles as the opening/closing shot of the 3–5 min YouTube demo.

- Hero section: project name + one-line pitch ("An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset into the cheapest, cleanest window — and explains every decision in plain language.")
- Shorter tagline treatment: "One engine. Any flexible load. Anywhere the sun and the grid don't quite agree."
- Background visual: a subtle day/night solar-cycle motif (gold sweeping across a navy grid line) rather than stock imagery.
- Primary CTA button: "Open Dashboard" → navigates to `/login`
- Stats bar: "10 domains · 100 challenges" context aside, plus live product stats once available — "$X saved this session", "Y forecasts run", "Z facilities simulated (Bangladesh data, synthetic)"
- Adapter framing line, visible without scrolling: "Live: Bangladesh · Architecture-ready: EU, US"
- Footer: NASA-style data attribution equivalent — NREL NSRDB / NOAA GFS / Electricity Maps credit, team name

---

## PAGE 2: `/login` — Sign In (Onboarding)

**Purpose:** Authenticate and establish role context before anything else loads.

- Username/password form, JWT auth (`POST /auth/login`)
- No role toggle here — role is read from the account, but the copilot/dashboard role-view toggle (Facility Manager / Grid Operator) only becomes active post-login
- First-boot notice (muted text, non-alarming): seeded admin account must change password on first login
- "Find My Plan" equivalent: on success, routes straight to `/dashboard` with the user's forecast/dispatch data pre-loaded — no extra selection step, since (unlike a site-picker) Meridian Grid's region is fixed to the implemented region (Bangladesh) for this build

---

## PAGE 3: `/dashboard` — Overview / Main Results Page

### 3.1 Left Sidebar — Adapter & Filter Status
- Region adapter status: Bangladesh (live) / EU, US (architecture-ready — greyed, `--tag-architecture-ready` chip)
- Asset adapter status: Industrial + Battery (live) / EV Fleet (architecture-ready — same treatment)
- Forecast horizon selector: 6h / 12h / 24h
- Role toggle: Facility Manager ⚡ / Grid Operator 🏭 — persists across every page from here on

### 3.2 Center — Forecast + KPI Hero
- Solar + grid-stress forecast chart (6–24h), confidence band shown, `--accent-solar` line for solar, muted line for grid-stress
- **KPI cards** (visually dominant, largest elements on the page): $ saved, tCO2 avoided, peak kW shaved — each vs. no-optimization baseline
- End-of-day auto-generated savings summary panel (appears once the day's data is in)

### 3.3 Right Sidebar — Today's Dispatch Summary
- Scrollable card list, top scheduled actions for today:
  - Asset name + type (industrial process / battery)
  - Scheduled window (time range)
  - Its individual $ / tCO2 contribution
  - "View Full Plan" button → navigates to `/dispatch`

### 3.4 Empty / Error States (Graceful Degradation via React Query & Suspense)
- Electricity Maps API down or rate-limited → banner: "Showing last cached grid reading from [timestamp]" (never a blank chart)
- Forecast confidence below threshold → banner: "Today's forecast has lower confidence — review before approving the plan"
- No dispatch plan generated yet → "Running today's optimization…" loading skeleton, not a blank panel

---

## PAGE 4: `/forecast` — Forecast Detail Page

**Purpose:** Deep analysis of the solar + grid-stress forecast.

- Header: region (Bangladesh), horizon selector, primary target — GHI (solar irradiance), large and prominent
- **Forecast chart**: GHI as the hero line; optional overlay toggles for DNI, DHI, Clearsky GHI/DNI/DHI (off by default, opt-in — keeps the chart from Roadmap-recommended clutter)
- **Backtested Accuracy Breakdown**: MAE / RMSE / MAPE, GBM (LightGBM) vs. persistence baseline, shown as the forecasting-layer equivalent of a factor-by-factor score
- **Data Confidence / Quality Indicator**: surfaces `isEstimated` / `estimationMethod` from the Electricity Maps feed directly on screen
- **Grid-Stress Forecast panel**: visually simpler chart style (fewer gridlines, a "simplified model" tag)
- **Model indicator**: shows which model actually produced the plan — `LightGBM` or `PersistenceBaseline` (the honest fallback path)
- **Data table**: raw values side by side — NSRDB historical vs. GFS forecast inputs — each row links to its source dataset

---

## PAGE 5: `/dispatch` — Dispatch Plan Page

**Purpose:** Show the optimizer's decision and let the user act on it.

- **Schedule table/timeline**, industrial and battery kept as separate tracks:
  - Industrial: `power_kw`, `earliest_start`, `deadline`, `duration`, chosen run window
  - Battery: `capacity_kwh`, `current_soc`, `charge_rate` / `discharge_rate`, charge/discharge windows
- KPI deltas shown **per track**, not just one blended total, so each asset type's contribution is legible
- **"EV Fleet — coming soon" stub panel**, visibly present, disabled, `--tag-architecture-ready` styling
- **Cost basis note**: dispatch cost term now uses an approximated BREB/PDB-style tariff structure
- **Override control**: approve or override specific slots; a rejected override shows a specific reason
- **History view** (`GET /dispatch/history`, grid_operator/admin only): past runs, KPI trend chart over time
- Combined KPI trend chart (line): cost saved + CO2 avoided over the last N runs

---

## PAGE 6: `/copilot` — Copilot Page (LLM Interface)

**Purpose:** The conversational explanation layer (powered by WebSockets/SSE for fluid streaming).

- Chat panel; every reply shows a small "called: {tool}" chip for whichever of the four tools fired (`get_forecast`, `get_dispatch_plan`, `run_whatif`, `explain_decision`) — numeric answers must trace back to a real tool call
- **What-if input**: e.g. "what happens if solar drops 30% this afternoon" → triggers `run_whatif` → returns a plain-language delta plus an updated chart
- **Role-tone demonstration**: flipping the header role toggle here visibly changes response style for the same question — terser/numeric for Grid Operator, plainer/action-first for Facility Manager.
- Tool-call failure state: a graceful chat error message; the rest of the dashboard stays unaffected

---

## PAGE 7: `/settings` — System Status Page

**Purpose:** Transparency on what's live vs. stubbed, and system health.

- Region adapter status detail: Bangladesh (live) vs. EU/US (stub)
- Asset adapter status detail: Industrial + Battery (live) vs. EV Fleet (stub)
- Data source health: last Electricity Maps poll timestamp, cache status
- **Known gaps panel**: anything from the stretch list not yet completed (LSTM/transformer swap, RL dispatch policy, EV fleet wiring, EU/US wiring, CV panel-degradation module)
- User management (admin only): list/deactivate users

---

## PAGE 8: `/data` — Data & Provenance Page

**Purpose:** Transparency page — boosts credibility with judges, mirrors `data/DATA_PROVENANCE.md` in the repo.

- Full table of every dataset used (NREL NSRDB, NOAA GFS, Electricity Maps, Open Power System Data, PJM Data Miner)
- Explicit statement: no real personal or facility data used anywhere; all synthetic data is seeded for reproducibility
- Explicit statement: Bangladesh Electricity Maps tier is disclosed as estimated/lower-confidence
- Methodology note: how the forecast confidence band and backtested accuracy are calculated, and dispatch objective `w1·cost + w2·emissions` is weighted

---

## PAGE 9: `/about` — About / Judge Landing Page

**Purpose:** Business case + differentiation.

- One-line pitch + tagline, chosen domain/challenge restated
- **Business Model panel**: dual-track table — Facility SaaS vs. Utility/DERMS Platform
- **Differentiation panel**: one line each vs. FlexiDAO, Stem, AutoGrid, DeepMind wind forecasting
- Link to prototype/repo and YouTube demo

---

## Global Elements (present on all pages)

- **Header/navbar**: logo, page nav, role toggle, user menu — visible and accessible from every page
- **Banner system**: one shared component for every failure/edge case — Electricity Maps fallback, low-confidence forecast, copilot tool failure, override rejection
- **Adapter chips**: one shared `--tag-architecture-ready` component reused globally
- Consistent loading states (Suspense boundaries) wherever an API is in flight
- Responsive layout (mobile-friendly), readable on a phone
- Consistent error handling: a failed API call shows a retry option

---

## Backend API notes for frontend developers

- **Base URL / CORS:** API runs on `http://localhost:8000`. CORS allows `http://localhost:3000` and `http://127.0.0.1:3000` by default; change via `CORS_ORIGINS` in `.env`.
- **Auth:** `POST /auth/login` returns `access_token`, `role`, `must_change_password`. Send `Authorization: Bearer <token>`.
- **`must_change_password` is a flag only.** The API does not block other endpoints until the password is changed — the frontend must route the user to `PUT /auth/me/password` when it is `true`.
- **Dispatch KPIs** (`GET /dispatch/plan` → `plan.kpis`): `cost_saved_usd`, `co2_saved_kg` (also `emissions_saved_gco2`), `peak_baseline_kw`, `peak_optimized_kw`, `peak_shaved_kw`. A negative `peak_shaved_kw` means the optimized plan raised the system peak. Per-asset deltas are in `plan.industrial[]` and `plan.batteries[]`.
- **`GET /dispatch/history`** (grid_operator/admin only) returns the same three KPIs per run for trend charts.
- **Forecast timestamps** follow the cached dataset's tail (2020), not the current time — label charts accordingly. Confidence band is a fixed ±15%; grid-stress is a flat persistence line.
- **Prices** are a placeholder TOU tariff in USD/kWh.

---

## Feature Priority (for time-constrained build)

### Must-have (core demo)
- Dashboard (Page 3)
- Forecast Detail (Page 4)
- Dispatch Plan (Page 5)
- Copilot (Page 6)
- Login (Page 2)

### Cut-if-needed (nice-to-have)
- Data & Provenance (Page 8)
- Settings (Page 7)
- Dispatch history/KPI trend chart on Page 5
- Landing Page (Page 1) polish

---

## Color Palette (Twilight Grid)

Base concept: a **twilight grid** — deep control-room navy, lit by solar gold and clean-dispatch jade, with coral reserved only for stress/alerts. These are implemented as CSS Custom Properties in `variables.css`.

| Token | Hex | Role |
|---|---|---|
| `--bg-base` | `#0E1B2A` | Primary app background |
| `--bg-surface` | `#152A3F` | Cards, panels, sidebar |
| `--bg-surface-raised` | `#1C3550` | Hover states, active panel, modals |
| `--accent-solar` | `#E8A33D` | Solar forecast lines, primary CTAs, active nav |
| `--accent-clean` | `#2FA98C` | Optimized/low-carbon states, savings numbers, success |
| `--accent-stress` | `#E0604D` | Grid-stress alerts, negative deltas, errors |
| `--text-primary` | `#F3EFE6` | Main text |
| `--text-muted` | `#93A3B5` | Secondary text, labels, timestamps |
| `--border-hairline` | `#26405C` | Dividers, card borders, chart gridlines |
| `--tag-architecture-ready` | `#5B6B7C` | Neutral slate for any "not live" stub label |

Typography: **Space Grotesk / General Sans** for headings. **Inter / IBM Plex Sans** for body and tabular figures in KPI/dispatch tables. Monospace for raw copilot tool-call traces.
