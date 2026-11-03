"""Bounded Gemini function calling with explicit local-tool fallback."""
import logging
import re

import httpx
from starlette.concurrency import run_in_threadpool

from config import settings
from .limits import reserve_model_call
from .prompts import get_system_prompt
from .tools import (fetch_solar_and_carbon_forecast, fetch_current_dispatch_plan,
                    run_whatif_simulation, explain_asset_decision)

logger = logging.getLogger(__name__)
TOOL_DECLARATIONS = [
    {"name": "get_solar_forecast", "description": "Source-labelled regional GHI and carbon outlook; never on-site telemetry.",
     "parameters": {"type": "OBJECT", "properties": {"horizon_hours": {"type": "INTEGER", "minimum": 1, "maximum": 24}}}},
    {"name": "get_dispatch_schedule", "description": "Unsaved synthetic-portfolio preview, including signed savings and battery slots. Not the user's saved plan.",
     "parameters": {"type": "OBJECT", "properties": {"horizon_hours": {"type": "INTEGER", "minimum": 1, "maximum": 24}}}},
    {"name": "simulate_whatif", "description": "Compare an explicit PV capacity with zero PV; negative deltas mean reductions.",
     "parameters": {"type": "OBJECT", "properties": {
         "pv_capacity_kw": {"type": "NUMBER", "minimum": 0, "maximum": 100000},
         "base_load_kw": {"type": "NUMBER", "minimum": 0, "maximum": 100000},
         "feeder_capacity_kw": {"type": "NUMBER", "minimum": 0},
         "horizon_hours": {"type": "INTEGER", "minimum": 1, "maximum": 24}}, "required": ["pv_capacity_kw"]}},
    {"name": "explain_decision", "description": "Inspect a named asset's actual demo schedule; unknown assets return an error.",
     "parameters": {"type": "OBJECT", "properties": {"asset_name": {"type": "STRING"}}, "required": ["asset_name"]}},
]


def _execute_local_tool(name: str, args: dict) -> dict:
    functions = {"get_solar_forecast": fetch_solar_and_carbon_forecast,
                 "get_dispatch_schedule": fetch_current_dispatch_plan,
                 "simulate_whatif": run_whatif_simulation, "explain_decision": explain_asset_decision}
    if name not in functions:
        return {"error": "Unknown tool."}
    try:
        return functions[name](**args)
    except Exception:
        return {"error": "Tool inputs are invalid or the requested demo data is unavailable."}


async def _fallback(message: str, role: str, history: list[dict]) -> dict:
    return await run_in_threadpool(_rule_based_fallback, message, role, history)


async def chat_with_copilot(message: str, role: str = "facility_manager",
                            conversation_history: list[dict] | None = None, *, allow_llm: bool = True) -> dict:
    history = conversation_history or []
    key, model = settings.gemini_api_key.strip(), settings.copilot_model.strip()
    if not allow_llm or not key or not re.fullmatch(r"[\w.-]+", model):
        return await _fallback(message, role, history)
    # API keys in query strings leak through HTTP request logging.
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    contents = [{"role": t["role"], "parts": [{"text": t["text"]}]} for t in history[-6:]]
    contents.append({"role": "user", "parts": [{"text": message}]})
    records = []
    try:
        async with httpx.AsyncClient(timeout=20, headers={"x-goog-api-key": key}) as client:
            for _ in range(3):
                if not reserve_model_call():
                    break
                response = await client.post(url, json={
                    "contents": contents, "systemInstruction": {"parts": [{"text": get_system_prompt(role)}]},
                    "tools": [{"functionDeclarations": TOOL_DECLARATIONS}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800},
                })
                if response.status_code != 200:
                    logger.warning("Gemini returned HTTP %s; using local tools.", response.status_code)
                    break
                candidates = response.json().get("candidates", [])
                content = candidates[0].get("content", {}) if candidates else {}
                parts = content.get("parts", [])
                calls = [p["functionCall"] for p in parts if "functionCall" in p]
                if calls:
                    if len(records) + len(calls) > 4:
                        break
                    contents.append(content)
                    results = []
                    for call in calls:
                        name, args = call.get("name", ""), call.get("args", {})
                        result = await run_in_threadpool(_execute_local_tool, name, args)
                        records.append({"tool": name, "args": args, "result": result})
                        results.append({"functionResponse": {"name": name, "response": result}})
                    contents.append({"role": "user", "parts": results})
                    continue
                text = "".join(p.get("text", "") for p in parts).strip()
                # Factual answers must carry tool evidence even if the model skips calling tools.
                if text and records and not any("error" in r["result"] for r in records):
                    return {"status": "success", "mode": "gemini", "role": role,
                            "reply": text, "tool_calls": records}
                break
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        logger.warning("Gemini response unavailable; using local tools.")
    return await _fallback(message, role, history)


def _rule_based_fallback(message: str, role: str, history: list[dict] | None = None) -> dict:
    text = message.lower().translate(str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789"))
    bangla = bool(re.search(r"[\u0980-\u09ff]", message))
    records = []
    scenario = any(word in text for word in ("what if", "what happens", "scenario", "install", "drop", "add", "যদি", "যোগ", "সোলার লাগ"))
    if scenario:
        capacity = re.search(r"(\d+(?:\.\d+)?)\s*(?:kw\b|কিলোওয়াট|কিলোওয়াট)", text)
        if not capacity:
            reply = "তুলনার জন্য সৌর ক্ষমতা kW-এ দিন, যেমন 200 kW। শতাংশ পরিবর্তনের জন্য আগে মূল ক্ষমতা প্রয়োজন।" if bangla else "Provide the solar capacity in kW, for example 200 kW. A percentage change needs an explicit starting capacity."
            return {"status": "needs_input", "mode": "local_tools", "role": role, "reply": reply, "tool_calls": []}
        args = {"pv_capacity_kw": float(capacity[1])}
        name = "simulate_whatif"
    elif any(word in text for word in ("explain", "decision", "battery", "ব্যাটারি", "ব্যাখ্যা")):
        name = "explain_decision"
        match = re.search(r"(?:explain|decision for)\s+(.+)", message, re.I)
        args = {"asset_name": "battery" if "battery" in text or "ব্যাটারি" in text else match[1].strip() if match else message}
    elif any(word in text for word in ("solar", "weather", "forecast", "সোলার", "পূর্বাভাস", "ফোরকাস্ট")):
        name, args = "get_solar_forecast", {}
    else:
        name, args = "get_dispatch_schedule", {}
    data = _execute_local_tool(name, args)
    records.append({"tool": name, "args": args, "result": data})
    if "error" in data:
        reply = "তথ্য পাওয়া যায়নি। asset-এর সঠিক নাম ও inputs যাচাই করুন।" if bangla else data["error"]
        return {"status": "unavailable", "mode": "local_tools", "role": role, "reply": reply, "tool_calls": records}
    if name == "simulate_whatif":
        delta = data["impact_vs_baseline"]
        reply = (f"{args['pv_capacity_kw']:g} kW PV বনাম zero-PV মডেল: খরচ পরিবর্তন ${delta['cost_change_usd']:+.2f}; কার্বন {delta['emissions_change_kg']:+.2f} kg; peak {delta['peak_load_change_kw']:+.2f} kW। ঋণাত্মক মান কমা বোঝায়।" if bangla else
                 f"{args['pv_capacity_kw']:g} kW PV versus zero PV: cost change ${delta['cost_change_usd']:+.2f}; emissions change {delta['emissions_change_kg']:+.2f} kg; peak change {delta['peak_load_change_kw']:+.2f} kW. Negative changes mean reductions.")
    elif name == "get_solar_forecast":
        solar, carbon = data["solar"], data["carbon_telemetry"]
        reply = (f"আঞ্চলিক peak GHI {solar['peak_ghi_w_per_m2']} W/m², সময় {solar['peak_solar_time']}। গড় কার্বন {carbon['average_intensity_gco2_kwh']} gCO2eq/kWh।" if bangla else
                 f"Regional peak GHI: {solar['peak_ghi_w_per_m2']} W/m² at {solar['peak_solar_time']}. Mean carbon intensity: {carbon['average_intensity_gco2_kwh']} gCO2eq/kWh.")
    elif name == "explain_decision":
        reply = data["logic"]
    else:
        k = data["kpis"]
        reply = (f"ডেমো মডেলের savings: খরচ ${k['cost_savings_usd']:+.2f}, কার্বন {k['carbon_saved_kg']:+.2f} kg, peak {k['peak_load_shaved_kw']:+.2f} kW। ঋণাত্মক savings মানে বৃদ্ধি।" if bangla else
                 f"Synthetic portfolio preview: cost savings ${k['cost_savings_usd']:+.2f}; carbon savings {k['carbon_saved_kg']:+.2f} kg; peak reduction {k['peak_load_shaved_kw']:+.2f} kW. Negative savings mean increases.")
    sources = data.get("sources", {})
    reply += f" Sources: solar={sources.get('solar', 'not available')}; carbon={sources.get('carbon', 'not available')}. Modeled demo; no equipment control."
    return {"status": "success", "mode": "local_tools", "role": role, "reply": reply, "tool_calls": records}
