from fastapi.testclient import TestClient
from dispatch.main import app

client = TestClient(app)


def test_dispatch_api():
    response = client.get("/dispatch/plan")

    print("\n========== API RESPONSE ==========")
    print(response.json())

    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}: {response.text}"
    )

    data = response.json()

    assert data["status"] == "success"
    assert "plan" in data
    assert "industrial" in data["plan"]
    assert "batteries" in data["plan"]
    assert "kpis" in data["plan"]

    # Verify the forecast signal is attached to the response
    assert "forecast_used" in data
    assert "timestamps" in data["forecast_used"]
    assert "prices_usd_kwh" in data["forecast_used"]
    assert "carbon_intensity_gco2_kwh" in data["forecast_used"]

    # Verify KPI keys are present
    kpis = data["plan"]["kpis"]
    assert "cost_saved" in kpis
    assert "emissions_saved_gco2" in kpis

    print("\nDispatch API test passed!")


if __name__ == "__main__":
    test_dispatch_api()