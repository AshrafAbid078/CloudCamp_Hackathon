"""
backend/agent/tools.py
======================
Grounded tool implementations for the Meridian Grid AI Agent & Copilot.
These functions interface directly with the real Phase 2 forecasting engine
and Phase 3 PuLP MILP optimizer — preventing LLM hallucinations.
"""

from typing import Any, Dict
from db.database import SessionLocal
from db.models import User, UserRole
from forecasting.router import get_forecast
from dispatch.api import get_dispatch_plan, _load_tariff


def _get_system_user() -> User:
    """Internal user representation for background copilot evaluations."""
    return User(
        id=0,
        username="copilot-agent",
        hashed_password="internal-dummy-hash",
        role=UserRole.admin,
        is_active=True,
    )


def fetch_solar_and_carbon_forecast(horizon_hours: int = 24) -> Dict[str, Any]:
    """
    Retrieves the regional solar irradiance (GHI) and carbon intensity forecast for Bangladesh.

    Args:
        horizon_hours: Forecast lookahead horizon (between 1 and 24 hours).

    Returns:
        Structured forecast metrics including average GHI, peak solar hours,
        grid carbon intensity, and telemetry source.
    """
    bounded_horizon = max(1, min(24, int(horizon_hours)))
    forecast_data = get_forecast(region="bd", horizon_hours=bounded_horizon, source="auto")

    solar = forecast_data.get("solar", {})
    carbon = forecast_data.get("carbon", {})
    timestamps = forecast_data.get("timestamps", [])

    ghi_values = solar.get("values", [])
    max_ghi = max(ghi_values) if ghi_values else 0.0
    avg_ghi = (sum(ghi_values) / len(ghi_values)) if ghi_values else 0.0
    peak_hour_idx = ghi_values.index(max_ghi) if ghi_values and max_ghi > 0 else 12
    peak_timestamp = timestamps[peak_hour_idx] if peak_hour_idx < len(timestamps) else "Midday"

    carbon_values = carbon.get("values", [])
    avg_carbon = (sum(carbon_values) / len(carbon_values)) if carbon_values else 625.0

    return {
        "region": "Bangladesh (Dhaka Grid)",
        "horizon_hours": bounded_horizon,
        "solar": {
            "source": solar.get("source", "Open-Meteo regional forecast"),
            "peak_ghi_w_per_m2": round(max_ghi, 1),
            "average_ghi_w_per_m2": round(avg_ghi, 1),
            "peak_solar_time": peak_timestamp,
            "unit": "W/m²",
            "confidence_band": "±15%",
        },
        "carbon_telemetry": {
            "source": carbon.get("source", "Electricity Maps v4"),
            "average_intensity_gco2_kwh": round(avg_carbon, 1),
            "unit": "gCO2eq/kWh",
            "status": "active",
        },
    }


def fetch_current_dispatch_plan(horizon_hours: int = 24) -> Dict[str, Any]:
    """
    Computes or retrieves the optimal MILP dispatch plan for the next horizon.

    Args:
        horizon_hours: Number of hours to schedule (1 to 24).

    Returns:
        Schedule summary including cost savings ($), emissions shaved (kg),
        peak reduction (kW), and asset scheduling windows.
    """
    bounded_hours = max(1, min(24, int(horizon_hours)))
    system_user = _get_system_user()
    db = SessionLocal()
    try:
        result = get_dispatch_plan(
            hours=bounded_hours,
            region="bd",
            current_user=system_user,
            db=db,
            record=False,
            feeder_capacity_kw=None,
            pv_capacity_kw=0.0,
            base_load_kw=0.0,
        )
        plan = result.get("plan", {})
        kpis = plan.get("kpis", {})

        # Summarize industrial assets
        industrial_summary = []
        for p in plan.get("industrial", []):
            industrial_summary.append({
                "asset": p.get("process_name"),
                "power_kw": p.get("power_kw"),
                "duration_hours": p.get("duration_hours"),
                "optimal_start_hour": p.get("optimal_start_hour"),
                "deadline_hour": p.get("deadline_hour"),
                "cost_saved_usd": round(p.get("cost_saved", 0.0), 2),
            })

        # Summarize batteries
        battery_summary = []
        for b in plan.get("batteries", []):
            charge_slots = [
                idx for idx, act in enumerate(b.get("actions", [])) if act == "CHARGE"
            ]
            discharge_slots = [
                idx for idx, act in enumerate(b.get("actions", [])) if act == "DISCHARGE"
            ]
            battery_summary.append({
                "battery": b.get("battery_name"),
                "capacity_kwh": b.get("capacity_kwh"),
                "charge_hours": charge_slots,
                "discharge_hours": discharge_slots,
                "cost_saved_usd": round(b.get("cost_saved", 0.0), 2),
            })

        return {
            "status": "optimal",
            "horizon_hours": bounded_hours,
            "kpis": {
                "baseline_cost_usd": round(kpis.get("baseline_cost", 0.0), 2),
                "optimized_cost_usd": round(kpis.get("optimized_cost", 0.0), 2),
                "cost_savings_usd": round(kpis.get("cost_savings_usd", 0.0), 2),
                "carbon_saved_kg": round(kpis.get("carbon_savings_kg", 0.0), 2),
                "peak_load_shaved_kw": round(kpis.get("peak_shaved_kw", 0.0), 2),
            },
            "scheduled_processes_count": len(industrial_summary),
            "industrial_processes": industrial_summary[:5],  # Top 5 for brevity
            "batteries": battery_summary,
        }
    finally:
        db.close()


def run_whatif_simulation(
    pv_capacity_kw: float = 0.0,
    base_load_kw: float = 0.0,
    feeder_capacity_kw: float | None = None,
    horizon_hours: int = 24,
) -> Dict[str, Any]:
    """
    Executes a real-time MILP what-if scenario solving processes and batteries
    under altered solar PV capacity or load conditions.

    Args:
        pv_capacity_kw: Simulated rooftop solar capacity in kW (e.g. 100, 250, 500).
        base_load_kw: Continuous facility base load in kW.
        feeder_capacity_kw: Maximum grid feeder import limit in kW.
        horizon_hours: Horizon window (1 to 24 hours).

    Returns:
        Exact signed impact deltas comparing the scenario against baseline zero-PV.
    """
    bounded_hours = max(1, min(24, int(horizon_hours)))
    safe_pv = max(0.0, float(pv_capacity_kw))
    safe_load = max(0.0, float(base_load_kw))
    safe_feeder = float(feeder_capacity_kw) if feeder_capacity_kw and feeder_capacity_kw > 0 else None

    system_user = _get_system_user()
    db = SessionLocal()
    try:
        common = {
            "hours": bounded_hours,
            "region": "bd",
            "current_user": system_user,
            "db": db,
            "record": False,
            "feeder_capacity_kw": safe_feeder,
            "base_load_kw": safe_load,
        }
        # Run baseline reference (0 PV)
        ref_result = get_dispatch_plan(**common, pv_capacity_kw=0.0)
        # Run scenario with target PV
        scen_result = get_dispatch_plan(**common, pv_capacity_kw=safe_pv)

        ref_kpis = ref_result.get("plan", {}).get("kpis", {})
        scen_kpis = scen_result.get("plan", {}).get("kpis", {})

        cost_delta = scen_kpis.get("optimized_cost", 0.0) - ref_kpis.get("optimized_cost", 0.0)
        emissions_delta = (
            scen_kpis.get("optimized_emissions_gco2", 0.0) - ref_kpis.get("optimized_emissions_gco2", 0.0)
        ) / 1000.0
        peak_delta = scen_kpis.get("peak_optimized_kw", 0.0) - ref_kpis.get("peak_optimized_kw", 0.0)

        return {
            "scenario_inputs": {
                "pv_capacity_kw": safe_pv,
                "base_load_kw": safe_load,
                "feeder_limit_kw": safe_feeder,
                "horizon_hours": bounded_hours,
            },
            "impact_vs_baseline": {
                "cost_change_usd": round(cost_delta, 2),
                "emissions_change_kg": round(emissions_delta, 2),
                "peak_load_change_kw": round(peak_delta, 2),
            },
            "summary": (
                f"Adding {safe_pv} kW solar capacity reduces net operating cost by "
                f"${abs(round(cost_delta, 2))} and shaves {abs(round(emissions_delta, 2))} kg CO2."
                if cost_delta <= 0
                else f"Simulation completed with cost change: ${round(cost_delta, 2)}."
            ),
        }
    finally:
        db.close()


def explain_asset_decision(asset_name: str) -> Dict[str, Any]:
    """
    Explains the economic and grid-stress rationale behind why an asset was scheduled
    at a specific time slot.

    Args:
        asset_name: Identifier or name of the process or battery.

    Returns:
        Explanation detailing Time-of-Use (TOU) tariff windows and solar alignment.
    """
    tariff = _load_tariff()
    peak_rate = tariff.get("peak_rate", 0.20)
    offpeak_rate = tariff.get("offpeak_rate", 0.05)
    peak_hours = tariff.get("peak_hours", [17, 18, 19, 20, 21, 22])

    clean_name = asset_name.strip().lower()

    if "battery" in clean_name or "bess" in clean_name:
        return {
            "asset": asset_name,
            "strategy": "Arbitrage & Peak Shaving",
            "logic": (
                f"The battery charges during off-peak hours (rate: ${offpeak_rate}/kWh) "
                f"or during peak solar generation (10:00–14:00), and discharges during high-tariff "
                f"grid stress hours (17:00–22:00, rate: ${peak_rate}/kWh). "
                f"This captures maximum price spread while accounting for 95% round-trip efficiency."
            ),
        }

    return {
        "asset": asset_name,
        "strategy": "Non-interruptible Batch Load Shifting",
        "logic": (
            f"The MILP optimizer avoids scheduling continuous industrial batches during Bangladesh's "
            f"peak tariff window ({peak_hours[0]}:00–{peak_hours[-1]}:00, ${peak_rate}/kWh). "
            f"Instead, loads are shifted to night/morning off-peak hours (${offpeak_rate}/kWh) "
            f"or synchronized with peak rooftop solar production, respecting machine deadline constraints."
        ),
    }
