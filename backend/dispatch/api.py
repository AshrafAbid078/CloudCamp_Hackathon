"""
Dispatch API Router
===================
Endpoints:
  GET /dispatch/plan?hours=N    → run the LP optimizer (all authenticated roles)
  GET /dispatch/history         → last 50 dispatch runs (grid_operator + admin)

Generates an optimized dispatch plan by:
  1. Calling the real Phase 2 forecast (get_forecast()) for the BD region.
  2. Mapping forecast timestamps to electricity prices via the tariff JSON.
  3. Using grid_stress_gco2_kwh from the forecast as the carbon signal.
  4. Loading real synthetic facilities and batteries from parquet files.
  5. Running dispatch_plan() with the real prices, carbon, and assets.
  6. Logging the result to the dispatch_runs DB table.

This wires Phase 2 and Phase 3 together — the dispatch optimizer now
operates on the same signal the frontend and copilot will see.
"""

import json
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from dispatch.adapters import IndustrialProcessAdapter, BatteryAdapter
from dispatch.planner import dispatch_plan

# ---------------------------------------------------------------------------
# Phase 2 forecast — imported here to wire the two phases together.
# ---------------------------------------------------------------------------
from forecasting.router import get_forecast

# ---------------------------------------------------------------------------
# Auth & DB
# ---------------------------------------------------------------------------
from auth.utils import get_current_user, require_role
from db.database import get_db
from db.models import DispatchRun, User, UserRole

router = APIRouter(
    prefix="/dispatch",
    tags=["Dispatch"],
)

# ---------------------------------------------------------------------------
# Static asset paths — resolved once at module load time.
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[2]   # Meridian_Grid/
_SYNTHETIC_DIR = _PROJECT_ROOT / "data" / "synthetic"
_TARIFF_PATH = _SYNTHETIC_DIR / "tariff_placeholder.json"
_FACILITIES_PATH = _SYNTHETIC_DIR / "facilities.parquet"
_BATTERIES_PATH = _SYNTHETIC_DIR / "batteries.parquet"


# ---------------------------------------------------------------------------
# Tariff loader — called once at startup, result cached in module scope.
# ---------------------------------------------------------------------------

def _load_tariff() -> dict:
    """
    Load the TOU tariff from the JSON placeholder file.

    Returns a dict keyed by hour (0–23) → price per kWh (USD).
    """
    if not _TARIFF_PATH.exists():
        # Fallback: flat 0.10 USD/kWh for all hours if file missing.
        return {h: 0.10 for h in range(24)}

    with open(_TARIFF_PATH) as f:
        tariff = json.load(f)

    # Build a per-hour price lookup from the TOU rate tiers.
    hour_to_price = {}
    for tier, info in tariff.get("rates", {}).items():
        price = info.get("price", 0.10)
        for hour in info.get("hours", []):
            hour_to_price[hour] = price

    # Fill any missing hours with the mid-peak rate as fallback.
    mid_peak_price = tariff.get("rates", {}).get("mid_peak", {}).get("price", 0.10)
    for h in range(24):
        if h not in hour_to_price:
            hour_to_price[h] = mid_peak_price

    return hour_to_price


_TARIFF: dict = _load_tariff()


# ---------------------------------------------------------------------------
# Asset loaders — loaded once at startup, results cached in module scope.
# This avoids re-reading parquet on every request.
# ---------------------------------------------------------------------------

def _load_process_adapters() -> list[IndustrialProcessAdapter]:
    """
    Load synthetic facilities.parquet and return a list of
    IndustrialProcessAdapter objects ready for the planner.
    """
    if not _FACILITIES_PATH.exists():
        return []

    df = pd.read_parquet(_FACILITIES_PATH)

    adapters = []
    for _, row in df.iterrows():
        adapters.append(
            IndustrialProcessAdapter(
                asset_id=str(row["facility_id"]),
                name=str(row["name"]),
                power_kw=float(row["power_kw"]),
                earliest_start=int(row["earliest_start"]),
                deadline=int(row["deadline"]),
                duration=int(row["duration"]),
            )
        )
    return adapters


def _load_battery_adapters() -> list[BatteryAdapter]:
    """
    Load synthetic batteries.parquet and return a list of
    BatteryAdapter objects ready for the planner.
    """
    if not _BATTERIES_PATH.exists():
        return []

    df = pd.read_parquet(_BATTERIES_PATH)

    adapters = []
    for _, row in df.iterrows():
        adapters.append(
            BatteryAdapter(
                asset_id=str(row["battery_id"]),
                capacity_kwh=float(row["capacity_kwh"]),
                current_soc=float(row["current_soc"]),
                charge_rate_kw=float(row["charge_rate_kw"]),
                discharge_rate_kw=float(row["discharge_rate_kw"]),
            )
        )
    return adapters


_ALL_PROCESSES: list[IndustrialProcessAdapter] = _load_process_adapters()
_ALL_BATTERIES: list[BatteryAdapter] = _load_battery_adapters()


# ---------------------------------------------------------------------------
# Helper: filter assets whose shift window fits inside the requested horizon.
# A process can only be scheduled if its deadline ≤ the horizon length.
# A battery can always run over any horizon.
# ---------------------------------------------------------------------------

def _filter_processes(
    processes: list[IndustrialProcessAdapter],
    hours: int,
) -> list[IndustrialProcessAdapter]:
    return [p for p in processes if p.deadline <= hours and p.duration <= hours]


# ---------------------------------------------------------------------------
# GET /dispatch/plan
# ---------------------------------------------------------------------------

@router.get("/plan")
def get_dispatch_plan(
    hours: int = Query(
        default=24,
        ge=1,
        le=24,
        description="Number of time slots to optimize (1–24). Must match forecast horizon.",
    ),
    region: str = Query(
        default="bd",
        description="Region code. Currently only 'bd' is supported.",
    ),
    current_user: User = Depends(
        require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)
    ),
    db: Session = Depends(get_db),
):
    """
    Generate an optimized dispatch plan using the real Phase 2 forecast.

    **Data flow:**
    1. Calls `get_forecast(region, horizon_hours=hours)` → timestamps + carbon signal.
    2. Maps each timestamp's hour to a TOU tariff price.
    3. Filters assets whose scheduling window fits the requested horizon.
    4. Runs the PuLP LP optimizer for all industrial processes and batteries.
    5. Returns the schedule + KPI deltas (cost saved, tCO2 saved, peak kW shaved)
       broken out per asset type.

    Returns:
    - `industrial`: per-process baseline vs optimized schedule + KPI deltas.
    - `batteries`: per-battery charge/discharge schedule + KPI deltas.
    - `kpis`: system-level totals.
    - `forecast_used`: the actual forecast signal the optimizer ran on.
    """
    try:
        # ----------------------------------------------------------
        # Step 1: Get the real forecast from Phase 2
        # ----------------------------------------------------------
        forecast_data = get_forecast(region=region, horizon_hours=hours)
        forecast = forecast_data["forecast"]

        timestamps = forecast["timestamps"]           # ISO strings
        carbon_intensity = forecast["grid_stress_gco2_kwh"]  # list[float]

        # ----------------------------------------------------------
        # Step 2: Map timestamps → TOU electricity prices
        # ----------------------------------------------------------
        prices = []
        for ts in timestamps:
            hour = pd.Timestamp(ts).hour
            prices.append(_TARIFF.get(hour, 0.10))

        # ----------------------------------------------------------
        # Step 3: Filter assets that fit inside the horizon
        # ----------------------------------------------------------
        processes = _filter_processes(_ALL_PROCESSES, hours)
        batteries = _ALL_BATTERIES

        if not processes and not batteries:
            raise HTTPException(
                status_code=500,
                detail=(
                    "No assets available. "
                    "Ensure data/synthetic/facilities.parquet and batteries.parquet exist."
                ),
            )

        # ----------------------------------------------------------
        # Step 4: Run the dispatch optimizer
        # ----------------------------------------------------------
        plan = dispatch_plan(
            industrial_assets=processes,
            battery_assets=batteries,
            prices=prices,
            carbon_intensity=carbon_intensity,
        )

        # ----------------------------------------------------------
        # Step 5: Log this run to the DB
        # ----------------------------------------------------------
        kpis = plan.get("kpis", {})
        run = DispatchRun(
            region=region,
            hours=hours,
            industrial_count=len(processes),
            battery_count=len(batteries),
            cost_saved_usd=kpis.get("total_cost_saved_usd"),
            co2_saved_kg=kpis.get("total_co2_saved_kg"),
            peak_shaved_kw=kpis.get("total_peak_shaved_kw"),
            model_used=forecast_data["accuracy"].get("model"),
            triggered_by=current_user.username,
        )
        db.add(run)
        db.commit()

        # ----------------------------------------------------------
        # Step 6: Return result with forecast metadata attached
        # ----------------------------------------------------------
        return {
            "status": "success",
            "region": region,
            "hours": hours,
            "run_id": run.id,
            "forecast_used": {
                "model": forecast_data["accuracy"]["model"],
                "accuracy": forecast_data["accuracy"],
                "timestamps": timestamps,
                "prices_usd_kwh": prices,
                "carbon_intensity_gco2_kwh": carbon_intensity,
            },
            "assets": {
                "industrial_count": len(processes),
                "battery_count": len(batteries),
            },
            "plan": plan,
        }

    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /dispatch/history  (grid_operator + admin)
# ---------------------------------------------------------------------------

@router.get("/history", summary="[Grid Operator / Admin] Last 50 dispatch runs")
def get_dispatch_history(
    limit: int = Query(default=50, ge=1, le=200, description="Max rows to return."),
    _user: User = Depends(require_role(UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    """
    Return the most recent dispatch runs logged in the database.
    **grid_operator or admin role required.**

    Each row contains the timestamp, region, horizon, asset counts,
    system-level KPI deltas (cost saved, CO2 saved, peak shaved),
    and which model was active during that run.
    """
    runs = (
        db.query(DispatchRun)
        .order_by(DispatchRun.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {
        "count": len(runs),
        "runs": [
            {
                "id": r.id,
                "timestamp": r.timestamp.isoformat(),
                "region": r.region,
                "hours": r.hours,
                "industrial_count": r.industrial_count,
                "battery_count": r.battery_count,
                "cost_saved_usd": r.cost_saved_usd,
                "co2_saved_kg": r.co2_saved_kg,
                "peak_shaved_kw": r.peak_shaved_kw,
                "model_used": r.model_used,
                "triggered_by": r.triggered_by,
            }
            for r in runs
        ],
    }