# Meridian Grid — System Showcase & Operations Guide

**Purpose:** Comprehensive guide explaining **what** Meridian Grid does, **how** it operates, **where** it is applied, and **who** it serves. Designed for hackathon judges, technical reviewers, and new developers.

---

## 1. Quick Orientation: What, How, Where & Who

| Dimension | Definition & System Implementation |
| :--- | :--- |
| **What happens? (কি কি হয়)** | **Dual-Layer Energy Intelligence:** Dynamically forecasts solar generation and grid carbon intensity, then uses mathematical optimization (MILP) to orchestrate flexible industrial machines and batteries into the cleanest, lowest-cost hours. Natural-language AI Copilot explains decisions with zero hallucination. |
| **How does it work? (কীভাবে হয়)** | **Ingest $\rightarrow$ Forecast $\rightarrow$ Optimize $\rightarrow$ Explain:**<br>1. Ingests weather (Open-Meteo), satellite benchmarks (NREL NSRDB), and live carbon telemetry (Electricity Maps v4).<br>2. Forecasts 6–24h ahead rolling solar curves.<br>3. PuLP MILP solver minimizes composite `Cost + Carbon` under TOU tariffs and machine deadlines.<br>4. Google Gemini 2.5 Flash executes Model Context Protocol (MCP) tools for interactive decisions. |
| **Where does it operate? (কই হয়)** | **Bangladesh Industrial Corridors:** Dhaka, Gazipur, Narayanganj, Savar, and Chittagong economic zones. |
| **Who is it for? (কার জন্য)** | **Two Complementary Audiences:**<br>1. **Industrial Facility Managers:** Ready-Made Garments (RMG), textile spinning/dyeing, cold-storage, and pharmaceutical factories with rooftop solar.<br>2. **Utility Grid Operators:** BREB, BPDB, DESCO, DPDC seeking coincident peak shaving and feeder stability. |

---

## 2. The Real-World Economic Context (Bangladesh)

Industrial electricity tariffs in Bangladesh incorporate a steep **Time-of-Use (TOU)** pricing structure:
- **Peak Window (17:00 – 23:00 / 5 PM – 11 PM):** $\approx \$0.20 / \text{kWh}$ (up to $4\times$ standard rate) + severe peak demand capacity surcharges.
- **Off-Peak / Daytime Window (23:00 – 17:00):** $\approx \$0.05 / \text{kWh}$ to $\$0.08 / \text{kWh}$.

### The Factory Manager's Pain Today:
Most factories run machinery (weaving looms, drying chambers, spinning frames, chillers) on static shift schedules by habit. Running these during evening peak hours causes massive electricity bill spikes, while midday rooftop solar generation is often underutilized or curtailed.

### The Meridian Grid Solution:
1. **Solar Synchronization:** Sinks flexible batches into peak solar hours ($10:00 - 14:00$).
2. **Battery Arbitrage:** Charges Battery Energy Storage Systems (BESS) during cheap off-peak night hours or excess solar; discharges during high-tariff peak hours ($17:00 - 22:00$).
3. **Feeder Protection:** Constrains facility demand to stay strictly within substation feeder limits, eliminating demand-charge penalties.

---

## 3. Architecture & Data Flow

```
 ┌──────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐
 │   Open-Meteo Live    │  │  NREL NSRDB / GFS     │  │ Electricity Maps v4  │
 │  (Regional Weather)  │  │ (Satellite Ground-T)  │  │(Live Carbon gCO2/kWh)│
 └──────────┬───────────┘  └───────────┬───────────┘  └──────────┬───────────┘
            │                          │                         │
            └──────────────────────────┼─────────────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │   FastAPI Ingestion Engine    │
                       └───────────────┬───────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
         ┌─────────────────────────┐       ┌─────────────────────────┐
         │ Solar Forecasting Serv. │       │ PuLP MILP Solver Engine │
         │ (6h, 12h, 24h Horizons) │       │ (Cost + Carbon Minimize)│
         └────────────┬────────────┘       └────────────┬────────────┘
                      │                                 │
                      └────────────────┬────────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
        ┌──────────────────────────────┐   ┌─────────────────────────────┐
        │  Next.js 16 Web Dashboard    │   │ AI Copilot & MCP Tools Layer│
        │  (Gantt, Curves, Overrides)  │   │ (Grounded Gemini Reasoning) │
        └──────────────────────────────┘   └─────────────────────────────┘
```

---

## 4. Public Pages vs. Protected Pages (Navigation Model)

### A. Publicly Accessible Without Login (Guest Evaluation):
Anyone, including hackathon judges and mobile users, can access these without credentials:
1. **` / ` (Landing Page):** High-level overview, workflow timeline, and sample illustrative preview.
2. **` /about ` (System Showcase):** Complete explanation of what happens, how it works, target geography, economics, and interactive feature breakdown.
3. **` /docs ` (Technical Documentation Showcase):** Comprehensive architecture diagrams, live registered API endpoints, data provenance records, and feature status matrix.
4. **` /login ` & ` /signup `:** User authentication and facility manager provisioning.

### B. Authenticated Operations Workspace:
Once logged in, users access the live operational suite:
- **`/dashboard`:** Real-time KPI summaries, today's solar outlook, and live feeder utilization.
- **`/forecast`:** Detailed GHI and temperature curves with confidence bounds.
- **`/dispatch`:** Full 24-hour Gantt chart, machine scheduling windows, and manual shift overrides.
- **`/copilot`:** Real-time AI Copilot Studio executing Model Context Protocol (MCP) tools.
- **`/history`:** Historical run records and review decisions.
- **`/data`:** Ingested Electricity Maps carbon readings and database snapshots.

---

## 5. Demonstration Scope & Transparency Disclosures

To maintain strict scientific and documentation integrity:
- **Model Inputs:** Uses live regional Open-Meteo forecasts and Electricity Maps v4 when online; gracefully falls back to verified cached baselines if upstream APIs are unreachable.
- **Asset Data:** Industrial machines (weaving looms, drying chambers) and batteries are modeled on realistic industrial specifications.
- **Control Scope:** This is a software planning and optimization engine. No physical electrical relays or hardware breakers are actuated.

