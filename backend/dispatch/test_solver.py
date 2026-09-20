from dispatch.adapters import (
    IndustrialProcessAdapter,
    BatteryAdapter,
    EVFleetAdapter,
    EUAdapter,
    USAdapter,
)


def test_industrial_process_adapter():
    process = IndustrialProcessAdapter(
        asset_id="F001",
        name="Water Pump",
        power_kw=500,
        earliest_start=2,
        deadline=8,
        duration=3,
    )

    constraints = process.get_constraints()

    assert process.asset_type == "industrial"
    assert constraints["power_kw"] == 500
    assert constraints["earliest_start"] == 2
    assert constraints["deadline"] == 8
    assert constraints["duration"] == 3

    print("IndustrialProcessAdapter test passed")


def test_battery_adapter():
    battery = BatteryAdapter(
        asset_id="B001",
        capacity_kwh=5000,
        current_soc=0.5,
        charge_rate_kw=1000,
        discharge_rate_kw=1000,
    )

    constraints = battery.get_constraints()

    assert battery.asset_type == "battery"
    assert constraints["capacity_kwh"] == 5000
    assert constraints["current_soc"] == 0.5
    assert constraints["charge_rate_kw"] == 1000
    assert constraints["discharge_rate_kw"] == 1000

    print("BatteryAdapter test passed")


def test_ev_fleet_stub():
    try:
        EVFleetAdapter()
    except NotImplementedError:
        print("EVFleetAdapter stub test passed")
    else:
        raise AssertionError(
            "EVFleetAdapter should raise NotImplementedError"
        )


def test_eu_adapter_stub():
    try:
        EUAdapter()
    except NotImplementedError:
        print("EUAdapter stub test passed")
    else:
        raise AssertionError(
            "EUAdapter should raise NotImplementedError"
        )


def test_us_adapter_stub():
    try:
        USAdapter()
    except NotImplementedError:
        print("USAdapter stub test passed")
    else:
        raise AssertionError(
            "USAdapter should raise NotImplementedError"
        )


if __name__ == "__main__":
    test_industrial_process_adapter()
    test_battery_adapter()
    test_ev_fleet_stub()
    test_eu_adapter_stub()
    test_us_adapter_stub()

    print("\nAll adapter tests passed!")