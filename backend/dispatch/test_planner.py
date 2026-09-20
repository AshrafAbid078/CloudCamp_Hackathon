from dispatch.adapters import (
    IndustrialProcessAdapter,
    BatteryAdapter,
)

from dispatch.planner import dispatch_plan


def test_dispatch_plan():

    # ---------------------------------------------
    # Example electricity prices
    # ---------------------------------------------

    prices = [
        10,
        8,
        3,
        2,
        7,
        12,
    ]

    # ---------------------------------------------
    # Example carbon intensity
    # gCO2/kWh
    # ---------------------------------------------

    carbon_intensity = [
        500,
        450,
        300,
        250,
        400,
        550,
    ]

    # ---------------------------------------------
    # Industrial asset
    # ---------------------------------------------

    process = IndustrialProcessAdapter(
        asset_id="F001",
        name="Water Pump",
        power_kw=100,
        earliest_start=1,
        deadline=6,
        duration=2,
    )

    # ---------------------------------------------
    # Battery asset
    # ---------------------------------------------

    battery = BatteryAdapter(
        asset_id="B001",
        capacity_kwh=100,
        current_soc=0.5,
        charge_rate_kw=20,
        discharge_rate_kw=20,
    )

    # ---------------------------------------------
    # Create dispatch plan
    # ---------------------------------------------

    result = dispatch_plan(
        industrial_assets=[process],
        battery_assets=[battery],
        prices=prices,
        carbon_intensity=carbon_intensity,
    )

    # ---------------------------------------------
    # Print result
    # ---------------------------------------------

    print("\n========== DISPATCH PLAN ==========")

    print("\nIndustrial:")
    print(result["industrial"])

    print("\nBatteries:")
    print(result["batteries"])

    print("\nKPIs:")
    print(result["kpis"])

    # ---------------------------------------------
    # Basic checks
    # ---------------------------------------------

    assert len(result["industrial"]) == 1
    assert len(result["batteries"]) == 1

    assert result["industrial"][0]["asset_id"] == "F001"
    assert result["batteries"][0]["asset_id"] == "B001"

    assert "cost_saved" in result["kpis"]
    assert "emissions_saved_gco2" in result["kpis"]

    print("\nDispatch planner test passed!")


if __name__ == "__main__":
    test_dispatch_plan()