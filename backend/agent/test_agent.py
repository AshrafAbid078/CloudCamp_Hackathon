"""
backend/agent/test_agent.py
===========================
Tests for Phase 5 AI Copilot and Model Context Protocol (MCP) tool integration.
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from agent.tools import (
    fetch_solar_and_carbon_forecast,
    fetch_current_dispatch_plan,
    run_whatif_simulation,
    explain_asset_decision,
)

client = TestClient(app)


def test_solar_and_carbon_forecast_tool():
    res = fetch_solar_and_carbon_forecast(horizon_hours=12)
    assert res["region"] == "Bangladesh (Dhaka Grid)"
    assert res["horizon_hours"] == 12
    assert "solar" in res
    assert "peak_ghi_w_per_m2" in res["solar"]
    assert "carbon_telemetry" in res
    assert res["carbon_telemetry"]["unit"] == "gCO2eq/kWh"


def test_dispatch_plan_tool():
    res = fetch_current_dispatch_plan(horizon_hours=24)
    assert res["status"] == "optimal"
    assert "kpis" in res
    kpis = res["kpis"]
    assert "cost_savings_usd" in kpis
    assert "carbon_saved_kg" in kpis
    assert "peak_load_shaved_kw" in kpis
    assert isinstance(res["industrial_processes"], list)


def test_whatif_simulation_tool():
    res = run_whatif_simulation(pv_capacity_kw=200.0, horizon_hours=24)
    assert "scenario_inputs" in res
    assert res["scenario_inputs"]["pv_capacity_kw"] == 200.0
    assert "impact_vs_baseline" in res
    impact = res["impact_vs_baseline"]
    assert "cost_change_usd" in impact
    assert "emissions_change_kg" in impact
    assert "peak_load_change_kw" in impact
    # Increasing PV should reduce or maintain cost
    assert impact["cost_change_usd"] <= 0.01


def test_explain_asset_decision_tool():
    battery_expl = explain_asset_decision("Battery Storage 1")
    assert "Arbitrage" in battery_expl["strategy"]

    loom_expl = explain_asset_decision("Weaving Loom")
    assert "Load Shifting" in loom_expl["strategy"]


def test_mcp_tools_endpoint():
    response = client.get("/copilot/tools")
    assert response.status_code == 200
    data = response.json()
    assert data["protocol"] == "Model Context Protocol (MCP) 1.0"
    tool_names = [t["name"] for t in data["tools"]]
    assert "get_solar_forecast" in tool_names
    assert "get_dispatch_schedule" in tool_names
    assert "simulate_whatif" in tool_names
    assert "explain_decision" in tool_names


def test_copilot_chat_endpoint():
    payload = {
        "message": "What is today's peak shaved load?",
        "role": "facility_manager",
    }
    response = client.post("/copilot/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["role"] == "facility_manager"
    assert len(data["reply"]) > 0
    assert isinstance(data["tool_calls"], list)

