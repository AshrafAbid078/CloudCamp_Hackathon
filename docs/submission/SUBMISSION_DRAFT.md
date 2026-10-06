# Meridian Grid — Submission Draft (CloudCampBD, Idea to Unicorn)

Structured field-for-field against the official Submission Process doc — the 8 required sections, plus the phase-specific mandatory fields called out separately for Preliminary vs. Final. Anything not yet finalized is marked `[TBD]`.

**Timeline:** Preliminary window 1 Nov – 20 Nov 2026, 23:59 BST · Final lock 24:00 BST, 24 Dec 2026 · Congress Day 26 Dec 2026.
**Reminder:** only the team leader can click Submit/Lock. Team size must be ≥3 at the deadline or the submission is marked Incomplete regardless of content.

---

## 1. Basics `[Preliminary + Final]`

| Field | Value |
|---|---|
| Project name | Meridian Grid |
| One-line pitch | An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset — industrial processes, batteries, EV fleets — into the cheapest, cleanest window, and explains every decision in plain language, for factories and grid operators alike. |
| Chosen domain | ClimaTech |
| Chosen challenge | Energy Brain — Smart energy optimization and demand response (named challenge, not self-defined) |
| Public summary paragraph | Meridian Grid is an AI system that predicts when power will be cheap and clean — from solar output to grid carbon intensity — and automatically works out how to shift a facility's flexible energy use (industrial processes, battery storage, and eventually EV charging) into those windows. A conversational copilot (in development) is designed to explain each recommendation in plain language, adapting its tone for a factory manager or a technical grid operator. Built for industrial facilities in Bangladesh — garment manufacturing and cold storage, sectors with real grid unreliability and growing solar adoption — and currently running on Bangladesh solar data and synthetic facilities, the system is architected from day one to generalize to any region and any flexible asset type. |
| Primary team language | English |

### Team & Mentor Engagement `[Preliminary]`
*(Required at Preliminary per the FAQ, not one of the 8 named sections — placed here as the natural home.)*

| Field | Value |
|---|---|
| Team roles | `[TBD — list names + roles, e.g. Team Lead (submission owner), ML/Forecasting, Backend/Optimization, Frontend/Copilot]` |
| Initial mentor engagement notes | `[TBD — log the first mentor conversation once scheduled]` |
| Prototype link or repo | `[TBD — GitHub repo URL; can start private, add a Judge Access Note if it's still Restricted by Final]` |

---

## 2. Problem Statement `[Preliminary + Final]`

**Who:** Industrial facility managers — focused on Bangladesh's RMG/garment and cold-storage sectors, generalizable to any market with unreliable grid supply and growing solar adoption.

**What problem they face today:** Facility managers make load-timing and battery-dispatch decisions on instinct or a fixed schedule. No tool turns "solar output will spike at 1pm" or "the grid is under stress right now" into a specific, explained action for their actual equipment.

**Why existing solutions fail:** Building management/SCADA systems log data but don't forecast or recommend anything. Enterprise energy management platforms assume mature-grid data availability (consistent pricing feeds, dense sensor networks) that doesn't exist equally across data sources in a market like Bangladesh, so those tools either don't deploy there or deploy in a degraded, unconvincing form.

**Target outcome:** A double-digit percentage reduction in both energy cost and tCO2 emitted from the facility's flexible load and battery use, shown as a live number every session. (Target to validate; the current build reports modeled savings on synthetic facilities against a start-at-earliest-time baseline.)

*(Note for judges/context, not a separate form field: the same forecast/optimize/explain engine also serves a second, in-front-of-the-meter problem for utility DR managers and VPP aggregators — detailed in the Business Model section of the idea doc. The Preliminary/Final Problem Statement field stays centered on the facility side since that's what's demoed live.)*

### Target User `[Preliminary + Final — separate field]`

Primary: Industrial facility managers in Bangladesh's RMG/garment and cold-storage sectors, generalizable to any market with unreliable grid + growing solar adoption.

(Secondary, expansion market — not the Preliminary demo target: utility DR program managers / VPP aggregators, served via the same engine's role-toggle.)

---

## 3. Solution `[Preliminary + Final]`

**The product:** A three-layer AI engine —
1. **Forecasting** — predicts solar output (6–24h, from irradiance + cloud-motion data) and grid stress/carbon intensity, with a confidence band and stated backtested accuracy.
2. **Optimization** — schedules whichever flexible assets are registered (industrial processes, batteries, eventually EV fleets) to minimize a blended cost + emissions objective, respecting each asset's real constraints.
3. **Agent (Copilot)** — explains every recommendation conversationally, answers "what if" questions by re-running the forecast/optimization (never inventing a number), and adapts its tone to whoever's asking via a role toggle (Facility Manager / Grid Operator).

**AI system architecture:** Two pluggable adapter axes make the engine generalize without needing three regional pipelines or three asset integrations built for this submission:
- *Region adapter:* Bangladesh is the implemented region (NREL NSRDB + NOAA GFS + Electricity Maps, BD zone; synthetic facilities — no real-site pilot). Europe and US/PJM territory are architecture-only — interface stubs, not real data pulled, explicitly disclosed as such.
- *Asset adapter:* Industrial process shifting and battery/backup storage dispatch are implemented. EV fleet charging is an architecture-only stub (BD doesn't yet have the fleet data density to make it credible live).

**Key features:**
- Solar + grid-stress forecast for Bangladesh, with backtested accuracy (MVP: fixed ±15% band; carbon forecast is persistence-based)
- Dispatch schedule across industrial processes + battery, optimizing cost + CO2 against a no-optimization baseline
- [Planned] KPI dashboard: $ saved, tCO2 avoided, peak kW shaved (the API already returns these KPIs)
- [Planned] Copilot with a role toggle that visibly changes tone/depth, grounded in real tool calls
- [Planned] What-if scenario simulation
- [Planned] On-dashboard indicators showing what's live vs. architecture-ready, for both adapter axes

**Target user journey:** Facility manager opens the dashboard each morning, sees the forecast and the day's proposed dispatch plan with KPI deltas already calculated, asks the copilot a what-if question when conditions change, approves or overrides specific slots, and gets an end-of-day savings summary. Full walkthrough in `../product/APPLICATION_FLOW.md`.

**Mapping to the Winning Signal (cost and emissions savings):** Every KPI on the dashboard is a direct $ or tCO2 delta versus a no-optimization baseline — the product's entire value proposition is that number, not a secondary reporting feature bolted onto something else.

---

## 4. Demo & Links

### Preliminary `[Preliminary]`
| Field | Value |
|---|---|
| Prototype link or repo | `[TBD]` |

### Final `[Final only]`
| Field | Value |
|---|---|
| Working demo link | `[TBD]` |
| GitHub repository | `[TBD]` |
| YouTube demo | `[TBD — public/unlisted, not Private; 3–5 min recommended, judges only watch first 7; structure: problem → solution walkthrough → live demo → team intro → CTA]` |
| Judge Access Note (if any link is Restricted) | `[TBD if needed]` |

Reminder: links are validated nightly and can be re-run manually. PASS = fine. RESTRICTED = needs a Judge Access Note. FAIL blocks submission entirely — check this well before the deadline, not the night of.

---

## 5. Data & AI Provenance `[Final only]`

| Source | Type | Region | Role | License/access |
|---|---|---|---|---|
| NREL NSRDB | Public dataset | South/SE Asia (confirmed BD coverage) | Historical cached data (2018–2020) — forecaster training and demo input | Public |
| NOAA GFS | Public dataset | Global | Historical cached sample (2020-01 to 2020-05) — cloud-cover features | Public |
| Electricity Maps API | Real-time API | Bangladesh zone | Live poll — grid CO2 intensity + power mix (history just starting to accumulate) | Free tier; BD zone disclosed as a lower/estimated data tier, not fully measured |
| Open Power System Data | Public dataset | Europe only | Architecture reference only — not pulled as real data | Open license |
| PJM Data Miner | Public/registered API | US (PJM territory) only | Architecture reference only — not pulled as real data | Registration required (not used) |
| Synthetic facility & battery data | Generated | N/A | Used for demo and tests — no real personal or facility data used anywhere | N/A |

**Personal data handling:** No real personal or facility data is used at any point. All facility/asset data is synthetically generated and seeded for reproducibility, per the event's no-real-personal-data rule.

**Foundation models called:** `[TBD — name the specific local model(s) actually wired as COPILOT_MODEL at submission time, e.g. a specific Ollama model]`

---

## 6. Tooling + IDE + Memory/Context Files Disclosure `[Final only]`

| Tool | Role |
|---|---|
| Claude | Planning, architecture, prompt drafting, debugging advice — no direct multi-file code generation |
| opencode | Actual multi-file implementation (models: North Mini Code, Nemotron 3 Ultra, DeepSeek V4 Flash, Mimo V2.5, Big Pickle) |
| Ollama (local) | deepseek-r1:14b — reasoning-heavy debugging; qwen2.5-coder:1.5b — small isolated snippets; gemma4:12b — docs/multimodal |

**Memory/context files used:** `../reference/build-prompt.md` functions as the project's build/rules file fed into opencode; `../product/MERIDIAN_GRID_IDEA.md` functions as the canonical idea/spec reference all other docs were generated from.

---

## 7. MCP Usage Disclosure `[Final only]`

`[TBD, depending on final build state — one of:]`
- *If not implemented:* "No MCP servers are used in this submission. The copilot's four tools (get_forecast, get_dispatch_plan, run_whatif, explain_decision) are structured so they could become an MCP server with minimal changes (see `../architecture/system-arch.md` §2.4), but this wrapper was not built for the current submission."
- *If implemented:* `[list the actual MCP server(s), why they were used, and what tools they exposed]`

---

## 8. Prompt Library `[Final only]`

Pointer: see `prompts/` in the repo. Each entry follows this template — fill in as real prompts accumulate:

| # | Prompt purpose | Output summary | Proprietary? |
|---|---|---|---|
| 01 | Master build prompt — scaffold the monorepo and adapter interfaces | Generated backend/frontend/data/agent skeleton with RegionAdapter/AssetAdapter protocols | No |
| 02 | `[TBD]` | `[TBD]` | `[TBD]` |

Non-proprietary prompts can be shared publicly in the export; proprietary ones (anything revealing business logic you don't want competitors seeing) stay visible to judges/admins only via the toggle.

---

## Submission Compliance Checklist

- [ ] Team leader identified — only they can Submit/Lock
- [ ] Team size ≥3 confirmed as of the deadline
- [ ] All Preliminary mandatory fields filled (Basics, Problem Statement, Solution, Target User, prototype link/repo, team roles, mentor notes)
- [ ] All links re-validated and PASS or RESTRICTED-with-note — no FAIL links at deadline
- [ ] YouTube set to Public or Unlisted (never Private), 3–5 min, correct structure
- [ ] Data & AI Provenance filled with no real personal data anywhere
- [ ] Tooling/IDE disclosure complete, including memory/context files
- [ ] MCP disclosure present and accurate (even if the answer is "none used")
- [ ] Prompt Library non-empty, proprietary toggles set correctly
- [ ] Final review pass by team leader before clicking Submit — remember it locks automatically at the deadline with no grace period
