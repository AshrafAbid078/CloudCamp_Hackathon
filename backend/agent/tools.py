"""Read-only demo tools shared by Gemini function calling and the stdio MCP server."""
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from forecasting.router import get_forecast
from dispatch.api import _build_dispatch_plan

Horizon = Annotated[int, Field(ge=1, le=24)]
_horizon = TypeAdapter(Horizon)


class ScenarioInputs(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    pv_capacity_kw: float = Field(default=0, ge=0, le=100_000)
    base_load_kw: float = Field(default=0, ge=0, le=100_000)
    feeder_capacity_kw: float | None = Field(default=None, gt=0, le=1_000_000)
    horizon_hours: Horizon = 24


def _preview(horizon_hours: int, **kwargs) -> dict:
    return _build_dispatch_plan(hours=_horizon.validate_python(horizon_hours), region="bd",
                               feeder_capacity_kw=kwargs.get("feeder_capacity_kw"),
                               pv_capacity_kw=kwargs.get("pv_capacity_kw", 0.0),
                               base_load_kw=kwargs.get("base_load_kw", 0.0))


def fetch_solar_and_carbon_forecast(horizon_hours: int = 24) -> dict:
    hours = _horizon.validate_python(horizon_hours)
    data = get_forecast(region="bd", horizon_hours=hours, source="auto")
    forecast, sources = data["forecast"], data["sources"]
    solar, carbon, timestamps = (forecast["solar_ghi_w_m2"], forecast["grid_stress_gco2_kwh"],
                                 forecast["timestamps"])
    if not solar or len(solar) != len(carbon) or len(solar) != len(timestamps):
        raise ValueError("Forecast arrays are unavailable or inconsistent.")
    peak_index = max(range(len(solar)), key=solar.__getitem__)
    return {
        "region": "Bangladesh (Dhaka Grid)", "horizon_hours": hours,
        "sources": sources, "model": data["accuracy"]["model"],
        "solar": {"source": sources["solar"], "peak_ghi_w_per_m2": round(solar[peak_index], 1),
                  "average_ghi_w_per_m2": round(sum(solar) / len(solar), 1),
                  "peak_solar_time": timestamps[peak_index], "unit": "W/m²",
                  "uncertainty": "Heuristic display range; not calibrated quantiles"},
        "carbon_telemetry": {"source": sources["carbon"],
                             "average_intensity_gco2_kwh": round(sum(carbon) / len(carbon), 1),
                             "unit": "gCO2eq/kWh", "as_of": sources.get("carbon_as_of"),
                             "status": "forecast" if sources["carbon"] == "electricity_maps_v4_forecast"
                             else "persistence" if "recent_reading" in sources["carbon"] else "archived"},
    }


def fetch_current_dispatch_plan(horizon_hours: int = 24) -> dict:
    result = _preview(horizon_hours)
    plan, kpis = result["plan"], result["plan"]["kpis"]
    return {
        "status": "optimal", "scope": "Unsaved synthetic portfolio preview; not a user's saved plan",
        "horizon_hours": result["hours"], "sources": result["forecast_used"]["sources"],
        "timestamps": result["forecast_used"]["timestamps"], "assumptions": result["assumptions"],
        "kpis": {"baseline_cost_usd": round(kpis["baseline_cost"], 2),
                 "optimized_cost_usd": round(kpis["optimized_cost"], 2),
                 "cost_savings_usd": round(kpis["cost_saved_usd"], 2),
                 "carbon_saved_kg": round(kpis["co2_saved_kg"], 2),
                 "peak_load_shaved_kw": round(kpis["peak_shaved_kw"], 2)},
        "scheduled_processes_count": len(plan["industrial"]),
        "industrial_processes": [
            {"asset_id": p["asset_id"], "asset": p["name"], "power_kw": p["power_kw"],
             "duration_hours": p["duration"], "deadline_hour": p["deadline"],
             "optimal_start_hour": p["optimized_hours"][0] if p["optimized_hours"] else None,
             "scheduled_hours": p["optimized_hours"], "cost_saved_usd": round(p["cost_saved"], 2),
             "carbon_saved_kg": round(p["emissions_saved_gco2"] / 1000, 2)}
            for p in plan["industrial"]],
        "batteries": [
            {"asset_id": b["asset_id"], "battery": b["asset_id"], "capacity_kwh": b["capacity_kwh"],
             "charge_hours": [s["hour"] for s in b["schedule"] if s["charge_kw"] > 1e-5],
             "discharge_hours": [s["hour"] for s in b["schedule"] if s["discharge_kw"] > 1e-5],
             "cost_saved_usd": round(b["cost_saved"], 2)} for b in plan["batteries"]],
        "note": "Modeled results, synthetic assets and tariff; no equipment control. Negative savings mean increases.",
    }


def run_whatif_simulation(pv_capacity_kw: float = 0, base_load_kw: float = 0,
                         feeder_capacity_kw: float | None = None, horizon_hours: int = 24) -> dict:
    inputs = ScenarioInputs(pv_capacity_kw=pv_capacity_kw, base_load_kw=base_load_kw,
                            feeder_capacity_kw=feeder_capacity_kw, horizon_hours=horizon_hours)
    kwargs = inputs.model_dump()
    reference = _preview(**{**kwargs, "pv_capacity_kw": 0})
    scenario = _preview(**kwargs)
    ref, scen = reference["plan"]["kpis"], scenario["plan"]["kpis"]
    change = {"cost_change_usd": round(scen["optimized_cost"] - ref["optimized_cost"], 2),
              "emissions_change_kg": round((scen["optimized_emissions_gco2"] - ref["optimized_emissions_gco2"]) / 1000, 2),
              "peak_load_change_kw": round(scen["peak_optimized_kw"] - ref["peak_optimized_kw"], 2)}
    return {"scenario_inputs": kwargs, "impact_vs_baseline": change,
            "sources": scenario["forecast_used"]["sources"],
            "summary": "Changes compare modeled optimized results with a zero-PV scenario. Negative changes mean reductions."}


def explain_asset_decision(asset_name: str) -> dict:
    name = asset_name.strip().casefold()
    if not name or len(name) > 64:
        raise ValueError("Provide an asset name or identifier of at most 64 characters.")
    plan = fetch_current_dispatch_plan()
    processes = [p for p in plan["industrial_processes"]
                 if name in (p["asset"].casefold(), p["asset_id"].casefold())]
    batteries = [b for b in plan["batteries"] if name == b["asset_id"].casefold()]
    if name in ("battery", "bess", "ব্যাটারি") and plan["batteries"]:
        batteries = plan["batteries"][:1]
    if batteries:
        asset = batteries[0]
        return {"asset": asset["asset_id"], "strategy": "Modeled battery schedule",
                "logic": f"Charge slots: {asset['charge_hours']}; discharge slots: {asset['discharge_hours']}. Slots are offsets from the first forecast timestamp.",
                "evidence": asset, "sources": plan["sources"], "timestamps": plan["timestamps"],
                "note": plan["note"]}
    if processes:
        asset = processes[0]
        return {"asset": asset["asset"], "strategy": "Constrained batch scheduling",
                "logic": f"Scheduled slots {asset['scheduled_hours']}; required duration {asset['duration_hours']}h; deadline slot {asset['deadline_hour']}. The solver balances modeled cost, carbon and peak import.",
                "evidence": asset, "sources": plan["sources"], "timestamps": plan["timestamps"],
                "note": plan["note"]}
    return {"asset": asset_name, "error": "Asset not found in the synthetic portfolio preview.",
            "available_assets": [p["asset"] for p in plan["industrial_processes"]] +
                                [b["asset_id"] for b in plan["batteries"]]}
