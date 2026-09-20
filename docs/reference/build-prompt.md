# build-prompt.md — Master Build Prompt for opencode

**Project:** Meridian Grid — Universal Flexible-Load Orchestration Engine
**Challenge:** ClimaTech / Energy Brain — CloudCampBD
**Read first:** `docs/product/DESIGN.md`, `docs/architecture/system-arch.md`, `docs/product/APPLICATION_FLOW.md` — opencode should read all three before writing code.

## How to use this file
1. Paste the **MASTER PROMPT** block below into opencode as your first message in a fresh repo.
2. Send the **Follow-up prompts** one at a time, in order, once each milestone lands and you've smoke-tested it.
3. Route work by type per the "Debugging handoff notes" table — that's your workflow, not opencode's.
4. Copy every prompt you *actually send* (after your own edits) into `prompts/` in the repo as you go — that folder becomes your submission's Prompt Library.

---

## MASTER PROMPT (paste into opencode first)

```
Build "Meridian Grid" — a universal flexible-load forecasting, optimization,
and agent-explanation engine — as a monorepo:

  backend/    Python 3.11, FastAPI
  frontend/   Next.js + React + Tailwind + recharts
  data/       loaders, cached samples, synthetic facility/battery generator
  agent/      copilot function-calling service
  docs/       DESIGN.md, system-arch.md, APPLICATION_FLOW.md, README.md
  prompts/    empty for now, holds the prompt library

Read docs/architecture/system-arch.md fully before writing code — it defines the exact
component boundaries, the RegionAdapter/AssetAdapter pattern, and API
contracts. Follow it, don't redesign it.

THE CORE IDEA: one forecast -> optimize -> explain engine, made pluggable
on two axes so it visibly generalizes without needing three regions or
three asset types actually built:

  - RegionAdapter: BDAdapter (LIVE — real data) vs EUAdapter/USAdapter
    (STUBS — documented interface, no real data pulled, exist purely to
    prove the architecture generalizes)
  - AssetAdapter: IndustrialProcessAdapter + BatteryAdapter (LIVE) vs
    EVFleetAdapter (STUB — same reasoning)

Do not let the stub adapters silently do nothing — each stub class should
raise a clear NotImplementedError with a docstring describing exactly what
it would wire to (e.g. "would ingest Open Power System Data-style EU
time series here"), so the code itself is evidence of the design, not
just the diagram.

Core components to implement:

1. Data ingestion (data/) — Bangladesh live pipeline
   - NSRDB loader: solar irradiance/meteorological data, South/SE Asia
     coverage confirmed. Cache to a local sample file.
   - NOAA GFS client: cloud-cover/atmospheric data feeding the solar
     forecast's cloud-motion features.
   - Electricity Maps client: real-time BD-zone CO2 intensity + power
     mix. Cache last-good response, fall back to it on error or missing
     key (never crash for a missing key). Note in comments that BD's
     data tier is estimated/lower-confidence, not fully measured — this
     gets disclosed in the submission, don't hide it.
   - Synthetic facility generator: a flexible-process list (name, power
     draw kW, allowable shift window, deadline) and a synthetic battery
     state (capacity kWh, current SoC, charge/discharge rate). No real
     facility or personal data anywhere — synthetic only, seeded.
   - RegionAdapter protocol/base class with BDAdapter implemented live
     and EUAdapter/USAdapter as documented stubs (see above).

2. Persistence & Auth (backend/db/ and backend/auth/)
   - SQLite DB via SQLAlchemy.
   - JWT authentication (HS256) and Role-Based Access Control.
   - Three roles: `admin`, `grid_operator`, `facility_manager`.
   - APScheduler background job polling Electricity Maps API daily and logging to `carbon_snapshots`.

3. Forecasting service (backend/forecasting/)
   - Solar output forecast: cloud-motion + irradiance features -> 6-24h
     solar output. Ship a GBM/lag-feature baseline first (fast, reliable);
     keep the interface identical so an LSTM can swap in later without
     touching callers (per docs/architecture/system-arch.md).
   - Grid-stress/carbon forecast: short-horizon extrapolation of the
     Electricity Maps signal — keep this simple and don't oversell it.
   - `GET /forecast/{region}` returns both forecasts + confidence band +
     backtested accuracy number (MAPE/RMSE against a held-out window).
   - Secure with JWT Auth.

4. Optimization / dispatch agent (backend/dispatch/)
   - AssetAdapter protocol/base class. IndustrialProcessAdapter and
     BatteryAdapter implemented live; EVFleetAdapter as a documented stub.
   - Objective: minimize `w1*cost + w2*emissions` across whichever
     adapters are registered, subject to each asset's own constraints
     (shift window/deadline for processes; SoC/capacity/rate for battery).
   - MVP algorithm: LP via PuLP (or a clearly-commented greedy fallback).
     Do NOT implement RL for the MVP — it's a documented stretch goal only.
   - `GET /dispatch/plan` (Secure with JWT) returns the schedule plus baseline-vs-optimized
     KPI deltas (cost saved, tCO2 saved, peak kW shaved), broken out per
     asset type so the dashboard can show "industrial: X saved,
     battery: Y saved" separately. Logs run to `dispatch_runs` DB.
   - `GET /dispatch/history` (Grid Operator / Admin only).

5. Copilot agent (agent/)
   - Function-calling over four tools: get_forecast, get_dispatch_plan,
     run_whatif(perturbation), explain_decision(asset_id).
   - Takes a `role` parameter: "facility_manager" (plain-language,
     action-first) or "grid_operator" (technical, numbers-first) — same
     tools, different system prompt/response shaping. This role switch
     is the live proof-point for the dual-track business model, so make
     the difference in tone genuinely visible, not cosmetic.
   - Ollama-backed; base URL and model name from env vars (`OLLAMA_HOST`,
     `COPILOT_MODEL`), never hardcoded.
   - Never invents a number without a tool call.
   - Structure tool schemas so they could become an MCP server later with
     minimal changes (comment this, don't build the wrapper yet, per docs/architecture/system-arch.md).
   - `POST /copilot/chat {message, role}` -> `{reply, tool_calls[]}`.

6. Dashboard (frontend/)
   - Panels: solar + grid-stress forecast chart; dispatch schedule
     covering active asset types (industrial + battery), with an
     "EV fleet — coming soon" panel stub; KPI cards (cost/tCO2/peak,
     visually dominant); a region-adapter indicator ("Live: Bangladesh ·
     Architecture-ready: EU, US"); an asset-adapter indicator ("Live:
     Industrial + Battery · Architecture-ready: EV Fleet"); a role
     toggle (Facility Manager / Grid Operator) that visibly changes the
     copilot's tone in the chat panel; and the chat panel itself.

Constraints:
   - No real personal or facility data anywhere, including samples —
     public datasets or synthetic data only, clearly labeled.
   - All API keys via env vars, never committed. Provide `.env.example`.
   - Runnable with zero paid services — free-tier Electricity Maps and
     cached NSRDB/GFS samples only.

Acceptance criteria:
   - `docker-compose up` launches backend on :8000, frontend on :3000.
   - `GET /forecast/bd` returns solar + grid-stress forecast within
     200ms using cached sample data.
   - `GET /dispatch/plan` returns a schedule with KPI deltas broken out
     by asset type (industrial, battery), both non-zero and sane.
   - Dashboard renders all panels including both adapter indicators and
     the role toggle.
   - The copilot answers the same underlying question correctly in both
     roles, and the tonal difference is obviously visible.
```

---

## Follow-up prompts (send in order, one per opencode turn)

1. "Scaffold the repo structure and the RegionAdapter/AssetAdapter protocols exactly as described in the master prompt. Implement BDAdapter, IndustrialProcessAdapter, and BatteryAdapter as working stubs that return placeholder data; implement EUAdapter, USAdapter, and EVFleetAdapter as classes that raise NotImplementedError with a docstring describing what they'd wire to."
2. "Implement the NSRDB loader, GFS client, and Electricity Maps client for BD, with local caching and graceful fallback. Implement the synthetic facility + battery generator. Write a script that prints a sample of each so I can sanity-check shapes."
3. "Implement the forecasting service: the GBM baseline for solar output, the grid-stress extrapolation, `GET /forecast/{region}`, and the backtest script reporting MAPE."
4. "Implement the dispatch/optimization agent using PuLP across the Industrial and Battery adapters. Expose `GET /dispatch/plan` with the schedule and per-asset-type KPI deltas vs. baseline. Add a unit test with an obvious optimal answer to sanity-check the objective function."
5. "Implement the copilot agent with the four tools and the `role` parameter for dual explanation mode, wired to Ollama via the documented env vars. Expose `POST /copilot/chat`. Add a CLI test script that asks the same question in both roles and prints both replies side by side."
6. "Build the Next.js dashboard: forecast chart, dispatch view, KPI cards, region-adapter indicator, asset-adapter indicator, role toggle, and chat panel wired to `/copilot/chat`. Make the role toggle's effect on the chat panel obviously visible."
7. "Wire up docker-compose for backend + frontend + Ollama, add `.env.example`, and write a smoke-test script hitting all endpoints."
8. "Implement `run_whatif`: it should re-run forecast+dispatch under a perturbation (e.g. 'solar -30% tomorrow') and return a plain-language delta plus updated chart data, correctly styled for whichever role asked."

## Debugging handoff notes

| Situation | Route to |
|---|---|
| Dispatch LP infeasible / doesn't converge / weird schedule | Paste constraints + solver output into **deepseek-r1:14b** |
| Copilot tool-calling loops, mis-parses args, or role tone isn't actually different | **deepseek-r1:14b** |
| One small isolated helper (tz conversion, a single API wrapper fn) | **qwen2.5-coder:1.5b** |
| README/docs polish, or any drone-thermography image interpretation if you attempt the CV stretch goal | **gemma4:12b** |
| Everything else — actual multi-file implementation | **opencode** (rotate your model roster as usual) |
| Architecture questions, scope calls, business-model wording | Back to Claude |

## Prompt library note

As you send real prompts (with your own edits) to opencode, copy the final verbatim text into `prompts/NN-short-name.md` with a one-line purpose + output summary. This becomes your Prompt Library section at submission time — mark anything revealing proprietary business logic as Proprietary; the rest can stay public.
