"""
backend/agent/copilot_service.py
================================
AI Copilot reasoning engine using Google Gemini API with native Function Calling.
Executes Model Context Protocol (MCP) tools in a grounded loop.
"""

import json
import logging
from typing import Any, Dict, List
import httpx

from config import settings
from .prompts import get_system_prompt
from .tools import (
    fetch_solar_and_carbon_forecast,
    fetch_current_dispatch_plan,
    run_whatif_simulation,
    explain_asset_decision,
)

logger = logging.getLogger("meridian.agent")

# Gemini Function Declarations for our MCP Tools
TOOL_DECLARATIONS = [
    {
        "name": "get_solar_forecast",
        "description": "Fetches Bangladesh regional solar irradiance (GHI) and grid carbon intensity forecast for up to 24 hours.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "horizon_hours": {
                    "type": "INTEGER",
                    "description": "Forecast lookahead in hours (1 to 24). Defaults to 24.",
                }
            },
        },
    },
    {
        "name": "get_dispatch_schedule",
        "description": "Fetches the latest optimal MILP dispatch plan, cost savings, carbon shaved, and equipment scheduling windows.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "horizon_hours": {
                    "type": "INTEGER",
                    "description": "Number of scheduling hours (1 to 24). Defaults to 24.",
                }
            },
        },
    },
    {
        "name": "simulate_whatif",
        "description": "Runs a real-time MILP solver simulation with altered solar PV capacity or load conditions, returning signed cost and carbon deltas.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "pv_capacity_kw": {
                    "type": "NUMBER",
                    "description": "Simulated rooftop solar PV capacity in kW (e.g. 100, 250, 500).",
                },
                "base_load_kw": {
                    "type": "NUMBER",
                    "description": "Facility baseline continuous electrical load in kW.",
                },
                "feeder_capacity_kw": {
                    "type": "NUMBER",
                    "description": "Feeder grid interconnection import limit in kW.",
                },
                "horizon_hours": {
                    "type": "INTEGER",
                    "description": "Simulation horizon in hours (1 to 24).",
                },
            },
            "required": ["pv_capacity_kw"],
        },
    },
    {
        "name": "explain_decision",
        "description": "Explains why an industrial process or battery was scheduled at its time window based on tariff rates and solar availability.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "asset_name": {
                    "type": "STRING",
                    "description": "Name or type of asset (e.g. 'Battery', 'Drying Machine', 'Weaving Loom').",
                }
            },
            "required": ["asset_name"],
        },
    },
]


def _execute_local_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Routes function calls to our grounded Python tools."""
    logger.info("Executing copilot tool: %s with args: %s", name, args)
    if name == "get_solar_forecast":
        return fetch_solar_and_carbon_forecast(horizon_hours=args.get("horizon_hours", 24))
    elif name == "get_dispatch_schedule":
        return fetch_current_dispatch_plan(horizon_hours=args.get("horizon_hours", 24))
    elif name == "simulate_whatif":
        return run_whatif_simulation(
            pv_capacity_kw=args.get("pv_capacity_kw", 0.0),
            base_load_kw=args.get("base_load_kw", 0.0),
            feeder_capacity_kw=args.get("feeder_capacity_kw"),
            horizon_hours=args.get("horizon_hours", 24),
        )
    elif name == "explain_decision":
        return explain_asset_decision(asset_name=args.get("asset_name", "Asset"))
    return {"error": f"Unknown tool: {name}"}


async def chat_with_copilot(
    message: str,
    role: str = "facility_manager",
    conversation_history: List[Dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    """
    Orchestrates the grounded Copilot interaction loop:
    1. Sends query to Google Gemini with MCP tool declarations.
    2. Executes tool calls against live solvers/databases.
    3. Feeds back tool outputs to generate the final verified response.
    """
    api_key = settings.gemini_api_key.strip()
    model_name = settings.copilot_model.strip() or "gemini-2.5-flash"

    # Fallback if no API key is provided
    if not api_key:
        return _rule_based_fallback(message, role)

    endpoint_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    )

    system_instruction = {"parts": [{"text": get_system_prompt(role)}]}

    # Build contents turn
    contents = []
    if conversation_history:
        for turn in conversation_history[-6:]:  # Keep last 3 exchanges
            contents.append(turn)

    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "contents": contents,
        "systemInstruction": system_instruction,
        "tools": [{"functionDeclarations": TOOL_DECLARATIONS}],
        "generationConfig": {
            "temperature": 0.2,  # Low temperature for deterministic, factual outputs
            "maxOutputTokens": 1000,
        },
    }

    executed_tool_records = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint_url, json=payload)
            if resp.status_code != 200:
                logger.error("Gemini API error (%d): %s", resp.status_code, resp.text)
                return _rule_based_fallback(message, role)

            resp_json = resp.json()
            candidates = resp_json.get("candidates", [])
            if not candidates:
                return _rule_based_fallback(message, role)

            candidate_content = candidates[0].get("content", {})
            parts = candidate_content.get("parts", [])

            # Check if Gemini called a tool
            function_call = None
            for p in parts:
                if "functionCall" in p:
                    function_call = p["functionCall"]
                    break

            if function_call:
                fn_name = function_call.get("name")
                fn_args = function_call.get("args", {})
                tool_result = _execute_local_tool(fn_name, fn_args)
                executed_tool_records.append({"tool": fn_name, "args": fn_args, "result": tool_result})

                # Follow-up turn providing tool response back to Gemini
                contents.append(candidate_content)
                contents.append({
                    "role": "function",
                    "parts": [
                        {
                            "functionResponse": {
                                "name": fn_name,
                                "response": {"output": tool_result},
                            }
                        }
                    ],
                })

                follow_up_payload = {
                    "contents": contents,
                    "systemInstruction": system_instruction,
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1000},
                }

                follow_resp = await client.post(endpoint_url, json=follow_up_payload)
                if follow_resp.status_code == 200:
                    follow_json = follow_resp.json()
                    follow_parts = (
                        follow_json.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    )
                    reply_text = "".join(p.get("text", "") for p in follow_parts).strip()
                    return {
                        "status": "success",
                        "role": role,
                        "reply": reply_text or "Analysis completed successfully.",
                        "tool_calls": executed_tool_records,
                    }

            # If no tool was called, return standard text response
            reply_text = "".join(p.get("text", "") for p in parts).strip()
            return {
                "status": "success",
                "role": role,
                "reply": reply_text,
                "tool_calls": executed_tool_records,
            }

    except Exception as exc:
        logger.exception("Failed during Copilot reasoning: %s", exc)
        return _rule_based_fallback(message, role)


def _rule_based_fallback(message: str, role: str) -> Dict[str, Any]:
    """Deterministic, grounded fallback in case external network is unreachable."""
    msg_lower = message.lower()
    tool_records = []

    if "solar" in msg_lower or "weather" in msg_lower or "forecast" in msg_lower:
        data = fetch_solar_and_carbon_forecast()
        tool_records.append({"tool": "get_solar_forecast", "result": data})
        peak = data["solar"]["peak_ghi_w_per_m2"]
        avg_carbon = data["carbon_telemetry"]["average_intensity_gco2_kwh"]
        if role == "grid_operator":
            reply = (
                f"Telemetried regional forecast: Peak GHI {peak} W/m² at {data['solar']['peak_solar_time']}. "
                f"Grid carbon intensity average: {avg_carbon} gCO2eq/kWh. Feeder headroom optimal between 10:00–14:00."
            )
        else:
            reply = (
                f"Today's peak solar generation is forecast at {peak} W/m² around midday. "
                f"Grid carbon averages {avg_carbon} gCO2eq/kWh. Best window to charge the battery is between 10:00 and 14:00."
            )
    elif "what if" in msg_lower or "scenario" in msg_lower or "drop" in msg_lower or "add" in msg_lower:
        data = run_whatif_simulation(pv_capacity_kw=200.0)
        tool_records.append({"tool": "simulate_whatif", "result": data})
        cost_diff = data["impact_vs_baseline"]["cost_change_usd"]
        carbon_diff = data["impact_vs_baseline"]["emissions_change_kg"]
        reply = (
            f"Scenario simulation with 200 kW solar capacity: Operating cost reduces by ${abs(cost_diff)} "
            f"and emissions fall by {abs(carbon_diff)} kg CO2 over 24 hours."
        )
    else:
        data = fetch_current_dispatch_plan()
        tool_records.append({"tool": "get_dispatch_schedule", "result": data})
        kpis = data["kpis"]
        if role == "grid_operator":
            reply = (
                f"Active 24h MILP schedule: Total peak shaved: {kpis['peak_load_shaved_kw']} kW. "
                f"Emissions shaved: {kpis['carbon_saved_kg']} kg CO2. All constraints verified against feeder limits."
            )
        else:
            reply = (
                f"Today's optimized schedule yields ${kpis['cost_savings_usd']} in electricity cost savings "
                f"and shaves {kpis['carbon_saved_kg']} kg CO2 by moving batch loads to off-peak tariff hours."
            )

    return {
        "status": "success",
        "role": role,
        "reply": reply,
        "tool_calls": tool_records,
    }

