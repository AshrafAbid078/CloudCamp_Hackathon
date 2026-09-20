from dispatch.solver import solve_process_schedule


def test_process_schedule():
    # prices:           [5, 10, 3, 2, 8, 7]
    # hours available:  slots 1..5 (earliest_start=1, deadline=6)
    # duration:         2 hours
    # Expected optimal: run at hours 2 & 3 (prices 3 and 2 — cheapest slots)
    # Expected cost:    (3 + 2) * 100 kW = 500
    result = solve_process_schedule(
        power_kw=100,
        earliest_start=1,
        deadline=6,
        duration=2,
        prices=[5, 10, 3, 2, 8, 7],
        carbon_intensity=[400, 450, 200, 150, 350, 500],
    )

    print("Solver result:")
    print(result)

    assert result["status"] == "Optimal"
    assert result["scheduled_hours"] == [2, 3]
    assert result["total_cost"] == 500

    print("Process scheduling test passed")


if __name__ == "__main__":
    test_process_schedule()