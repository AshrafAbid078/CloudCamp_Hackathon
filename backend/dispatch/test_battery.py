from dispatch.solver import solve_battery_schedule


def test_battery_schedule():
    # prices:           high=10, low=2, low=2, high=10
    # carbon_intensity: high at peak hours, low at off-peak
    # Expected optimal: charge at hours 1&2 (cheap+clean),
    #                   discharge at hours 0&3 (expensive+dirty)
    result = solve_battery_schedule(
        capacity_kwh=100,
        current_soc=0.5,
        charge_rate_kw=20,
        discharge_rate_kw=20,
        prices=[10, 2, 2, 10],
        carbon_intensity=[500, 200, 200, 500],
    )

    print("Battery solver result:")
    print(result)

    assert result["status"] == "Optimal"

    for item in result["schedule"]:
        assert 0 <= item["energy_kwh"] <= 100

    print("Battery scheduling test passed")


if __name__ == "__main__":
    test_battery_schedule()