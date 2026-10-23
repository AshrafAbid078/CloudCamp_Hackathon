from __future__ import annotations
from dispatch.adapters import (
    IndustrialProcessAdapter,
    BatteryAdapter,
)

from dispatch.solver import (
    solve_process_schedule,
    solve_battery_schedule,
)

from dispatch.objective import calculate_objective
from dispatch.joint import solve_joint_schedule


# Weights for the combined objective: minimize w1*cost + w2*emissions.
# Kept here as the single source of truth for the planner layer.
W1_COST = 1.0
W2_EMISSIONS = 1.0

# Carbon price converts gCO2 emissions into a cost-equivalent term
# so both cost and emissions can be summed in the same objective.
CARBON_PRICE_PER_GCO2 = 0.001


def calculate_emissions(
    power_kw: float,
    hours: list[int],
    carbon_intensity: list[float],
) -> float:

    return sum(
        power_kw * carbon_intensity[h]
        for h in hours
    )


def calculate_process_baseline(
    process: IndustrialProcessAdapter,
    prices: list[float],
    carbon_intensity: list[float],
):

    baseline_hours = list(
        range(
            process.earliest_start,
            process.earliest_start + process.duration,
        )
    )

    baseline_cost = sum(
        process.power_kw * prices[h]
        for h in baseline_hours
    )

    baseline_emissions = calculate_emissions(
        process.power_kw,
        baseline_hours,
        carbon_intensity,
    )

    baseline_objective = calculate_objective(
        cost=baseline_cost,
        emissions=CARBON_PRICE_PER_GCO2 * baseline_emissions,
        w1=W1_COST,
        w2=W2_EMISSIONS,
    )

    return {
        "hours": baseline_hours,
        "cost": baseline_cost,
        "emissions_gco2": baseline_emissions,
        "objective": baseline_objective,
    }


def calculate_process_optimized(
    process: IndustrialProcessAdapter,
    prices: list[float],
    carbon_intensity: list[float],
):

    result = solve_process_schedule(
        power_kw=process.power_kw,
        earliest_start=process.earliest_start,
        deadline=process.deadline,
        duration=process.duration,
        prices=prices,
        carbon_intensity=carbon_intensity,
        carbon_price_per_gco2=CARBON_PRICE_PER_GCO2,
    )

    return {
        "hours": result["scheduled_hours"],
        "cost": result["total_cost"],
        "emissions_gco2": result["total_emissions_gco2"],
        "objective": result["objective_value"],
    }


def calculate_battery_energy(
    schedule: list[dict],
) -> float:

    if not schedule:
        return 0.0

    return schedule[-1]["energy_kwh"]


def calculate_battery_peak(
    schedule: list[dict],
) -> float:

    if not schedule:
        return 0.0

    return max(
        item["discharge_kw"]
        for item in schedule
    )


def dispatch_plan(
    industrial_assets: list[IndustrialProcessAdapter],
    battery_assets: list[BatteryAdapter],
    prices: list[float],
    carbon_intensity: list[float],
    pv_generation_kw: list[float] | None = None,
    base_load_kw: list[float] | None = None,
    feeder_capacity_kw: float | None = None,
):

    industrial_results = []
    battery_results = []

    total_baseline_cost = 0.0
    total_optimized_cost = 0.0

    total_baseline_emissions = 0.0
    total_optimized_emissions = 0.0

    total_baseline_objective = 0.0
    total_optimized_objective = 0.0

    # Hourly grid-import profiles (kW) used for the system-level peak KPI.
    horizon = len(prices)
    pv = pv_generation_kw if pv_generation_kw is not None else [0.0] * horizon
    base = base_load_kw if base_load_kw is not None else [0.0] * horizon
    joint = solve_joint_schedule(
        industrial_assets, battery_assets, prices, carbon_intensity,
        pv_generation_kw=pv, base_load_kw=base, feeder_capacity_kw=feeder_capacity_kw,
    )
    baseline_load_kw = [0.0] * horizon
    optimized_load_kw = [0.0] * horizon

    # =================================================
    # INDUSTRIAL PROCESSES
    # =================================================

    for process in industrial_assets:

        baseline = calculate_process_baseline(
            process,
            prices,
            carbon_intensity,
        )

        optimized_hours = joint["process_hours"][process.asset_id]
        optimized_cost = sum(process.power_kw * prices[h] for h in optimized_hours)
        optimized_emissions = calculate_emissions(process.power_kw, optimized_hours, carbon_intensity)
        optimized = {
            "hours": optimized_hours,
            "cost": optimized_cost,
            "emissions_gco2": optimized_emissions,
            "objective": optimized_cost + CARBON_PRICE_PER_GCO2 * optimized_emissions,
        }

        cost_saved = (
            baseline["cost"]
            - optimized["cost"]
        )

        emissions_saved = (
            baseline["emissions_gco2"]
            - optimized["emissions_gco2"]
        )

        objective_improvement = (
            baseline["objective"]
            - optimized["objective"]
        )

        for h in baseline["hours"]:
            if 0 <= h < horizon:
                baseline_load_kw[h] += process.power_kw

        for h in optimized["hours"]:
            if 0 <= h < horizon:
                optimized_load_kw[h] += process.power_kw

        total_baseline_cost += baseline["cost"]
        total_optimized_cost += optimized["cost"]

        total_baseline_emissions += (
            baseline["emissions_gco2"]
        )

        total_optimized_emissions += (
            optimized["emissions_gco2"]
        )

        total_baseline_objective += (
            baseline["objective"]
        )

        total_optimized_objective += (
            optimized["objective"]
        )

        industrial_results.append(
            {
                "asset_id": process.asset_id,
                "asset_type": "industrial",
                "name": process.name,
                "power_kw": process.power_kw,
                "duration": process.duration,
                "earliest_start": process.earliest_start,
                "deadline": process.deadline,

                "baseline_hours": baseline["hours"],
                "optimized_hours": optimized["hours"],

                "baseline_cost": baseline["cost"],
                "optimized_cost": optimized["cost"],
                "cost_saved": cost_saved,

                "baseline_emissions_gco2": (
                    baseline["emissions_gco2"]
                ),
                "optimized_emissions_gco2": (
                    optimized["emissions_gco2"]
                ),
                "emissions_saved_gco2": (
                    emissions_saved
                ),

                "baseline_objective": baseline["objective"],
                "optimized_objective": optimized["objective"],
                "objective_improvement": (
                    objective_improvement
                ),
            }
        )

    # =================================================
    # BATTERIES
    # =================================================

    for battery in battery_assets:

        schedule = joint["battery_schedules"][battery.asset_id]
        optimized_cost = sum(prices[item["hour"]] * (item["charge_kw"] - item["discharge_kw"])
                             for item in schedule)
        optimized_emissions = sum(carbon_intensity[item["hour"]] * (item["charge_kw"] - item["discharge_kw"])
                                  for item in schedule)
        optimized = {"total_cost": optimized_cost, "total_emissions_gco2": optimized_emissions,
                     "objective_value": optimized_cost + CARBON_PRICE_PER_GCO2 * optimized_emissions}

        # Baseline battery:
        # do nothing, preserve initial SOC.
        baseline_cost = 0.0
        baseline_emissions = 0.0
        baseline_objective = 0.0

        optimized_cost = optimized["total_cost"]
        optimized_emissions = (
            optimized["total_emissions_gco2"]
        )
        optimized_objective = (
            optimized["objective_value"]
        )

        cost_saved = (
            baseline_cost
            - optimized_cost
        )

        emissions_saved = (
            baseline_emissions
            - optimized_emissions
        )

        objective_improvement = (
            baseline_objective
            - optimized_objective
        )

        # Battery grid import = charge - discharge (baseline battery is idle).
        for item in schedule:
            h = item["hour"]
            if 0 <= h < horizon:
                optimized_load_kw[h] += item["charge_kw"] - item["discharge_kw"]

        total_baseline_cost += baseline_cost
        total_optimized_cost += optimized_cost

        total_baseline_emissions += (
            baseline_emissions
        )

        total_optimized_emissions += (
            optimized_emissions
        )

        total_baseline_objective += (
            baseline_objective
        )

        total_optimized_objective += (
            optimized_objective
        )

        battery_results.append(
            {
                "asset_id": battery.asset_id,
                "asset_type": "battery",
                "capacity_kwh": battery.capacity_kwh,
                "initial_soc": battery.current_soc,
                "charge_rate_kw": battery.charge_rate_kw,
                "discharge_rate_kw": battery.discharge_rate_kw,

                "schedule": schedule,

                "baseline_cost": baseline_cost,
                "optimized_cost": optimized_cost,
                "cost_saved": cost_saved,

                "baseline_emissions_gco2": (
                    baseline_emissions
                ),
                "optimized_emissions_gco2": (
                    optimized_emissions
                ),
                "emissions_saved_gco2": (
                    emissions_saved
                ),

                "baseline_objective": baseline_objective,
                "optimized_objective": optimized_objective,
                "objective_improvement": (
                    objective_improvement
                ),

                "final_energy_kwh": (
                    calculate_battery_energy(schedule)
                ),

                "peak_discharge_kw": (
                    calculate_battery_peak(schedule)
                ),
            }
        )

    # =================================================
    # FINAL SYSTEM KPIs
    # =================================================

    baseline_grid_kw = [max(0.0, base[h] + baseline_load_kw[h] - pv[h]) for h in range(horizon)]
    optimized_grid_kw = joint["grid_import_kw"]
    total_baseline_cost = sum(prices[h] * baseline_grid_kw[h] for h in range(horizon))
    total_optimized_cost = sum(prices[h] * optimized_grid_kw[h] for h in range(horizon))
    total_baseline_emissions = sum(carbon_intensity[h] * baseline_grid_kw[h] for h in range(horizon))
    total_optimized_emissions = sum(carbon_intensity[h] * optimized_grid_kw[h] for h in range(horizon))
    total_baseline_objective = total_baseline_cost + CARBON_PRICE_PER_GCO2 * total_baseline_emissions
    total_optimized_objective = total_optimized_cost + CARBON_PRICE_PER_GCO2 * total_optimized_emissions

    total_cost_saved = (
        total_baseline_cost
        - total_optimized_cost
    )

    total_emissions_saved = (
        total_baseline_emissions
        - total_optimized_emissions
    )

    total_objective_improvement = (
        total_baseline_objective
        - total_optimized_objective
    )

    peak_baseline_kw = max(baseline_grid_kw, default=0.0)
    peak_optimized_kw = max(optimized_grid_kw, default=0.0)
    peak_shaved_kw = peak_baseline_kw - peak_optimized_kw

    return {
        "industrial": industrial_results,

        "batteries": battery_results,

        "grid_balance": {
            "baseline_import_kw": baseline_grid_kw,
            "optimized_import_kw": optimized_grid_kw,
            "pv_generation_kw": pv,
            "base_load_kw": base,
            "feeder_capacity_kw": feeder_capacity_kw,
            "pv_model": "capacity-scaled GHI estimate" if any(pv) else "not configured",
        },

        "kpis": {
            "baseline_cost": total_baseline_cost,
            "optimized_cost": total_optimized_cost,
            "cost_saved": total_cost_saved,

            # Dashboard-ready aliases (cost in USD, emissions in kg).
            "cost_saved_usd": total_cost_saved,
            "co2_saved_kg": total_emissions_saved / 1000.0,

            # System-level peak grid import (kW) across all assets.
            # Negative peak_shaved_kw means the optimized plan raised the peak.
            "peak_baseline_kw": peak_baseline_kw,
            "peak_optimized_kw": peak_optimized_kw,
            "peak_shaved_kw": peak_shaved_kw,

            "baseline_emissions_gco2": (
                total_baseline_emissions
            ),

            "optimized_emissions_gco2": (
                total_optimized_emissions
            ),

            "emissions_saved_gco2": (
                total_emissions_saved
            ),

            "carbon_price_per_gco2": (
                CARBON_PRICE_PER_GCO2
            ),

            "baseline_objective": (
                total_baseline_objective
            ),

            "optimized_objective": (
                total_optimized_objective
            ),

            "objective_improvement": (
                total_objective_improvement
            ),
        },
    }
