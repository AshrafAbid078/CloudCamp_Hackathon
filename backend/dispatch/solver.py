import pulp
from pulp import HiGHS
import math
from numbers import Real, Integral


def _finite(value, name, minimum=None):
    if isinstance(value, bool) or not isinstance(value, Real) or not math.isfinite(value):
        raise ValueError(f"{name} must be finite and numeric")
    if minimum is not None and value < minimum:
        raise ValueError(f"{name} must be at least {minimum}")


def validate_signals(prices, carbon_intensity, carbon_price_per_gco2=0.001):
    if not prices or len(prices) != len(carbon_intensity):
        raise ValueError("Prices and carbon_intensity must have the same nonzero length")
    for value in prices:
        _finite(value, "price")
    for value in carbon_intensity:
        _finite(value, "carbon intensity", 0)
    _finite(carbon_price_per_gco2, "carbon price", 0)


def solve_process_schedule(
    power_kw: float,
    earliest_start: int,
    deadline: int,
    duration: int,
    prices: list[float],
    carbon_intensity: list[float],
    carbon_price_per_gco2: float = 0.001,
    interruptible: bool = True,
):
    """
    Optimize an industrial process using both
    electricity cost and carbon emissions.

    Objective:
        cost + carbon_price × emissions
    """

    validate_signals(prices, carbon_intensity, carbon_price_per_gco2)
    _finite(power_kw, "power_kw", 0)
    if power_kw == 0:
        raise ValueError("power_kw must be positive")
    if any(isinstance(v, bool) or not isinstance(v, Integral) for v in (earliest_start, deadline, duration)):
        raise ValueError("Start, deadline and duration must be integers")
    if not 0 <= earliest_start < deadline <= len(prices) or duration <= 0:
        raise ValueError("Require 0 <= start < deadline <= horizon and positive duration")
    if type(interruptible) is not bool:
        raise ValueError("interruptible must be boolean")
    available_slots = range(earliest_start, deadline)

    if duration > len(list(available_slots)):
        raise ValueError(
            "The process duration is longer than the available time window."
        )

    if len(prices) != len(carbon_intensity):
        raise ValueError(
            "Prices and carbon_intensity must have the same length."
        )

    problem = pulp.LpProblem(
        "Industrial_Process_Scheduling",
        pulp.LpMinimize,
    )

    # PuLP 4.x: variables must be created via problem.add_variable()
    x = {
        t: problem.add_variable(
            f"run_{t}",
            cat="Binary",
        )
        for t in available_slots
    }

    # Combined cost + emissions objective
    problem += pulp.lpSum(
        (
            prices[t] * power_kw
            +
            carbon_price_per_gco2
            * power_kw
            * carbon_intensity[t]
        )
        * x[t]
        for t in available_slots
    )

    # Process must run exactly duration hours
    problem += (
        pulp.lpSum(x[t] for t in available_slots)
        == duration
    )
    if not interruptible:
        starts = {t: problem.add_variable(f"start_{t}", cat="Binary")
                  for t in range(earliest_start, deadline-duration+1)}
        problem += pulp.lpSum(starts.values()) == 1
        for t in available_slots:
            problem += x[t] == pulp.lpSum(starts[s] for s in starts if s <= t < s+duration)

    # PuLP 4.x: solve() returns a result object; PULP_CBC_CMD is removed — use HiGHS
    result = problem.solve(HiGHS(msg=False))

    if result.status_str != "Optimal":
        raise RuntimeError(
            "No optimal schedule was found."
        )

    selected_hours = [
        t
        for t in available_slots
        if round(pulp.value(x[t])) == 1
    ]

    total_cost = sum(
        prices[t] * power_kw
        for t in selected_hours
    )

    total_emissions = sum(
        power_kw * carbon_intensity[t]
        for t in selected_hours
    )

    objective_value = (
        total_cost
        +
        carbon_price_per_gco2 * total_emissions
    )

    return {
        "status": result.status_str,
        "scheduled_hours": selected_hours,
        "total_cost": total_cost,
        "total_emissions_gco2": total_emissions,
        "objective_value": objective_value,
    }


def solve_battery_schedule(
    capacity_kwh: float,
    current_soc: float,
    charge_rate_kw: float,
    discharge_rate_kw: float,
    prices: list[float],
    carbon_intensity: list[float],
    charge_efficiency: float = 0.95,
    discharge_efficiency: float = 0.95,
    carbon_price_per_gco2: float = 0.001,
    min_soc: float = 0.10,
    site_load_kw: list[float] | None = None,
):
    """
    Optimize battery charging/discharging using
    electricity cost + carbon emissions.

    The battery finishes at its initial SOC so that
    optimization cannot create artificial savings by
    simply consuming the initial stored energy.

    Args:
        capacity_kwh:        Total usable battery capacity in kWh.
        current_soc:         State of charge at start (0–1).
        charge_rate_kw:      Maximum charge power in kW.
        discharge_rate_kw:   Maximum discharge power in kW.
        prices:              Electricity price per kWh for each time slot.
        carbon_intensity:    Grid carbon intensity (gCO2/kWh) per time slot.
        charge_efficiency:   Round-trip charge efficiency (0–1, default 0.95).
        discharge_efficiency:Round-trip discharge efficiency (0–1, default 0.95).
        carbon_price_per_gco2: Converts gCO2 to cost-equivalent for the objective.
        min_soc:             Minimum state of charge floor (0–1, default 0.10).
                             Prevents full depletion to protect battery longevity.
    """

    validate_signals(prices, carbon_intensity, carbon_price_per_gco2)
    for name, value in {"capacity_kwh": capacity_kwh, "current_soc": current_soc,
                        "charge_rate_kw": charge_rate_kw, "discharge_rate_kw": discharge_rate_kw,
                        "charge_efficiency": charge_efficiency, "discharge_efficiency": discharge_efficiency,
                        "min_soc": min_soc}.items():
        _finite(value, name)
    # Behind-the-meter storage cannot sell energy at the retail import tariff.
    site_load_kw = [0.0] * len(prices) if site_load_kw is None else site_load_kw
    if len(site_load_kw) != len(prices):
        raise ValueError("site_load_kw must match the horizon")
    for value in site_load_kw:
        _finite(value, "site_load_kw", 0)
    if not 0 <= current_soc <= 1:
        raise ValueError(
            "current_soc must be between 0 and 1."
        )

    if not 0 <= min_soc < 1:
        raise ValueError(
            "min_soc must be between 0 (inclusive) and 1 (exclusive)."
        )

    if current_soc < min_soc:
        raise ValueError(
            f"current_soc ({current_soc}) is below min_soc ({min_soc})."
        )

    if not 0 < charge_efficiency <= 1:
        raise ValueError(
            "charge_efficiency must be between 0 and 1."
        )

    if not 0 < discharge_efficiency <= 1:
        raise ValueError(
            "discharge_efficiency must be between 0 and 1."
        )

    if capacity_kwh <= 0:
        raise ValueError(
            "capacity_kwh must be greater than zero."
        )

    if charge_rate_kw < 0 or discharge_rate_kw < 0:
        raise ValueError(
            "Charge and discharge rates cannot be negative."
        )

    if len(prices) != len(carbon_intensity):
        raise ValueError(
            "Prices and carbon_intensity must have the same length."
        )

    hours = range(len(prices))

    initial_energy = capacity_kwh * current_soc

    problem = pulp.LpProblem(
        "Battery_Scheduling",
        pulp.LpMinimize,
    )

    # PuLP 4.x: variables must be created via problem.add_variable()
    charge = {
        t: problem.add_variable(
            f"charge_{t}",
            lowBound=0,
            upBound=charge_rate_kw,
        )
        for t in hours
    }

    discharge = {
        t: problem.add_variable(
            f"discharge_{t}",
            lowBound=0,
            upBound=discharge_rate_kw,
        )
        for t in hours
    }

    # Minimum energy level = min_soc × capacity (protects battery longevity).
    min_energy = capacity_kwh * min_soc

    energy = {
        t: problem.add_variable(
            f"energy_{t}",
            lowBound=min_energy,
            upBound=capacity_kwh,
        )
        for t in hours
    }

    mode = {
        t: problem.add_variable(
            f"mode_{t}",
            cat="Binary",
        )
        for t in hours
    }

    # -------------------------------------------------
    # COMBINED COST + EMISSIONS OBJECTIVE
    # -------------------------------------------------

    problem += pulp.lpSum(
        (
            prices[t]
            * (charge[t] - discharge[t])
            +
            carbon_price_per_gco2
            * carbon_intensity[t]
            * (charge[t] - discharge[t])
        )
        for t in hours
    )

    # -------------------------------------------------
    # ENERGY BALANCE
    # -------------------------------------------------

    for t in hours:

        if t == 0:
            previous_energy = initial_energy
        else:
            previous_energy = energy[t - 1]

        problem += (
            energy[t]
            ==
            previous_energy
            + charge_efficiency * charge[t]
            - discharge[t] / discharge_efficiency
        )

    # -------------------------------------------------
    # NO SIMULTANEOUS CHARGE/DISCHARGE
    # -------------------------------------------------

    for t in hours:

        problem += (
            charge[t]
            <= charge_rate_kw * mode[t]
        )

        problem += (
            discharge[t]
            <= discharge_rate_kw * (1 - mode[t])
        )
        problem += discharge[t] <= site_load_kw[t]

    # -------------------------------------------------
    # END AT INITIAL SOC
    # -------------------------------------------------

    if len(prices) > 0:

        final_hour = len(prices) - 1

        problem += (
            energy[final_hour]
            == initial_energy
        )

    # -------------------------------------------------
    # SOLVE
    # -------------------------------------------------

    # PuLP 4.x: solve() returns a result object; PULP_CBC_CMD is removed — use HiGHS
    result = problem.solve(HiGHS(msg=False))

    if result.status_str != "Optimal":
        raise RuntimeError(
            "No optimal battery schedule was found."
        )

    schedule = []

    total_cost = 0.0
    total_emissions = 0.0

    for t in hours:

        charge_value = pulp.value(charge[t])
        discharge_value = pulp.value(discharge[t])

        schedule.append(
            {
                "hour": t,
                "charge_kw": round(
                    charge_value,
                    6,
                ),
                "discharge_kw": round(
                    discharge_value,
                    6,
                ),
                "energy_kwh": round(
                    pulp.value(energy[t]),
                    6,
                ),
            }
        )

        net_grid_energy = (
            charge_value - discharge_value
        )

        total_cost += (
            prices[t] * net_grid_energy
        )

        total_emissions += (
            carbon_intensity[t]
            * net_grid_energy
        )

    objective_value = (
        total_cost
        +
        carbon_price_per_gco2
        * total_emissions
    )

    return {
        "status": result.status_str,
        "schedule": schedule,
        "total_cost": round(total_cost, 6),
        "total_emissions_gco2": round(
            total_emissions,
            6,
        ),
        "objective_value": round(
            objective_value,
            6,
        ),
    }
