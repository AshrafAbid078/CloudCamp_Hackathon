# DESIGN.md — Meridian Grid

**Domain:** ClimaTech · **Challenge:** Energy Brain — Smart energy optimization and demand response
**Specific Ask:** Cost and emissions savings
**Source of truth:** `MERIDIAN_GRID_IDEA.md` — if this doc and that one disagree, the idea doc wins; update this one.

## Implementation status (current build)

Implemented: data pipeline, solar forecast (LightGBM), persistence-based carbon signal, dispatch optimizer (PuLP) for industrial processes and batteries, JWT/RBAC, SQLite persistence, carbon poller. Planned: dashboard, copilot with role toggle, what-if simulation, EV fleet and EU/US adapters (stubs only). Known gaps: the optimizer currently uses TOU price and grid carbon but not the solar forecast; the carbon forecast is flat; the confidence band is a fixed ±15%. Sections below describe the intended design; see `README.md` for current limitations.

## 1. Problem statement (two sides of one meter)

**Behind the meter — facility side (primary, live-demoed):**
- Who: industrial facility managers, piloted on Bangladesh's RMG/garment and cold-storage sectors, generalizable to any market with unreliable grid + growing solar adoption.
- Problem today: load-timing and battery-dispatch decisions are made on instinct or fixed schedule — no tool turns a solar/grid-stress signal into a specific, explained action for the facility's own equipment.
- Why existing solutions fail: SCADA/BMS systems log but don't forecast or recommend; enterprise EMS platforms assume mature-grid data availability that doesn't exist equally across sources in Bangladesh.
- Target outcome: a double-digit % reduction in cost and tCO2 for the facility's flexible load + battery use. This is a target to validate; the current build reports modeled savings on synthetic facilities against a start-at-earliest-time baseline.

**In front of the meter — grid side (secondary, architecture + role-toggle demo only):**
- Who: utility DR program managers / VPP aggregators.
- Problem today: same integration gap, one level up — forecasting, carbon tracking, and load control live in separate tools.
- Measurable outcome: reduced peak-serving cost and emissions across a managed pool.

Both are served by the same forecast → optimize → explain engine, differing only in asset scope and the copilot's response mode.

## 2. Target users & journey

- **Primary demo persona:** facility manager (Bangladesh, industrial + battery) — full live walkthrough.
- **Secondary persona (architecture + role-toggle only, not a separate build):** grid/DR operator — same engine, technical copilot mode.

Full journey: see `APPLICATION_FLOW.md`.

## 3. Solution overview — three-layer engine, two adapter axes

| Layer | What it does |
|---|---|
| Data & Persistence | Ingests NSRDB/GFS data, auto-polls Electricity Maps daily, and stores history via SQLite / SQLAlchemy |
| Auth & Security | Secures APIs using JWT and Role-Based Access Control (Admin, Grid Operator, Facility Manager) |
| Forecasting | Solar output (6–24h, irradiance + cloud motion) + grid stress/carbon intensity, with confidence band + backtested accuracy |
| Optimization | Schedules registered flexible assets to minimize a blended cost + emissions objective, respecting real constraints |
| Agent (Copilot) | Explains recommendations, answers what-ifs via real tool calls, adapts tone via a role parameter (facility_manager / grid_operator) |

**Region adapter:** Bangladesh live (NSRDB + NOAA GFS + Electricity Maps BD zone); Europe and US/PJM territory are architecture-only stubs — interface defined, no real data pulled, explicitly disclosed.

**Asset adapter:** Industrial process shifting and battery/backup storage dispatch are live; EV fleet charging is an architecture-only stub.

## 4. Features

**MVP (must demo live):**
- Solar + grid-stress forecast for Bangladesh, confidence band + backtested accuracy on-screen
- Dispatch schedule across industrial processes + battery, vs. no-optimization baseline
- KPI dashboard: $ saved, tCO2 avoided, peak kW shaved — visually dominant
- Copilot with role toggle (Facility Manager / Grid Operator), grounded in real tool calls
- What-if scenario simulation
- Region-adapter and asset-adapter indicators on the dashboard, showing live vs. architecture-ready

**Stretch (only with time to spare):**
- Swap GBM forecaster for LSTM/transformer behind the same interface
- RL dispatch policy in place of the LP/greedy MVP
- Wire the EV fleet adapter to real (likely synthetic) data
- Wire an actual EU or US adapter to real reference data
- Solar panel degradation CV module (drone thermography)

Disclose any stretch item not actually completed — honest disclosure doesn't cost points; an unbuilt RL/CV feature claimed as real costs much more if a judge probes it.

## 5. Winning-signal mapping

| Challenge ask | Meridian Grid feature | KPI on dashboard |
|---|---|---|
| Cost savings | Dispatch objective's cost term | $ saved/day vs. baseline |
| Emissions savings | Dispatch objective's carbon term + live CO2 overlay | tCO2 avoided/day vs. baseline |
| Forecasting + optimization + agents | All three layers, integrated, role-aware | Forecast accuracy %, dispatch plan, copilot session in both roles |

## 6. Differentiation vs. named examples

- **FlexiDAO** — tracks certificates/carbon after the fact; Meridian Grid acts *before* the fact, on live forecasts.
- **Stem** — battery-only optimization; Meridian Grid pools industrial processes + batteries (+ EV, stubbed) as one schedulable set.
- **AutoGrid** — enterprise-only DERMS; Meridian Grid sells directly to facility managers too, not just utilities.
- **DeepMind wind forecasting** — forecast-only, no downstream action; Meridian Grid closes the loop into an explained dispatch decision.

Edge: agent-native end to end, and sells to both sides of the meter from the same codebase — the role toggle is the literal proof of that on stage.

## 7. Business model — one engine, two go-to-market tracks (dual-track)

| | Facility SaaS | Utility/DERMS Platform |
|---|---|---|
| Customer | Industrial facility managers | Utilities, VPP aggregators |
| Product | Per-facility subscription + shared-savings option | White-label/API access, technical copilot mode, dispatch APIs |
| Sales motion | Direct, fast cycle | Enterprise, longer cycle, higher deal size |

Framing: same core IP monetized on both sides of the meter — the scaling/unicorn story is one engine expanding into two markets in parallel, not two startups bolted together.

**Execution risk & mitigation:** pitching two segments in one video risks diluting focus. Mitigated structurally — the live demo stays single-persona (facility manager), and the dual-track claim is proven on camera via the dashboard's role toggle switching the same system into "Grid Operator" mode, not a second full walkthrough.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Electricity Maps API down/rate-limited during demo | Cache last-good reading, visible fallback banner, disclosed in provenance |
| Forecast accuracy questioned | Show confidence bands + backtested accuracy on-screen; don't oversell model choice |
| RL/CV/EV/other-region overclaiming | Every non-live component explicitly labeled "architecture-ready" in UI and submission |
| Dual-track pitch reads as unfocused | Single-persona live demo + on-screen role toggle as proof, not a second walkthrough |
| BD Electricity Maps data tier weaker than other zones | Disclosed explicitly rather than presented as equivalent |

## 9. Demo success metrics

- Specific $ and tCO2 figures saved vs. baseline, visible on-screen
- Forecast chart with visible confidence band and stated accuracy number
- One live what-if question answered by the copilot with an updated number, on camera
- Role toggle switched live, with a visibly different copilot tone, as the dual-track proof point
