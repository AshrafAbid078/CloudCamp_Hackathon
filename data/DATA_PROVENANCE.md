# DATA_PROVENANCE.md — Meridian Grid

**Purpose:** Record of every dataset used in the project — source, region, date range, unit, null rate, and known gaps.
This feeds directly into the submission's Data & AI Provenance table (per `docs/development/structure.md` Phase 0 output).

---

## Dataset Registry

| # | File | Source | Region | Date Range | Granularity | Key Columns | Null Rate | Notes |
|---|------|--------|--------|------------|-------------|-------------|-----------|-------|
| 1 | `bangladesh_nsrdb_clean.parquet` | [NREL NSRDB](https://nsrdb.nrel.gov/) | Bangladesh (24.34°N 90.07°E) | 2018-01-01 → 2020-12-31 (UTC) | Hourly | GHI, DNI, DHI, Temperature, Wind Speed, Cloud Type | GHI complete; Solar Zenith Angle 52.35% missing | 26,304 rows. Metadata Time Zone=0 (already UTC); Local Time Zone=6 is display information. -9999 sentinels become missing. |
| 2 | `bangladesh_gfs_clean.parquet` | NOAA GFS | Bangladesh | 2020-01-01 → 2020-05-15 (raw monthly files `Bangladesh_GFS_2020_01..05.csv`) | Daily (135 observations) | cloud_cover_max_isobaric, temp_2m_k, wind_u/v, precip | None | Cached observations joined backward to hourly solar origins with a 24-hour maximum age; no indefinite fill or backward fill. |
| 3 | `bangladesh_carbon_intensity_clean.parquet` | [Electricity Maps API](https://app.electricitymaps.com/) | Bangladesh | 2026-08-15 22:20 → 2026-08-16 22:15 UTC (288 rows) | Five-minute | carbon_intensity_gco2eq_kwh, isEstimated, estimationMethod | None | **Very short static history.** Supplemented by DB auto-poll (see §Auto-Poll below). |
| 4 | `bangladesh_electricity_mix_clean.parquet` | Electricity Maps API | Bangladesh | Same window as carbon (~288 rows) | Five-minute | coal, gas, solar, wind, hydro, oil (% share) | Sparse (many sources 0 or null) | Renewable columns (nuclear, geothermal) are 0 for Bangladesh — correct. |
| 5 | `bangladesh_electricity_maps_clean.parquet` | Electricity Maps API | Bangladesh | Short (~96 rows) | Fifteen-minute | Same mix + hydro_storage, battery_storage flows | Sparse | Includes storage flows. 96 rows only. |
| 6 | `data/synthetic/facilities.parquet` | Generated (`facility_generator.py`) | N/A | N/A | N/A | name, power_kw, earliest_start, deadline, duration | None | Seeded synthetic (seed=42). **20** flexible industrial processes. |
| 7 | `data/synthetic/batteries.parquet` | Generated (`battery_generator.py`) | N/A | N/A | N/A | capacity_kwh, current_soc, charge_rate_kw, discharge_rate_kw | None | Seeded synthetic (seed=123). **5** battery assets. |
| 8 | `data/synthetic/tariff_placeholder.json` | Synthetic placeholder (no verified tariff citation) | Bangladesh | Demo only | Asia/Dhaka clock hours | TOU tiers off_peak / mid_peak / on_peak (USD/kWh) | N/A | **Placeholder only.** USD 0.05/0.10/0.20 per kWh; not a verified current utility tariff. |

---

## Known Gaps & Decisions

### GFS Sparsity
GFS raw data contains 135 daily timestamps from 2020-01-01 → 2020-05-15. Supplementary features expire after 24 hours and stay missing outside that window; LightGBM handles missing values. If the file is absent, serving switches to a compatible persistence baseline. A live GFS API integration would replace this for production.

### Carbon Intensity History (~1 day static)
Electricity Maps API free tier returns very limited history. Grid-stress forecast uses simple persistence extrapolation of last known value — deliberate, documented in code.

**Resolution:** See §Auto-Poll System below — the server now accumulates live readings in the `carbon_snapshots` DB table every 24 hours.

### OPSD / European Time-Series Data (`time_series_*_singleindex.csv`)
The EDA notebooks with `time_series_*_singleindex` are **OPSD European data, not Bangladesh data**. Column naming (DE_, FR_, etc.) confirms this. Not used in the Bangladesh MVP. Retained as reference for the stretch goal EU adapter.

### Electricity Tariff
The project has no live tariff integration. Fixed demonstration rates are indexed by Bangladesh local hour; no source establishing current utility rates was verified.

### NSRDB Coverage
2018–2020 (26,304 hourly rows). Features begin 2018-01-03 after 48-hour lags. Training: 20,961 rows, last training target 2020-05-26 08:00 UTC. First test origin: 2020-05-26 09:00 UTC. Training targets strictly precede test origins.

---

## Backtest Results (Phase 2 gate)

Repair run date: 2026-10-17. Held-out set: last 20% with a 24-hour target purge (5,247 hours; 2,534 daytime targets). Metrics describe the selected held-out comparison, not an independent production evaluation.
Daytime-only mask applied (GHI > 10 W/m²).

| Model | RMSE (W/m²) | MAPE (daytime) |
|-------|-------------|----------------|
| PersistenceBaseline (GHI at origin for target +24h) | 192.84 | 70.08% |
| LightGBM (n_estimators=100, lr=0.1) | 148.95 | 74.35% |

> **Note:** LightGBM MAPE is higher than baseline. The cause has not been established; these scores alone do not establish overfitting. LightGBM is still preferred (lower RMSE). Tuning is a stretch goal.

---

## DB Persistence (Phase 4)

Starting from Phase 4, the following data is also stored in the SQLite database (`backend/meridian.db`):

| Table | What it stores | Written by |
|---|---|---|
| `users` | Registered users with roles and hashed passwords | `auth/router.py` via admin |
| `dispatch_runs` | One row per `GET /dispatch/plan` call — KPIs, model used, who triggered it | `dispatch/api.py` |
| `carbon_snapshots` | Live Electricity Maps readings accumulated daily | `poller/electricity_maps.py` |

The parquet files remain the authoritative source for historical NSRDB and GFS data. The DB handles live, growing operational data.

---

## Auto-Poll System (Phase 4)

The backend runs a background APScheduler job (configurable via `POLL_INTERVAL_HOURS` in `.env`, default: 24h) that:

1. Calls `GET /v3/carbon-intensity/latest?zone=BD` on the Electricity Maps API
2. Parses `carbonIntensity`, `isEstimated`, `estimationMethod`, and `datetime`
3. Inserts a `CarbonSnapshot` row into the DB

**Data accumulation target:** daily readings build history, but daily cadence cannot resolve intraday variation. An intraday model needs denser observations and separate evaluation.

**Graceful degradation:** If `ELECTRICITY_MAPS_API_KEY` is empty or the API is down, the poller logs a warning and skips. Forecasting prefers a valid live reading no older than 48 hours (configurable), otherwise uses the static parquet fallback. Source time, age, estimated status and fallback reason are exposed. The historical solar timeline and carbon reading time are separate; this is not a synchronized historical replay.

---

*Last updated: 2026-10-17*
