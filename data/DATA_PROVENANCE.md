# DATA_PROVENANCE.md — Meridian Grid

**Purpose:** Record of every dataset used in the project — source, region, date range, unit, null rate, and known gaps.
This feeds directly into the submission's Data & AI Provenance table (per `docs/development/structure.md` Phase 0 output).

---

## Dataset Registry

| # | File | Source | Region | Date Range | Granularity | Key Columns | Null Rate | Notes |
|---|------|--------|--------|------------|-------------|-------------|-----------|-------|
| 1 | `bangladesh_nsrdb_clean.parquet` | [NREL NSRDB](https://nsrdb.nrel.gov/) | Bangladesh (23.7°N 90.4°E) | 2018-01-01 → 2020-12-31 (UTC) | Hourly | GHI, DNI, DHI, Temperature, Wind Speed, Cloud Type | Low (<1%) | 26,304 rows. One-axis tracking configuration. Timestamps converted from Asia/Dhaka to UTC. |
| 2 | `bangladesh_gfs_clean.parquet` | NOAA GFS | Bangladesh | 2020-01-01 → 2020-05-15 (raw monthly files `Bangladesh_GFS_2020_01..05.csv`) | 3-hourly → hourly (ffill) | cloud_cover_max_isobaric, temp_2m_k, wind_u/v, precip | None | GFS provides short-range NWP forecasts. Forward-fill applied to interpolate to hourly; rows after the GFS window are forward-filled. Processed row count not re-verified after the loader started ingesting all five monthly files. |
| 3 | `bangladesh_carbon_intensity_clean.parquet` | [Electricity Maps API](https://app.electricitymaps.com/) | Bangladesh | ~1 day of static history (288 rows) | Hourly | carbon_intensity_gco2eq_kwh, isEstimated, estimationMethod | None | **Very short static history.** Supplemented by DB auto-poll (see §Auto-Poll below). |
| 4 | `bangladesh_electricity_mix_clean.parquet` | Electricity Maps API | Bangladesh | Same window as carbon (~288 rows) | Hourly | coal, gas, solar, wind, hydro, oil (% share) | Sparse (many sources 0 or null) | Renewable columns (nuclear, geothermal) are 0 for Bangladesh — correct. |
| 5 | `bangladesh_electricity_maps_clean.parquet` | Electricity Maps API | Bangladesh | Short (~96 rows) | Hourly | Same mix + hydro_storage, battery_storage flows | Sparse | Includes storage flows. 96 rows only. |
| 6 | `data/synthetic/facilities.parquet` | Generated (`facility_generator.py`) | N/A | N/A | N/A | name, power_kw, earliest_start, deadline, duration | None | Seeded synthetic (seed=42). **20** flexible industrial processes. |
| 7 | `data/synthetic/batteries.parquet` | Generated (`battery_generator.py`) | N/A | N/A | N/A | capacity_kwh, current_soc, charge_rate_kw, discharge_rate_kw | None | Seeded synthetic (seed=123). **5** battery assets. |
| 8 | `data/synthetic/tariff_placeholder.json` | Approximated from BREB/PDB published slabs | Bangladesh | Current | N/A | TOU tiers off_peak / mid_peak / on_peak (USD/kWh) | N/A | **Approximation only.** Simplified BREB residential/industrial slab rates. Labeled as placeholder in code. |

---

## Known Gaps & Decisions

### GFS Sparsity
GFS raw data covers 2020-01-01 → 2020-05-15 only (3-hour resolution); later NSRDB rows are forward-filled. Used as a supplementary feature via forward-fill join. Model works without GFS (`gfs_df=None` path in `build_features()`). A live GFS API integration would replace this for production.

### Carbon Intensity History (~1 day static)
Electricity Maps API free tier returns very limited history. Grid-stress forecast uses simple persistence extrapolation of last known value — deliberate, documented in code.

**Resolution:** See §Auto-Poll System below — the server now accumulates live readings in the `carbon_snapshots` DB table every 24 hours.

### OPSD / European Time-Series Data (`time_series_*_singleindex.csv`)
The EDA notebooks with `time_series_*_singleindex` are **OPSD European data, not Bangladesh data**. Column naming (DE_, FR_, etc.) confirms this. Not used in the Bangladesh MVP. Retained as reference for the stretch goal EU adapter.

### Electricity Tariff
No real-time tariff API available. Placeholder uses simplified published BREB slab rates. Disclosed as approximate in code comments and here.

### NSRDB Coverage
2018–2020 (26,304 hourly rows). Training: 2018-01 to ~2020-10. Held-out test: last 20% (~2020-10 to 2020-12).

---

## Backtest Results (Phase 2 gate)

Run date: 2026-09-10. Held-out test set: 20% of data (time-based, last 1,751 hours).
Daytime-only mask applied (GHI > 10 W/m²).

| Model | RMSE (W/m²) | MAPE (daytime) |
|-------|-------------|----------------|
| PersistenceBaseline (24h lag) | 140.79 | 41.17% |
| LightGBM (n_estimators=100, lr=0.1) | 122.26 | 50.60% |

> **Note:** LightGBM MAPE is higher than baseline. This is expected for a 24h-ahead target without hyperparameter tuning — the tree overfits the training distribution. LightGBM is still preferred (lower RMSE). Tuning is a stretch goal.

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

**Data accumulation target:** 90+ rows over 90 days → sufficient for a real intraday carbon model.

**Graceful degradation:** If `ELECTRICITY_MAPS_API_KEY` is empty or the API is down, the poller logs a warning and skips. The server continues to operate normally using the static parquet file as fallback.

---

*Last updated: 2026-09-19*
