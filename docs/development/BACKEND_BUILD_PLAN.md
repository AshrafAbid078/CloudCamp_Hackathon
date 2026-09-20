# BACKEND_BUILD_PLAN.md — Meridian Grid

**Purpose:** A step-by-step, phase-by-phase plan for building the backend manually (no vibe-coding) — understand each part before writing or accepting AI-generated code for it.
**Timeline assumption:** ~90 days available.
**Source docs:** `MERIDIAN_GRID_IDEA.md` (idea), `DESIGN.md` (problem/solution), `system-arch.md` (architecture), `build-prompt.md` (opencode prompts) — this file sequences the actual build work referenced in those docs.
**Principle:** Finish and verify one phase before starting the next. Every function you accept from AI-generated code, you should be able to explain in your own words — input, output, logic. If you can't, that's vibe-coding; stop and understand it first.

---

## Phase 0 — Data Audit & EDA (before any code)

**Goal:** Know exactly what data you have, its shape, gaps, and units, before building anything on top of it.

**Tasks:**
- [ ] Run the 5-line EDA check (`shape`, `columns`, `head`, `isna().mean()`, date min/max) on every raw file:
  - `Bangladesh_Carbon_Intensity.csv` ✅ done
  - `Bangladesh_Electricity_Mix.csv` ✅ done
  - `Bangladesh_Electricity_Maps.csv` ✅ done
  - `Bangladesh_GFS_2020_01.csv` .. `_04.csv`
  - `Bangladesh_2018_NSRDB_986494_OneAxis.csv`, `_2019_`, `_2020_`
  - `time_series_15min_singleindex.csv`, `_30min_`, `_60min_`
- [ ] Confirm whether `time_series_*_singleindex.csv` is Bangladesh data or OPSD/European reference data (check column naming, country codes).
- [ ] Find the actual overlap window between NSRDB and GFS (the real usable training range).
- [ ] Confirm with organizers: is the Electricity Maps history really only ~1 day, or can more be requested? If not, plan to poll the live API daily going forward to accumulate real history over the 90 days.
- [ ] Identify what's still missing: electricity tariff/pricing data (needed for cost optimization — not yet sourced from anywhere).

**Output of this phase:** A short data provenance note (source, region, date range, unit, gaps) per file — this later feeds directly into `system-arch.md` §2.1 and the submission's Data & AI Provenance table.

---

## Phase 1 — Data Pipeline

**Goal:** Turn raw CSVs into clean, model-ready data, plus generate the synthetic facility/battery data that doesn't exist yet.

**Tasks:**
- [x] Build `backend/data_pipeline/loaders/` — one small script per source:
  - `nsrdb_loader.py` — load, clean, normalize timezone/units, output a clean DataFrame/parquet
  - `gfs_loader.py` — same, for cloud/atmospheric data
  - `electricity_maps_loader.py` — carbon intensity + mix, handle `isEstimated`/`estimationMethod` fields, sparse renewable columns
- [x] Decide and apply one consistent timezone (UTC recommended internally, convert to BDT only for display).
- [x] Build `backend/data_pipeline/generators/facility_generator.py` — generates a seeded list of flexible industrial processes (name, power_kw, earliest_start, deadline, duration).
- [x] Build `backend/data_pipeline/generators/battery_generator.py` — generates seeded battery state (capacity_kwh, current_soc, charge/discharge rate).
- [x] Source or approximate an electricity tariff structure (BREB/PDB published slabs, or a disclosed simplified flat/time-of-use rate) — needed for the cost term in dispatch.
- [x] Write a small script that prints a sample of each loader's output, so shapes/values can be sanity-checked by eye.

**Verify before moving on:** Can you load a clean, joined dataset (solar + weather + grid-stress, on a shared time index) for at least a few weeks? Do the values look physically sane (e.g., solar = 0 at night)?

---

## Phase 2 — Forecasting Service

**Goal:** Predict solar output and grid stress/carbon intensity 6–24h ahead, with a confidence band and a real backtested accuracy number. **[IMPLEMENTED]**

**Tasks:**
- [x] Start with a persistence baseline ("tomorrow looks like today") — this validates the pipeline end-to-end before adding model complexity.
- [x] Build feature set: lag values, hour-of-day/calendar features, cloud cover (from GFS), historical irradiance (from NSRDB).
- [x] Train a GBM (LightGBM) model behind a stable interface — same interface an LSTM could later swap into (per `docs/architecture/system-arch.md` §2.2).
- [x] Backtest on a genuine held-out time window; report MAPE/RMSE.
- [x] Build the grid-stress forecast as a simple short-horizon extrapolation of the Electricity Maps signal — deliberately kept simple, not oversold.
- [x] Expose `GET /forecast/{region}?horizon_hours=24` returning solar forecast + grid-stress forecast + confidence band + accuracy number.

**Verify before moving on:** Does the backtest number reflect a real held-out period, not just training-set accuracy? Does the forecast look sane on a plotted chart (day/night solar cycle visible)?

---

## Phase 3 — Dispatch / Optimization Service

**Goal:** Given a forecast, decide when to run flexible processes and charge/discharge the battery to minimize cost + emissions. **[IMPLEMENTED]**

**Tasks:**
- [x] Define the `RegionAdapter` / `AssetAdapter` protocol classes per `docs/architecture/system-arch.md` §2.1/2.3.
- [x] Implement `IndustrialProcessAdapter` and `BatteryAdapter` live; `EUAdapter`/`USAdapter`/`EVFleetAdapter` as documented `NotImplementedError` stubs.
- [x] Formulate the objective: minimize `w1*cost + w2*emissions`, subject to each asset's real constraints (deadline/shift window for processes; SoC/capacity/rate for battery).
- [x] Implement the MVP solver with PuLP (linear program) — not RL, that's stretch-only.
- [x] Hand-build one small test case with an obvious optimal answer, and verify the solver's output matches it by hand before trusting it on real data.
- [x] Expose `GET /dispatch/plan` returning the schedule + KPI deltas (cost saved, tCO2 saved, peak kW shaved), broken out per asset type.

**Verify before moving on:** Does the dispatch plan respect every constraint (no process scheduled past its deadline, battery never exceeds capacity/rate)? Do the KPI deltas make sense relative to the baseline?

---

## Phase 4 — Persistence & Auth (Completed)

**Goal:** Provide secure user roles, store dispatch history, and accumulate carbon data locally to avoid API limits.

**Tasks:**
- [x] Integrate SQLite with SQLAlchemy ORM (`db/database.py`).
- [x] Create models for `User`, `DispatchRun`, and `CarbonSnapshot`.
- [x] Implement JWT authentication and Role-Based Access Control (`admin`, `grid_operator`, `facility_manager`).
- [x] Secure existing routes (`/forecast`, `/dispatch/plan`) with the appropriate auth dependencies.
- [x] Add an auto-poller using APScheduler to fetch and store Electricity Maps data every 24h.
- [x] Build `GET /dispatch/history` to expose dispatch logs to admins and grid operators.

**Verify before moving on:** Can you log in and receive a JWT? Are unauthorized requests rejected with 401/403? Does the poller successfully write rows to the database?

---

## Phase 5 — Copilot Service [PLANNED / FUTURE]

**Goal:** A conversational layer that explains forecasts/dispatch decisions using real tool calls — never invents numbers.

**Tasks:**
- [ ] Set up Ollama locally, choose `COPILOT_MODEL` for function-calling reliability.
- [ ] Implement four tools: `get_forecast`, `get_dispatch_plan`, `run_whatif(perturbation)`, `explain_decision(asset_id)` — each simply calls the Phase 2/3 APIs, no new logic.
- [ ] Implement the `role` parameter (`facility_manager` / `grid_operator`) with genuinely different system prompts/response shaping.
- [ ] Expose `POST /copilot/chat {message, role}` → `{reply, tool_calls[]}`.
- [ ] Write a CLI test script that asks the same question in both roles and prints both replies side by side — confirm the tone difference is real, not cosmetic.
- [ ] (Note in code comments, not built) — tool schema documented as MCP-server-ready for later, per `docs/architecture/system-arch.md` §2.4.

**Verify before moving on:** Does the copilot ever answer with a number that didn't come from a tool call? Test by asking a what-if question and checking the returned number actually changes when the underlying forecast changes.

---

## Phase 6 — Integration & Smoke Testing

**Goal:** Confirm the whole backend works together before connecting the frontend.

**Tasks:**
- [ ] Backend runs locally via `uvicorn main:app --reload`.
- [ ] Smoke-test script hits `/health`, `/forecast/{region}`, `/dispatch/plan`, `/copilot/chat` (if planned) in sequence and checks response shapes.
- [ ] `GET /forecast/bd` responds within the target latency using cached data.
- [ ] `GET /dispatch/plan` returns non-zero, sane KPI deltas for both asset types.
- [ ] `.env.example` provided; confirm no API keys are hardcoded anywhere.

---

## Phase 7 — Stretch Goals [PLANNED / FUTURE]

Pick based on remaining time — each should stay clearly labeled "stretch" in the submission until actually working:

- [ ] Swap the GBM forecaster for an LSTM/transformer behind the same interface.
- [ ] Replace the LP/greedy dispatch with an RL policy.
- [ ] Wire the EV fleet adapter to real (likely synthetic) data.
- [ ] Wire an actual EU or US region adapter to real reference data (this is where `time_series_*_singleindex.csv` may become genuinely useful, if confirmed as OPSD data).
- [ ] Solar panel degradation CV module (drone thermography) — bonus, not core.

---

## Running checklist — "did I actually understand this, or did I just accept AI output?"

Before moving to the next phase, for each piece of code you or an AI wrote:
- [ ] Can you state its input and output in one sentence?
- [ ] Can you point to the specific line that would break if the input format changed?
- [ ] Have you run it and eyeballed the output for physical sanity (not just "it didn't crash")?
- [ ] If it uses a library function you don't recognize, have you looked up what it does?

If any answer is "no" — pause and understand that piece before building on top of it.
