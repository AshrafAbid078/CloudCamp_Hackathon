# Meridian Grid — Idea Document

**Event:** CloudCampBD, Idea to Unicorn (I2U) team track
**Domain:** ClimaTech
**Challenge:** Energy Brain — Smart energy optimization and demand response
**Winning Signal (what judges score):** Cost and emissions savings
**Required AI capability pillars:** Forecasting + Optimization + Agents

This document is the locked reference for the idea itself. The five technical build docs (`DESIGN.md`, `../architecture/system-arch.md`, `APPLICATION_FLOW.md`, `../../README.md`, `../reference/build-prompt.md`) get regenerated from this — if something here changes, that's a deliberate decision, not drift.

---

## 1. Basics

**Project name:** Meridian Grid

**One-line pitch:** An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset — industrial processes, batteries, EV fleets — into the cheapest, cleanest window, and explains every decision in plain language, for factories and grid operators alike.

**Shorter tagline (if a field needs it):** One engine. Any flexible load. Anywhere the sun and the grid don't quite agree.

**Public summary paragraph:**
Meridian Grid is an AI system that predicts when power will be cheap and clean — from solar output to grid carbon intensity — and automatically works out how to shift a facility's flexible energy use (industrial processes, battery storage, and eventually EV charging) into those windows. A built-in conversational copilot explains every recommendation in plain language, adapting its tone for a factory manager or a technical grid operator. Piloted live on industrial facilities in Bangladesh (garment manufacturing and cold storage — sectors with real grid unreliability and growing solar adoption), the system is architected from day one to generalize to any region and any flexible asset type, so the same engine can serve both individual facilities and the utilities that manage them.

**Primary team language:** English (Bengali for in-person pitching/support as needed).

---

## 2. Problem Statement

Meridian Grid addresses one problem from two sides of the same meter.

### 2.1 Behind the meter — the facility side (primary, live-demoed)

- **Who:** Industrial facility managers — piloted on Bangladesh's RMG/garment and cold-storage sectors, generalizable to any market with unreliable grid supply and growing solar adoption.
- **Problem today:** Facility managers make load-timing and battery-dispatch decisions on instinct or a fixed schedule. There is no tool that turns "solar output will spike at 1pm" or "the grid is under stress right now" into a specific, explained action for their actual equipment.
- **Why existing solutions fail:** Building management/SCADA systems log data but don't forecast or recommend anything. Enterprise energy management platforms assume mature-grid data availability (consistent pricing feeds, dense sensor networks) that doesn't exist equally across data sources in a market like Bangladesh — so those tools either don't deploy there or deploy in a degraded, unconvincing form.
- **Measurable outcome:** A double-digit percentage reduction in both energy cost and tCO2 emitted from the facility's flexible load and battery use, shown as a live number every session — not a quarterly report.

### 2.2 In front of the meter — the grid/utility side (secondary, architecture + role-toggle demo)

- **Who:** Utility demand-response program managers and Virtual Power Plant (VPP) aggregators.
- **Problem today:** They need to orchestrate many flexible facility loads at once, but face the same integration gap one level up — forecasting, carbon tracking, and load control live in separate tools, and nothing connects them into one explainable dispatch layer.
- **Why existing solutions fail:** Enterprise DERMS platforms exist but are opaque to the humans operating them — they're control systems, not something you can ask a question and get a reasoned answer from.
- **Measurable outcome:** Reduced peak-serving cost and emissions across a managed pool of flexible assets.

Both problems are served by the same forecast → optimize → explain engine. They differ only in which assets are being scheduled and how the copilot talks — not in the underlying technology. That shared core is the actual product; the two personas are two ways of selling it.

---

## 3. Solution

### 3.1 Three-layer engine

| Layer | What it does |
|---|---|
| **Forecasting** | Predicts solar output (6–24h, from irradiance + cloud-motion data) and grid stress/carbon intensity, with a confidence band and a stated backtested accuracy — not a black box |
| **Optimization** | Schedules whichever flexible assets are registered (industrial processes, batteries, eventually EV fleets) to minimize a blended cost + emissions objective, respecting each asset's real constraints |
| **Agent (Copilot)** | Explains every recommendation conversationally, answers "what if" questions by actually re-running the forecast/optimization (never inventing a number), and adapts its tone to whoever's asking |

### 3.2 Two pluggable axes — why this generalizes without needing to build everything

The engine is architected on two independent adapter axes, so it can visibly prove it generalizes without requiring three regional pipelines or three asset integrations to actually exist in hackathon time.

**Region adapter** (which data feeds the forecast):

| Region | Status for this build | Data sources |
|---|---|---|
| South/Southeast Asia (Bangladesh) | **Live pilot** | NREL NSRDB (confirmed coverage: 67°E–98°E, 5°N–38°N) + NOAA GFS + Electricity Maps (Bangladesh zone — disclosed as a lower/estimated data tier) |
| Europe | Architecture-only (shown via diagram + interface stub) | NOAA GFS + Open Power System Data–style historical/weather series |
| US (PJM territory) | Architecture-only (shown via diagram + interface stub) | NOAA GFS + PJM Data Miner–style real-time marginal pricing, which would enable live price arbitrage, not just scheduling |

**Asset adapter** (what gets scheduled):

| Asset type | Status for this build |
|---|---|
| Industrial flexible process shifting | **Live** — the primary demo asset |
| Battery / backup storage dispatch | **Live-adjacent** — genuinely free upside, since most Bangladeshi RMG/cold-storage sites already run batteries or diesel gensets as backup due to grid unreliability. Optimizing when an already-owned battery charges/discharges is a real feature computable from data already being ingested, not a new pipeline. |
| EV fleet charging | Architecture-only stub — interface defined and disclosed, not wired to real data. BD doesn't yet have the EV fleet density/data to make this credible live. |

Both stub branches (regions and EV) are implemented in code as classes that document exactly what they'd connect to and raise a clear "not yet implemented" signal — so the generalization claim is backed by actual interface code, not only a slide.

### 3.3 Key features (MVP vs. stretch)

**MVP — must work live:**
- Solar + grid-stress forecast for Bangladesh, with confidence band and backtested accuracy
- Dispatch schedule across industrial processes + battery, optimizing cost + CO2, shown against a no-optimization baseline
- KPI dashboard: $ saved, tCO2 avoided, peak kW shaved — the most visually dominant thing on screen
- Copilot with a role toggle (Facility Manager / Grid Operator) that visibly changes tone and depth, grounded in real tool calls
- What-if scenario simulation ("what happens if solar drops 30% tomorrow?")
- On-dashboard region-adapter and asset-adapter indicators showing what's live vs. architecture-ready

**Stretch — only if MVP is solid with time to spare:**
- Swap the MVP forecaster (gradient-boosted trees) for an LSTM/transformer behind the same interface
- Reinforcement-learning dispatch policy in place of the MVP linear-program/greedy allocator
- Wire the EV fleet adapter to real (likely synthetic) data
- Wire an actual EU or US adapter to real reference data instead of a stub
- Computer-vision solar panel degradation module (drone thermography) as a bonus data-quality feature

Every stretch item is disclosed as such in the submission if not actually completed — honest disclosure doesn't cost points under the event's rules, and overclaiming an unbuilt RL or CV feature risks far more than admitting it's a documented next step.

### 3.4 Mapping to the challenge's own example prompts

| Challenge's example prompt | How Meridian Grid answers it |
|---|---|
| Predict solar farm output variability using cloud motion vectors + LSTM | Core of the forecasting layer — MVP ships a GBM baseline behind the same interface, LSTM is the stated stretch target |
| RL-based VPP agent managing EV charging to minimize peak stress | The optimization layer's shape — MVP dispatch is LP/greedy across industrial + battery; EV fleet + RL are both named, disclosed stretch goals |
| Transformer model forecasting regional industrial demand | The grid-stress forecast side of the forecasting layer, simplified for MVP honesty |
| Generative AI assistant for grid operators simulating scenarios | The copilot's "grid operator" role mode and what-if simulation |
| CV tool for solar panel degradation via drone thermography | Named explicitly as a bonus stretch feature, not core |

---

## 4. Business Model

**Structure: one engine, two go-to-market tracks, pitched in parallel.**

| | SKU 1 — Facility SaaS | SKU 2 — Utility/DERMS Platform |
|---|---|---|
| Customer | Industrial facility managers (RMG, cold storage, and similar) | Utilities, VPP aggregators, grid operators |
| Product | Per-facility subscription, with a shared-savings option (a cut of realized cost/emissions savings) | White-label / API access to the same forecast + optimization engine, technical copilot mode, dispatch-plan APIs |
| Sales motion | Direct, faster cycle, lower per-deal size, provable traction quickly | Enterprise, longer cycle, higher deal size |
| Why it's the same product | Identical forecast/optimize/explain core; only the asset scope and the copilot's `role` parameter change | — |

**The scaling story:** the same core IP is monetized on both sides of the meter — the thing a factory buys to save money, and the thing a utility buys to manage many factories like it, are the same engine wearing a different role flag. That's the actual unicorn-shaped claim: one build, two markets, expanding together rather than sequentially.

**Execution note (the honest tradeoff of doing this in parallel):** pitching two customer segments risks diluting focus in a 3–5 minute demo video. The mitigation is structural, not cosmetic — the live demo stays centered on one persona (the facility manager, Bangladesh, industrial + battery), and the dual-track claim is proven on camera via the dashboard's role toggle switching the same system into "Grid Operator" mode, rather than by trying to build and show two full walkthroughs.

**Target beachhead market:** Bangladesh and comparable South/Southeast Asian markets — grid instability plus fast-growing solar adoption makes the pain acute and the savings story concrete. Europe and US expansion are architected for from day one (region adapter), not bolted on later.

---

## 5. Differentiation

| Existing example | What it does | Where Meridian Grid differs |
|---|---|---|
| **FlexiDAO** | Tracks renewable energy certificates/carbon footprint after the fact | Meridian Grid acts *before* the fact, on live forecasts — it's a decision engine, not a ledger |
| **Stem** | AI-driven battery storage optimization, in isolation | Meridian Grid pools industrial processes + batteries (and eventually EVs) as one schedulable set, not battery-only |
| **AutoGrid** | Enterprise DERMS for distributed energy resources | Enterprise-only and not facility-accessible; Meridian Grid is sold directly to facility managers as well, not just utilities |
| **DeepMind (wind forecasting)** | Forecasts wind output 36h ahead | Forecast-only, no downstream action; Meridian Grid closes the loop into an actual, explained dispatch decision |

Meridian Grid's edge: it's the only one of these that is agent-native end to end (forecast, dispatch, and explanation behind one conversational surface) *and* sells to both sides of the meter from the same codebase.

---

## 6. Data & AI Provenance (summary — full detail lives in the technical docs)

| Source | Type | Region | Role |
|---|---|---|---|
| NREL NSRDB | Public dataset | South/SE Asia (confirmed BD coverage) | Live — solar irradiance input to forecaster |
| NOAA GFS | Public dataset | Global | Live — cloud-cover/atmospheric input to forecaster |
| Electricity Maps API | Real-time API | Bangladesh zone | Live — grid CO2 intensity + power mix (disclosed as a lower/estimated data tier for BD) |
| Open Power System Data | Public dataset | Europe only | Architecture reference only — not pulled as real data for this build |
| PJM Data Miner | Public/registered API | US (PJM territory) only | Architecture reference only — not pulled as real data for this build |
| Synthetic facility & battery data | Generated | N/A | Live — no real personal or facility data used anywhere |

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Electricity Maps API down/rate-limited during demo | Cache last-good reading, fall back visibly with a banner, disclose in provenance |
| Forecast accuracy questioned by judges | Show confidence bands + backtested accuracy number on-screen; don't oversell the MVP model choice |
| RL/CV/EV/other-region claims overstated | Every non-live component is explicitly labeled "architecture-ready" in both the UI and the submission — honest disclosure is scored fairly under the event's rules |
| Dual-track pitch reads as unfocused | Live demo stays single-persona; dual-track proven via the on-screen role toggle, not a second full walkthrough |
| BD Electricity Maps data tier is weaker than other zones | Disclosed explicitly in Data & AI Provenance rather than presented as equivalent to a fully-measured zone |

---

## 8. What's Next

1. Lock this document (edit here first if anything changes — don't fix drift downstream).
2. Regenerate the five technical build docs from this: `DESIGN.md`, `../architecture/system-arch.md`, `APPLICATION_FLOW.md`, `../../README.md`, `../reference/build-prompt.md`.
3. Feed `../reference/build-prompt.md` to opencode and start implementation.
4. Draft the remaining submission sections once the build exists: Data & AI Provenance (full), Tooling/IDE disclosure, MCP usage disclosure, Prompt Library, and the YouTube demo script.
