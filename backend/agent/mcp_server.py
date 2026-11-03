"""
backend/agent/mcp_server.py
===========================
Model Context Protocol (MCP) Server for Meridian Grid.
Complies with Anthropic/OpenAI MCP specifications, providing tools for
solar forecasting, grid carbon telemetry, and MILP dispatch optimization.

Run standalone via:
    python -m agent.mcp_server
"""

from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from .tools import Horizon
from .tools import (
    fetch_solar_and_carbon_forecast,
    fetch_current_dispatch_plan,
    run_whatif_simulation,
    explain_asset_decision,
)

# Initialize FastMCP Server
mcp = FastMCP("Meridian Grid Optimizer")
READ_ONLY = ToolAnnotations(readOnlyHint=True, destructiveHint=False, openWorldHint=True)


@mcp.tool(annotations=READ_ONLY)
def get_solar_forecast(horizon_hours: Horizon = 24) -> dict:
    """
    Get regional solar generation (GHI) and grid carbon intensity forecast for Bangladesh.
    Horizon must be between 1 and 24 hours.
    """
    return fetch_solar_and_carbon_forecast(horizon_hours=horizon_hours)


@mcp.tool(annotations=READ_ONLY)
def get_dispatch_schedule(horizon_hours: Horizon = 24) -> dict:
    """
    Get the optimal MILP dispatch schedule for flexible industrial processes and batteries,
    including baseline vs optimized cost ($), emissions (kg CO2), and peak shaving (kW).
    """
    return fetch_current_dispatch_plan(horizon_hours=horizon_hours)


@mcp.tool(annotations=READ_ONLY)
def simulate_whatif(
    pv_capacity_kw: float = 0.0,
    base_load_kw: float = 0.0,
    feeder_capacity_kw: float | None = None,
    horizon_hours: Horizon = 24,
) -> dict:
    """
    Simulate a what-if operational scenario by re-running the joint MILP solver under
    altered solar PV capacity or feeder limits, returning exact signed financial and carbon deltas.
    """
    return run_whatif_simulation(
        pv_capacity_kw=pv_capacity_kw,
        base_load_kw=base_load_kw,
        feeder_capacity_kw=feeder_capacity_kw,
        horizon_hours=horizon_hours,
    )


@mcp.tool(annotations=READ_ONLY)
def explain_decision(asset_name: str) -> dict:
    """
    Explain why a specific industrial process or battery was scheduled at its time window,
    referencing TOU tariff windows and solar generation availability.
    """
    return explain_asset_decision(asset_name=asset_name)


if __name__ == "__main__":
    mcp.run()

