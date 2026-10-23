"""One mixed-integer program for the demo portfolio's shared grid import."""

import pulp

from dispatch.adapters import BatteryAdapter, IndustrialProcessAdapter
from dispatch.solver import _get_solver


def solve_joint_schedule(
    processes: list[IndustrialProcessAdapter],
    batteries: list[BatteryAdapter],
    prices: list[float],
    carbon_intensity: list[float],
    *,
    pv_generation_kw: list[float] | None = None,
    base_load_kw: list[float] | None = None,
    feeder_capacity_kw: float | None = None,
) -> dict:
    """Schedule all assets against one import balance; PV surplus is curtailed."""
    horizon = len(prices)
    if not horizon or len(carbon_intensity) != horizon:
        raise ValueError("Prices and carbon intensity must have a matching non-empty horizon.")
    pv = pv_generation_kw if pv_generation_kw is not None else [0.0] * horizon
    base = base_load_kw if base_load_kw is not None else [0.0] * horizon
    if len(pv) != horizon or len(base) != horizon or min(pv + base) < 0:
        raise ValueError("PV generation and base load must be non-negative and match the horizon.")
    if feeder_capacity_kw is not None and feeder_capacity_kw <= 0:
        raise ValueError("Feeder capacity must be positive.")

    problem = pulp.LpProblem("Portfolio_Dispatch", pulp.LpMinimize)
    starts = {}
    for p_index, process in enumerate(processes):
        if not (0 <= process.earliest_start <= process.deadline <= horizon) or process.duration <= 0:
            raise ValueError("A process has an invalid operating window.")
        candidates = range(process.earliest_start, process.deadline - process.duration + 1)
        if not candidates:
            raise ValueError("A process cannot fit inside its operating window.")
        starts[p_index] = {
            start: pulp.LpVariable(f"process_{p_index}_start_{start}", lowBound=0, upBound=1, cat=pulp.LpBinary)
            for start in candidates
        }
        problem += pulp.lpSum(starts[p_index].values()) == 1

    charge, discharge, energy, mode = {}, {}, {}, {}
    for b_index, battery in enumerate(batteries):
        if battery.capacity_kwh <= 0 or not 0.1 <= battery.current_soc <= 1:
            raise ValueError("A battery has invalid capacity or starting SOC.")
        for hour in range(horizon):
            key = (b_index, hour)
            charge[key] = pulp.LpVariable(f"charge_{b_index}_{hour}", lowBound=0, upBound=battery.charge_rate_kw)
            discharge[key] = pulp.LpVariable(f"discharge_{b_index}_{hour}", lowBound=0, upBound=battery.discharge_rate_kw)
            energy[key] = pulp.LpVariable(f"energy_{b_index}_{hour}", lowBound=0.1 * battery.capacity_kwh,
                                          upBound=battery.capacity_kwh)
            mode[key] = pulp.LpVariable(f"mode_{b_index}_{hour}", lowBound=0, upBound=1, cat=pulp.LpBinary)
            previous = battery.capacity_kwh * battery.current_soc if hour == 0 else energy[(b_index, hour - 1)]
            problem += energy[key] == previous + 0.95 * charge[key] - discharge[key] / 0.95
            problem += charge[key] <= battery.charge_rate_kw * mode[key]
            problem += discharge[key] <= battery.discharge_rate_kw * (1 - mode[key])
        problem += energy[(b_index, horizon - 1)] == battery.capacity_kwh * battery.current_soc

    grid = {}
    peak = pulp.LpVariable("peak_grid_import", lowBound=0)
    for hour in range(horizon):
        grid[hour] = pulp.LpVariable(f"grid_import_{hour}", lowBound=0, upBound=feeder_capacity_kw)
        process_load = pulp.lpSum(
            process.power_kw * variable
            for p_index, process in enumerate(processes)
            for start, variable in starts[p_index].items()
            if start <= hour < start + process.duration
        )
        battery_load = pulp.lpSum(charge[(b_index, hour)] - discharge[(b_index, hour)]
                                  for b_index in range(len(batteries)))
        problem += grid[hour] >= base[hour] + process_load + battery_load - pv[hour]
        problem += peak >= grid[hour]

    # Price and carbon minimize import; a small peak term breaks near ties.
    problem += pulp.lpSum((prices[hour] + 0.001 * carbon_intensity[hour]) * grid[hour]
                          for hour in range(horizon)) + 0.01 * peak
    problem.solve(_get_solver())
    if pulp.LpStatus[problem.status] != "Optimal":
        raise ValueError("No feasible plan satisfies the shared grid constraints.")

    process_hours = {}
    for p_index, process in enumerate(processes):
        selected = next(start for start, variable in starts[p_index].items() if pulp.value(variable) > 0.5)
        process_hours[process.asset_id] = list(range(selected, selected + process.duration))
    battery_schedules = {}
    for b_index, battery in enumerate(batteries):
        battery_schedules[battery.asset_id] = [
            {"hour": hour, "charge_kw": round(pulp.value(charge[(b_index, hour)]), 6),
             "discharge_kw": round(pulp.value(discharge[(b_index, hour)]), 6),
             "energy_kwh": round(pulp.value(energy[(b_index, hour)]), 6)}
            for hour in range(horizon)
        ]
    return {"process_hours": process_hours, "battery_schedules": battery_schedules,
            "grid_import_kw": [round(pulp.value(grid[hour]), 6) for hour in range(horizon)],
            "peak_grid_import_kw": round(pulp.value(peak), 6)}
