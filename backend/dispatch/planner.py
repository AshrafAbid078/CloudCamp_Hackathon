from dispatch.adapters import (
    IndustrialProcessAdapter,
    BatteryAdapter,
)

from dispatch.solver import (
    solve_process_schedule,
    solve_battery_schedule,
)

from dispatch.objective import calculate_objective


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

        optimized = calculate_process_optimized(
            process,
            prices,
            carbon_intensity,
        )

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

        optimized = solve_battery_schedule(
            capacity_kwh=battery.capacity_kwh,
            current_soc=battery.current_soc,
            charge_rate_kw=battery.charge_rate_kw,
            discharge_rate_kw=battery.discharge_rate_kw,
            prices=prices,
            carbon_intensity=carbon_intensity,
            carbon_price_per_gco2=CARBON_PRICE_PER_GCO2,
        )

        schedule = optimized["schedule"]

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

    peak_baseline_kw = max(baseline_load_kw, default=0.0)
    peak_optimized_kw = max(optimized_load_kw, default=0.0)
    peak_shaved_kw = peak_baseline_kw - peak_optimized_kw

    return {
        "industrial": industrial_results,

        "batteries": battery_results,

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