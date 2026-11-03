from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from db.database import Base, get_db
from dispatch import api


def test_custom_portfolio_preview_save_reload_and_override(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    def test_db():
        with sessions() as db:
            yield db
    monkeypatch.setattr(api, "_ALL_PROCESSES", [])
    monkeypatch.setattr(api, "_ALL_BATTERIES", [])
    monkeypatch.setattr(api, "get_forecast", lambda **kw: {
        "accuracy": {"model": "test"}, "sources": {"solar": "test", "carbon": "test"},
        "forecast": {"timestamps": ["2026-11-03T00:00:00+00:00", "2026-11-03T01:00:00+00:00"],
                     "grid_stress_gco2_kwh": [500, 500], "solar_ghi_w_m2": [0, 0]}})
    app.dependency_overrides[get_db] = test_db
    try:
        client = TestClient(app)
        auth = client.post("/auth/signup", json={"username": "customtester", "password": "test-password"}).json()
        headers = {"Authorization": f"Bearer {auth['access_token']}"}
        asset = {"name": "New machine", "power_kw": 100, "duration_hours": 1, "deadline_hour": 2}
        preview = client.post("/dispatch/custom-asset", headers=headers,
                              json={**asset, "horizon_hours": 2, "existing_assets": [asset]})
        assert preview.status_code == 200, preview.text
        data = preview.json()
        assert data["hours"] == 2 and len(data["plan"]["industrial"]) == 2
        ids = [p["asset_id"] for p in data["plan"]["industrial"]]
        assert len(set(ids)) == 2
        definitions = data["assumptions"]["custom_assets"]
        saved = client.post("/dispatch/runs?hours=2", headers=headers, json={"custom_assets": definitions})
        assert saved.status_code == 200, saved.text
        assert saved.json()["plan"]["kpis"] == data["system_kpis"]
        reloaded = client.get(f"/dispatch/runs/{saved.json()['run_id']}", headers=headers).json()
        assert [p["asset_id"] for p in reloaded["plan"]["industrial"]] == ids
        assert reloaded["assumptions"]["custom_assets"] == definitions
        override = client.post("/dispatch/override", headers=headers, json={
            "asset_id": ids[0], "forced_start_hour": 1, "horizon_hours": 2,
            "custom_assets": definitions, "reason": "Operator preference"})
        assert override.status_code == 200, override.text
        assert len(override.json()["plan"]["industrial"]) == 2
        assert override.json()["plan"]["industrial"][0]["optimized_hours"] == [1]
        assert client.post("/dispatch/custom-asset", headers=headers,
                           json={**asset, "horizon_hours": 1}).status_code == 422
        assert client.post("/dispatch/runs?hours=2", headers=headers,
                           json={"custom_assets": [asset] * 11}).status_code == 422
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
