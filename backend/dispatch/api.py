"""
Dispatch API Router
===================
Endpoints:
  GET /dispatch/plan?hours=N    → read-only joint optimizer preview
  POST /dispatch/runs           → persist a complete plan
  POST /dispatch/scenarios      → compare hypothetical PV inputs

Generates an optimized dispatch plan by:
  1. Calling the real Phase 2 forecast (get_forecast()) for the BD region.
  2. Mapping forecast timestamps to electricity prices via the tariff JSON.
  3. Using grid_stress_gco2_kwh from the forecast as the carbon signal.
  4. Loading real synthetic facilities and batteries from parquet files.
  5. Running dispatch_plan() with the real prices, carbon, and assets.
  6. Persisting a plan only for explicit POST requests.

This wires the archived forecast and synthetic demo assets into the dispatch optimizer.
"""

import json
from pathlib import Path
from typing import Literal, Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from zoneinfo import ZoneInfo
from sqlalchemy import func, or_
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
from db.models import DispatchRun, DispatchPlanRecord, DispatchPlanDecision, User, UserRole

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
    record: bool = Query(default=False, description="Deprecated; GET requests never persist a run"),
    feeder_capacity_kw: float | None = Query(default=None, gt=0, description="Optional measured feeder import limit"),
    pv_capacity_kw: float = Query(default=0, ge=0, description="Installed PV capacity; zero means no PV model"),
    base_load_kw: float = Query(default=0, ge=0, description="Measured fixed facility load, if available"),
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
            hour = pd.Timestamp(ts).tz_convert(ZoneInfo("Asia/Dhaka")).hour
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
            pv_generation_kw=[min(max(float(ghi), 0) / 1000, 1) * pv_capacity_kw
                              for ghi in forecast["solar_ghi_w_m2"]],
            base_load_kw=[base_load_kw] * hours,
            feeder_capacity_kw=feeder_capacity_kw,
        )

        # ----------------------------------------------------------
        # Step 5: Return a read-only preview
        # ----------------------------------------------------------
        # POST /dispatch/runs is the only plan creation path.

        # ----------------------------------------------------------
        # Step 6: Return result with forecast metadata attached
        # ----------------------------------------------------------
        return {
            "status": "success",
            "region": region,
            "hours": hours,
            "assumptions": {"feeder_capacity_kw": feeder_capacity_kw,
                            "pv_capacity_kw": pv_capacity_kw, "base_load_kw": base_load_kw,
                            "pv_estimate_only": pv_capacity_kw > 0},
            "run_id": None,
            "forecast_used": {
                "model": forecast_data["accuracy"]["model"],
                "accuracy": forecast_data["accuracy"],
                "sources": forecast_data.get("sources"),
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
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Plan generation is unavailable. Check forecast and solver readiness.")


@router.post("/runs", summary="Create and save a complete dispatch plan")
def create_dispatch_run(
    hours: int = Query(default=24, ge=1, le=24),
    feeder_capacity_kw: float | None = Query(default=None, gt=0),
    pv_capacity_kw: float = Query(default=0, ge=0),
    base_load_kw: float = Query(default=0, ge=0),
    user: User = Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    result = get_dispatch_plan(hours=hours, region="bd", current_user=user, db=db, record=False,
                               feeder_capacity_kw=feeder_capacity_kw, pv_capacity_kw=pv_capacity_kw,
                               base_load_kw=base_load_kw)
    record = DispatchPlanRecord(created_by=user.username, payload_json="")
    db.add(record)
    db.flush()
    result["run_id"] = record.id
    result["decision"] = "pending"
    record.payload_json = json.dumps(result)
    db.commit()
    return result


@router.get("/runs", summary="List saved complete plans")
def list_dispatch_runs(
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    query = db.query(DispatchPlanRecord)
    if user.role == UserRole.facility_manager:
        query = query.filter(DispatchPlanRecord.created_by == user.username)
    records = query.order_by(DispatchPlanRecord.id.desc()).limit(limit).all()
    decisions = {item.run_id: item for item in db.query(DispatchPlanDecision).filter(
        DispatchPlanDecision.run_id.in_([record.id for record in records])
    ).all()} if records else {}
    return {"runs": [
        {"id": record.id, "created_at": record.created_at.isoformat(),
         "created_by": record.created_by,
         "hours": json.loads(record.payload_json)["hours"],
         "kpis": json.loads(record.payload_json)["plan"]["kpis"],
         "decision": decisions[record.id].action if record.id in decisions else "pending"}
        for record in records
    ]}


@router.get("/runs/latest", summary="Retrieve the latest accessible complete plan")
def get_latest_dispatch_run(
    hours: int | None = Query(default=None, ge=1, le=24),
    user: User = Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    query = db.query(DispatchPlanRecord)
    if user.role == UserRole.facility_manager:
        query = query.filter(DispatchPlanRecord.created_by == user.username)
    if hours is not None:
        query = query.filter(func.json_extract(DispatchPlanRecord.payload_json, "$.hours") == hours)
    query = query.outerjoin(DispatchPlanDecision, DispatchPlanDecision.run_id == DispatchPlanRecord.id).filter(
        or_(DispatchPlanDecision.run_id.is_(None), DispatchPlanDecision.action != "reject")
    )
    record = query.order_by(DispatchPlanRecord.id.desc()).first()
    if record is None:
        raise HTTPException(status_code=404, detail="No saved plan is available.")
    result = json.loads(record.payload_json)
    decision = db.query(DispatchPlanDecision).filter(DispatchPlanDecision.run_id == record.id).first()
    result["decision"] = decision.action if decision else "pending"
    return result


@router.get("/runs/{run_id}", summary="Retrieve a saved complete plan")
def get_dispatch_run(
    run_id: int,
    user: User = Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    record = db.query(DispatchPlanRecord).filter(DispatchPlanRecord.id == run_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Run not found.")
    if user.role == UserRole.facility_manager and record.created_by != user.username:
        raise HTTPException(status_code=403, detail="Run is not available to this account.")
    result = json.loads(record.payload_json)
    decision = db.query(DispatchPlanDecision).filter(DispatchPlanDecision.run_id == record.id).first()
    result["decision"] = decision.action if decision else "pending"
    return result


class DispatchDecisionPayload(BaseModel):
    action: Literal["approve", "reject"]
    reason: str | None = Field(default=None, max_length=500)


class DispatchScenarioPayload(BaseModel):
    horizon_hours: int = Field(default=24, ge=1, le=24)
    pv_capacity_kw: float = Field(ge=0)
    base_load_kw: float = Field(default=0, ge=0)
    feeder_capacity_kw: float | None = Field(default=None, gt=0)


@router.post("/scenarios", summary="Compare a hypothetical PV capacity using the joint demo optimizer")
def compare_dispatch_scenario(
    body: DispatchScenarioPayload,
    user: User = Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    common = {"hours": body.horizon_hours, "region": "bd", "current_user": user, "db": db,
              "record": False, "feeder_capacity_kw": body.feeder_capacity_kw,
              "base_load_kw": body.base_load_kw}
    reference = get_dispatch_plan(**common, pv_capacity_kw=0)
    scenario = get_dispatch_plan(**common, pv_capacity_kw=body.pv_capacity_kw)
    reference_kpis = reference["plan"]["kpis"]
    scenario_kpis = scenario["plan"]["kpis"]
    return {"status": "success", "inputs": body.model_dump(), "forecast_used": scenario["forecast_used"],
            "reference": reference["plan"], "scenario": scenario["plan"],
            "change": {"cost_usd": scenario_kpis["optimized_cost"] - reference_kpis["optimized_cost"],
                       "emissions_kg": (scenario_kpis["optimized_emissions_gco2"] -
                                        reference_kpis["optimized_emissions_gco2"]) / 1000,
                       "peak_kw": scenario_kpis["peak_optimized_kw"] - reference_kpis["peak_optimized_kw"]},
            "note": "Hypothetical capacity-scaled regional GHI forecast; no on-site PV measurement or equipment command."}


@router.post("/runs/{run_id}/decision", summary="Record approval or rejection of a saved demo plan")
def decide_dispatch_run(
    run_id: int,
    body: DispatchDecisionPayload,
    user: User = Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db),
):
    record = db.query(DispatchPlanRecord).filter(DispatchPlanRecord.id == run_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Run not found.")
    if user.role == UserRole.facility_manager and record.created_by != user.username:
        raise HTTPException(status_code=403, detail="Run is not available to this account.")
    if body.action == "reject" and not (body.reason or "").strip():
        raise HTTPException(status_code=422, detail="A rejection reason is required.")
    if db.query(DispatchPlanDecision).filter(DispatchPlanDecision.run_id == run_id).first():
        raise HTTPException(status_code=409, detail="This plan already has a decision.")
    decision = DispatchPlanDecision(
        run_id=run_id,
        action=body.action,
        reason=body.reason.strip() if body.reason else None,
        decided_by=user.username,
    )
    db.add(decision)
    db.commit()
    return {"run_id": run_id, "decision": decision.action, "reason": decision.reason,
            "decided_by": decision.decided_by, "decided_at": decision.decided_at.isoformat(),
            "equipment_command_sent": False}


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

# ---------------------------------------------------------------------------
# POST /dispatch/override  (On-Demand PuLP Re-solve)
# ---------------------------------------------------------------------------

class ManualOverridePayload(BaseModel):
    asset_id: str
    forced_start_hour: int = Field(ge=0, le=23)
    forced_duration: Optional[int] = Field(default=None, ge=1, le=24)
    horizon_hours: int = Field(default=24, ge=1, le=24)
    region: str = "bd"
    reason: Optional[str] = Field(default=None, max_length=500)
    feeder_capacity_kw: float | None = Field(default=None, gt=0)
    pv_capacity_kw: float = Field(default=0, ge=0)
    base_load_kw: float = Field(default=0, ge=0)

@router.post("/override", summary="Apply manual schedule override and re-solve with PuLP")
def submit_dispatch_override(
    body: ManualOverridePayload,
    current_user: User = Depends(
        require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)
    ),
    db: Session = Depends(get_db),
):
    """
    On-demand schedule override re-solver:
    Locks an asset to the operator's specified start hour and runs PuLP LP solver
    across all assets, immediately recomputing system KPIs and logging the run.
    """
    try:
        hours = body.horizon_hours
        region = body.region

        target = next((p for p in _ALL_PROCESSES if p.asset_id == body.asset_id), None)
        if target is None:
            raise HTTPException(status_code=404, detail="Asset not found.")
        if target.deadline > hours:
            raise HTTPException(status_code=422, detail="Asset does not fit this horizon.")
        duration = body.forced_duration if body.forced_duration is not None else target.duration
        if duration != target.duration:
            raise HTTPException(status_code=422, detail="Changing process duration is not supported.")
        if not target.earliest_start <= body.forced_start_hour <= target.deadline - duration:
            raise HTTPException(status_code=422, detail="Start hour is outside the asset operating window.")

        forecast_data = get_forecast(region=region, horizon_hours=hours)
        forecast = forecast_data["forecast"]
        timestamps = forecast["timestamps"]
        carbon_intensity = forecast["grid_stress_gco2_kwh"]

        prices = []
        for ts in timestamps:
            hour = pd.Timestamp(ts).tz_convert(ZoneInfo("Asia/Dhaka")).hour
            prices.append(_TARIFF.get(hour, 0.10))

        # Clone processes and apply override to the targeted asset
        overridden_processes = []
        for p in _ALL_PROCESSES:
            if p.asset_id == body.asset_id:
                forced_start = body.forced_start_hour
                overridden_p = IndustrialProcessAdapter(
                    asset_id=p.asset_id,
                    name=p.name,
                    power_kw=p.power_kw,
                    earliest_start=forced_start,
                    deadline=min(hours, forced_start + duration),
                    duration=duration,
                )
                overridden_processes.append(overridden_p)
            else:
                overridden_processes.append(p)

        processes = _filter_processes(overridden_processes, hours)
        batteries = _ALL_BATTERIES

        plan = dispatch_plan(
            industrial_assets=processes,
            battery_assets=batteries,
            prices=prices,
            carbon_intensity=carbon_intensity,
            pv_generation_kw=[min(max(float(ghi), 0) / 1000, 1) * body.pv_capacity_kw
                              for ghi in forecast["solar_ghi_w_m2"]],
            base_load_kw=[body.base_load_kw] * hours,
            feeder_capacity_kw=body.feeder_capacity_kw,
        )

        kpis = plan.get("kpis", {})
        run = DispatchRun(
            region=region,
            hours=hours,
            industrial_count=len(processes),
            battery_count=len(batteries),
            cost_saved_usd=kpis.get("cost_saved_usd"),
            co2_saved_kg=kpis.get("co2_saved_kg"),
            peak_shaved_kw=kpis.get("peak_shaved_kw"),
            model_used=forecast_data["accuracy"].get("model"),
            triggered_by=f"{current_user.username} [override: {body.asset_id}]",
        )
        db.add(run)

        result = {
            "status": "success",
            "region": region,
            "hours": hours,
            "assumptions": {"feeder_capacity_kw": body.feeder_capacity_kw,
                            "pv_capacity_kw": body.pv_capacity_kw, "base_load_kw": body.base_load_kw,
                            "pv_estimate_only": body.pv_capacity_kw > 0},
            "run_id": None,
            "override_applied": {
                "asset_id": body.asset_id,
                "forced_start_hour": body.forced_start_hour,
                "found": True,
                "duration": duration,
                "reason": body.reason,
            },
            "forecast_used": {
                "model": forecast_data["accuracy"]["model"],
                "accuracy": forecast_data["accuracy"],
                "sources": forecast_data.get("sources"),
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
        saved = DispatchPlanRecord(created_by=current_user.username, payload_json="")
        db.add(saved)
        db.flush()
        result["run_id"] = saved.id
        result["decision"] = "pending"
        saved.payload_json = json.dumps(result)
        db.commit()
        return result
    except HTTPException:
        raise
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Override could not be applied.")
