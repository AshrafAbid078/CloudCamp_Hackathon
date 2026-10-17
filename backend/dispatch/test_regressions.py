import math

import pandas as pd
import pytest

from backend.dispatch.adapters import BatteryAdapter, IndustrialProcessAdapter
from backend.dispatch.api import _filter_processes, _TARIFF
from backend.dispatch.planner import dispatch_plan
from backend.dispatch.solver import solve_process_schedule, solve_battery_schedule
from backend.dispatch.test_api import client


@pytest.mark.parametrize("changes", [
    {"earliest_start": -1}, {"deadline": 5}, {"duration": 0}, {"duration": -1},
    {"power_kw": -10}, {"power_kw": float("inf")}, {"earliest_start": 1.5},
    {"prices": [1, float("nan"), 1, 1]}, {"carbon_intensity": [-1]*4},
    {"prices": [], "carbon_intensity": []}, {"duration": 5},
])
def test_process_rejects_invalid_constraints(changes):
    args = dict(power_kw=100, earliest_start=0, deadline=4, duration=2,
                prices=[1, 2, 3, 4], carbon_intensity=[100]*4)
    args.update(changes)
    with pytest.raises(ValueError):
        solve_process_schedule(**args)


@pytest.mark.parametrize("changes", [
    {"capacity_kwh": float("nan")}, {"current_soc": 2}, {"charge_rate_kw": float("inf")},
    {"carbon_price_per_gco2": -1}, {"prices": [], "carbon_intensity": []},
    {"site_load_kw": [1]}, {"site_load_kw": [-1]*4},
])
def test_battery_rejects_invalid_constraints(changes):
    args = dict(capacity_kwh=100, current_soc=.5, charge_rate_kw=20, discharge_rate_kw=20,
                prices=[1, 2, 3, 4], carbon_intensity=[100]*4)
    args.update(changes)
    with pytest.raises(ValueError):
        solve_battery_schedule(**args)


def test_process_can_fit_before_deadline_beyond_short_horizon():
    process = IndustrialProcessAdapter("P", "pump", 10, 0, 24, 2)
    selected = _filter_processes([process], 6)
    assert len(selected) == 1 and selected[0].deadline == 6
    assert process.deadline == 24
    timestamps = pd.date_range("2026-01-01T00:00Z", periods=6, freq="h").astype(str).tolist()
    local_process = IndustrialProcessAdapter("P", "pump", 10, 7, 23, 2)
    selected = _filter_processes([local_process], 6, timestamps)
    assert (selected[0].earliest_start, selected[0].deadline) == (1, 6)


def test_noninterruptible_process_runs_contiguously():
    common = dict(power_kw=10, earliest_start=0, deadline=4, duration=2,
                  prices=[1, 10, 10, 1], carbon_intensity=[100]*4)
    assert solve_process_schedule(**common)["scheduled_hours"] == [0, 3]
    hours = solve_process_schedule(**common, interruptible=False)["scheduled_hours"]
    assert len(hours) == 2 and hours[1] == hours[0]+1


def test_battery_savings_only_offset_real_site_demand():
    batteries = [BatteryAdapter(f"B{i}", 100, .5, 20, 20) for i in range(2)]
    args = dict(prices=[.05, .05, .2, .2], carbon_intensity=[600]*4, battery_assets=batteries)
    empty = dispatch_plan(industrial_assets=[], **args)
    assert abs(empty["kpis"]["cost_saved"]) < 1e-6
    process = IndustrialProcessAdapter("P", "pump", 30, 2, 4, 2)
    plan = dispatch_plan(industrial_assets=[process], **args)
    assert min(plan["grid_import_kw"]["optimized"]) >= -1e-5
    assert plan["kpis"]["cost_saved"] > 0
    for battery in plan["batteries"]:
        assert battery["final_energy_kwh"] == pytest.approx(50)
        for slot in battery["schedule"]:
            assert slot["charge_kw"] * slot["discharge_kw"] == pytest.approx(0)


@pytest.mark.parametrize("hours", [1, 6, 12, 24])
def test_dispatch_horizons_use_local_tariff_and_relative_asset_windows(hours):
    response = client.get(f"/dispatch/plan?hours={hours}")
    assert response.status_code == 200, response.text
    body = response.json()
    forecast = body["forecast_used"]
    assert len(forecast["timestamps"]) == hours
    local = pd.to_datetime(forecast["timestamps"], utc=True).tz_convert("Asia/Dhaka")
    assert forecast["prices_usd_kwh"] == [_TARIFF[t.hour] for t in local]
    assert forecast["data_quality"]["solar_mode"] == "historical_demo"
    for process in body["plan"]["industrial"]:
        constraints = process["constraints"]
        slots = process["optimized_hours"]
        assert len(slots) == constraints["duration"]
        assert all(0 <= slot < hours for slot in slots)
    assert min(body["plan"]["grid_import_kw"]["optimized"]) >= -1e-4
