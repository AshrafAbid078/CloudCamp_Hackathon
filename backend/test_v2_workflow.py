"""Full-app regression checks for the original frontend's API contract."""
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.database import Base, get_db
from db.models import DispatchRun, DispatchPlanRecord
from forecasting.router import get_forecast
from main import app


def test_public_account_and_saved_plan_workflow():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)

    def test_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    try:
        client = TestClient(app)
        escalated = client.post("/auth/signup", json={"username": "intruder", "password": "strongpassword", "role": "admin"})
        assert escalated.status_code == 422
        signed = client.post("/auth/signup", json={"username": "manager", "password": "strongpassword"})
        assert signed.status_code == 201
        assert signed.json()["role"] == "facility_manager"
        token = signed.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        assert client.get("/auth/me", headers=headers).status_code == 200
        assert client.get("/auth/users", headers=headers).status_code == 403
        assert client.get("/dispatch/runs/latest", headers=headers).status_code == 404
        assert client.post("/dispatch/runs?hours=0", headers=headers).status_code == 422
        assert client.post("/dispatch/runs?hours=24").status_code == 401

        scenario = client.post("/dispatch/scenarios", headers=headers, json={"pv_capacity_kw": 10000})
        assert scenario.status_code == 200, scenario.text
        assert scenario.json()["change"]["cost_usd"] < 0
        assert scenario.json()["scenario"]["grid_balance"]["pv_model"] == "capacity-scaled GHI estimate"
        assert client.post("/dispatch/scenarios", headers=headers, json={"pv_capacity_kw": -1}).status_code == 422

        created = client.post("/dispatch/runs?hours=24", headers=headers)
        assert created.status_code == 200, created.text
        plan = created.json()
        assert plan["run_id"] > 0
        assert len(plan["forecast_used"]["timestamps"]) == 24
        for process in plan["plan"]["industrial"]:
            assert len(process["optimized_hours"]) == process["duration"]
            assert process["optimized_hours"] == list(range(process["optimized_hours"][0], process["optimized_hours"][0] + process["duration"]))
        assert client.get(f'/dispatch/runs/{plan["run_id"]}', headers=headers).json() == plan
        assert client.get('/dispatch/runs/latest', headers=headers).json() == plan
        assert client.get('/dispatch/runs/latest?hours=6', headers=headers).status_code == 404
        assert len(client.get('/dispatch/runs', headers=headers).json()['runs']) == 1
        other = client.post("/auth/signup", json={"username": "other_manager", "password": "strongpassword"})
        other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
        assert client.get(f'/dispatch/runs/{plan["run_id"]}', headers=other_headers).status_code == 403
        assert client.post(f'/dispatch/runs/{plan["run_id"]}/decision', headers=other_headers,
                           json={"action": "approve"}).status_code == 403
        assert client.post(f'/dispatch/runs/{plan["run_id"]}/decision', headers=headers,
                           json={"action": "reject"}).status_code == 422
        rejected = client.post(f'/dispatch/runs/{plan["run_id"]}/decision', headers=headers,
                               json={"action": "reject", "reason": "Unsafe slot"})
        assert rejected.status_code == 200
        assert rejected.json()["equipment_command_sent"] is False
        assert client.get('/dispatch/runs/latest', headers=headers).status_code == 404
        assert client.get(f'/dispatch/runs/{plan["run_id"]}', headers=headers).json()["decision"] == "reject"
        assert client.post(f'/dispatch/runs/{plan["run_id"]}/decision', headers=headers,
                           json={"action": "approve"}).status_code == 409
        with sessions() as db:
            assert db.query(DispatchPlanRecord).count() == 1
            assert db.query(DispatchRun).count() == 0

        assert client.post("/dispatch/override", headers=headers, json={"asset_id": "not-real", "forced_start_hour": 0}).status_code == 404
        assert client.post("/dispatch/override", headers=headers, json={"asset_id": "not-real", "forced_start_hour": -1}).status_code == 422
        first = plan["plan"]["industrial"][0]
        shift = client.post("/dispatch/override", headers=headers, json={
            "asset_id": first["asset_id"],
            "forced_start_hour": first["optimized_hours"][0],
            "horizon_hours": 24,
            "reason": "Maintenance slot confirmed",
        })
        assert shift.status_code == 200, shift.text
        assert shift.json()["override_applied"]["reason"] == "Maintenance slot confirmed"
        assert client.get(f'/dispatch/runs/{shift.json()["run_id"]}', headers=headers).json() == shift.json()
        approved = client.post(f'/dispatch/runs/{shift.json()["run_id"]}/decision', headers=headers,
                               json={"action": "approve"})
        assert approved.status_code == 200
        assert approved.json()["equipment_command_sent"] is False
        assert client.get('/dispatch/runs/latest', headers=headers).json()["decision"] == "approve"
        changed = client.put("/auth/me/password", headers=headers, json={"current_password": "strongpassword", "new_password": "anotherstrongpassword"})
        assert changed.status_code == 200
        assert client.get("/auth/me", headers=headers).status_code == 401
        assert client.post("/auth/login", json={"username": "manager", "password": "wrong"}).status_code == 401
        assert client.post("/auth/login", json={"username": "manager", "password": "anotherstrongpassword"}).status_code == 200
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_forecast_short_horizons_are_prefixes():
    full = get_forecast("bd", 24)["forecast"]
    for hours in (6, 12):
        short = get_forecast("bd", hours)["forecast"]
        for key in ("timestamps", "solar_ghi_w_m2", "solar_ghi_lower", "solar_ghi_upper", "grid_stress_gco2_kwh"):
            assert short[key] == full[key][:hours]
