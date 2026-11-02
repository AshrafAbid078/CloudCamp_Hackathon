# Meridian Grid — Phase 5: AI Copilot & Model Context Protocol (MCP) Specification

**Document Version:** 1.0  
**Date:** November 2026  
**Status:** **[IMPLEMENTED & TESTED]**  
**Component Location:** `backend/agent/` & `frontend/src/app/(dashboard)/copilot/`

---

## 1. Executive Overview

Phase 5 introduces an **AI Copilot and Model Context Protocol (MCP) Agent** layer to Meridian Grid. 

In previous phases, the platform built:
- **Phase 1:** Clean data ingestion pipelines (NREL NSRDB, NOAA GFS, Electricity Maps).
- **Phase 2:** Solar irradiance and carbon intensity forecasting (`backend/forecasting/`).
- **Phase 3:** Mixed-Integer Linear Programming (MILP) dispatch optimizer with PuLP (`backend/dispatch/`).
- **Phase 4:** JWT authentication, RBAC, SQLite/Turso persistence, and background poller (`backend/auth/`, `backend/db/`, `backend/poller/`).

Prior to Phase 5, conversational UI responses were static stubs. Phase 5 replaces them with an **enterprise-grade, zero-hallucination agent architecture** complying with the **Anthropic/OpenAI Model Context Protocol (MCP) standard**, backed by **Google Gemini 2.5 Flash** native function calling.

```
       User Query (Web UI / Natural Language)
                         │
                         ▼
       FastAPI Endpoint: POST /copilot/chat
                         │
                         ▼
        Gemini 2.5 Engine (Agent Orchestrator)
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
   Decides Tool Needed        Direct Response
            │                         │
            ▼                         │
   Execute MCP Tool                   │
   against Backend                    │
   (Forecast / MILP Solver)           │
            │                         │
            ▼                         │
   Grounded Tool Output ──────────────┘
            │
            ▼
   Final Verified Answer (Zero Hallucination)
```

---

## 2. Model Context Protocol (MCP) Tool Registry

The agent layer exposes four grounded operational tools. These tools directly invoke the mathematical models and databases—the LLM is strictly prohibited from inventing or hallucinating metrics.

### Tool 1: `get_solar_forecast`
* **File:** `backend/agent/tools.py` $\rightarrow$ `fetch_solar_and_carbon_forecast()`
* **Signature:** `get_solar_forecast(horizon_hours: int = 24)`
* **Description:** Retrieves regional solar irradiance (GHI) and grid carbon intensity forecast for Bangladesh (Dhaka grid).
* **Underlying Engines:** Calls `backend.forecasting.router.get_forecast()` connecting to live Open-Meteo regional weather forecasts and Electricity Maps v4 carbon telemetry.
* **Returned Output:**
  ```json
  {
    "region": "Bangladesh (Dhaka Grid)",
    "horizon_hours": 24,
    "solar": {
      "source": "Open-Meteo regional forecast",
      "peak_ghi_w_per_m2": 720.5,
      "average_ghi_w_per_m2": 245.0,
      "peak_solar_time": "2026-11-03T12:00:00+06:00",
      "confidence_band": "±15%"
    },
    "carbon_telemetry": {
      "source": "Electricity Maps v4",
      "average_intensity_gco2_kwh": 625.0,
      "status": "active"
    }
  }
  ```

---

### Tool 2: `get_dispatch_schedule`
* **File:** `backend/agent/tools.py` $\rightarrow$ `fetch_current_dispatch_plan()`
* **Signature:** `get_dispatch_schedule(horizon_hours: int = 24)`
* **Description:** Retrieves the active MILP dispatch schedule for flexible industrial processes and Battery Energy Storage Systems (BESS).
* **Underlying Engines:** Invokes `backend.dispatch.api.get_dispatch_plan()` running PuLP MILP solver across TOU tariffs.
* **Returned Output:** Baseline cost vs optimized cost ($), carbon avoided (kg CO2), peak load shaved (kW), and scheduled charging/discharging time windows.

---

### Tool 3: `simulate_whatif`
* **File:** `backend/agent/tools.py` $\rightarrow$ `run_whatif_simulation()`
* **Signature:** `simulate_whatif(pv_capacity_kw: float, base_load_kw: float = 0.0, feeder_capacity_kw: float | None = None, horizon_hours: int = 24)`
* **Description:** Performs real-time scenario simulation by re-running the joint MILP solver under altered solar PV capacity or feeder import limits.
* **Returned Output:** Exact signed financial delta (`cost_change_usd`), emissions impact (`emissions_change_kg`), and peak demand change (`peak_load_change_kw`).

---

### Tool 4: `explain_decision`
* **File:** `backend/agent/tools.py` $\rightarrow$ `explain_asset_decision()`
* **Signature:** `explain_decision(asset_name: str)`
* **Description:** Explains the economic rationale mapping Bangladesh's Time-of-Use (TOU) tariffs ($0.20/kWh peak vs $0.05/kWh off-peak) to equipment run hours or battery arbitrage.

---

## 3. Standalone MCP Server (`backend/agent/mcp_server.py`)

To allow external platforms (e.g. Claude Desktop, Cursor, Antigravity IDE, or microgrid SCADA systems) to interact directly with Meridian Grid, a standalone **FastMCP** server is mounted:

```python
# Launch standalone MCP server over STDIO / SSE
python -m agent.mcp_server
```

This exports all tools via the official Anthropic/OpenAI Model Context Protocol 1.0 JSON-RPC schema.

---

## 4. Role-Based Persona Shaping (`backend/agent/prompts.py`)

The agent supports two distinct business personas:

1. **Facility Manager (`facility_manager`):**
   * **Tone:** Action-first, business-oriented, pragmatic.
   * **Focus:** Electricity bill reduction ($ saved), production deadlines, and machine maintenance.
   * **Sample Prompt Output:** *"Run the drying machine at 02:00 — saves $140 and 3.2 kg CO2."*

2. **Grid Operator (`grid_operator`):**
   * **Tone:** Technical, terse, numbers-first.
   * **Focus:** Substation feeder headroom, peak MW relief, carbon intensity (`gCO2eq/kWh`), and coincident demand stress.
   * **Sample Prompt Output:** *"System peak shaved by 79.8 kW. Coincident stress optimal between 10:00–14:00."*

---

## 5. Technical Remediation & Bug Fixes Applied

During Phase 5 development, several critical environment and integration bugs were diagnosed and permanently resolved:

1. **PuLP 4.0.1 Breaking Change:**
   * *Problem:* `PuLP 4.0.1` rewrote `LpVariable` to use an internal Rust core, rejecting `lowBound=0, upBound=1, cat=...` with `TypeError: got an unexpected keyword argument 'lowBound'`.
   * *Fix:* Pinned and installed `pulp==3.3.0` in the environment and updated `requirements.txt`.
2. **Query Parameter Normalization in `dispatch/api.py`:**
   * *Problem:* Direct Python function calls to `get_dispatch_plan` left `feeder_capacity_kw` defaulting to FastAPI's `Query(default=None)` object, crashing on `Query <= 0`.
   * *Fix:* Added type-sanitization:
     ```python
     feeder_capacity_kw = float(feeder_capacity_kw) if isinstance(feeder_capacity_kw, (int, float)) else None
     ```
3. **Optional User Authentication in `/copilot/chat`:**
   * *Problem:* Default `Depends(get_current_user)` rejected unauthenticated visitors with HTTP 401.
   * *Fix:* Implemented `get_optional_current_user` allowing public demo users to test the copilot with role overrides while seamlessly extracting identity for logged-in users.
4. **Console Encoding Safety:**
   * *Problem:* Windows CP1252 terminal threw `UnicodeEncodeError` when printing Bengali characters.
   * *Fix:* Reconfigured stdout stream to UTF-8.

---

## 6. Automated Test Coverage

The agent suite is fully tested via pytest:
```bash
python -m pytest backend/agent/test_agent.py
```
**Test Cases Covered (6/6 Passed):**
- `test_solar_and_carbon_forecast_tool`: Validates GHI and carbon telemetry schema.
- `test_dispatch_plan_tool`: Verifies PuLP optimal solver execution and KPI totals.
- `test_whatif_simulation_tool`: Verifies signed deltas for hypothetical 200 kW solar capacity.
- `test_explain_asset_decision_tool`: Verifies arbitrage and load-shifting explanations.
- `test_mcp_tools_endpoint`: Verifies `/copilot/tools` schema conformity.
- `test_copilot_chat_endpoint`: Verifies end-to-end `/copilot/chat` inference with tool calling.

---

## 7. Context & Debugging Reference for Future Reviews

If you encounter issues during future development:
- **API Key:** Defined in `.env` as `GEMINI_API_KEY`. Loaded via `backend/config.py` (`settings.gemini_api_key`).
- **Offline / Network Outage:** If external Google servers or local internet is unreachable, `_rule_based_fallback()` in `copilot_service.py` engages automatically, executing the local tools and returning verified numbers without failing.
- **Adding New Tools:** Define the Python logic in `agent/tools.py`, add the declaration to `TOOL_DECLARATIONS` in `agent/copilot_service.py`, and register the `@mcp.tool()` in `agent/mcp_server.py`.

