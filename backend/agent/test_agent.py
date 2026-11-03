"""Regression tests for tool evidence, request safety and the Gemini exchange."""
import asyncio
import json
import threading

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from config import settings
from auth.utils import create_access_token, hash_password, password_version
from db.database import Base, get_db
from db.models import User, UserRole
from agent import tools, copilot_service as service, limits


@pytest.fixture(autouse=True)
def isolated_limits(monkeypatch):
    limits._requests.clear()
    monkeypatch.setattr(limits, "_paid_day", "")
    monkeypatch.setattr(limits, "_paid_calls", 0)
    monkeypatch.setattr(settings, "gemini_api_key", "")


def test_forecast_tool_reads_actual_schema_and_sources(monkeypatch):
    monkeypatch.setattr(tools, "get_forecast", lambda **kw: {
        "accuracy": {"model": "PersistenceBaseline"},
        "sources": {"solar": "archived_2020", "carbon": "archived"},
        "forecast": {"timestamps": ["2020-01-01T06:00:00+00:00"],
                     "solar_ghi_w_m2": [800], "grid_stress_gco2_kwh": [710]}})
    result = tools.fetch_solar_and_carbon_forecast(1)
    assert result["solar"]["peak_ghi_w_per_m2"] == 800
    assert result["carbon_telemetry"]["average_intensity_gco2_kwh"] == 710
    assert result["carbon_telemetry"]["status"] == "archived"
    assert result["solar"]["source"] == "archived_2020"
    with pytest.raises(ValueError):
        tools.fetch_solar_and_carbon_forecast(25)


def test_dispatch_tool_preserves_values_and_schedule(monkeypatch):
    monkeypatch.setattr(tools, "_preview", lambda *a, **kw: {
        "hours": 2, "forecast_used": {"sources": {}, "timestamps": ["a", "b"]}, "assumptions": {},
        "plan": {"kpis": {"baseline_cost": 20, "optimized_cost": 10, "cost_saved_usd": 10,
                          "co2_saved_kg": -1, "peak_shaved_kw": 0},
                 "industrial": [{"asset_id": "p1", "name": "Machine", "power_kw": 10, "duration": 1,
                                 "deadline": 2, "optimized_hours": [1], "cost_saved": 10,
                                 "emissions_saved_gco2": -1000}],
                 "batteries": [{"asset_id": "b1", "capacity_kwh": 10, "cost_saved": -2,
                                "schedule": [{"hour": 0, "charge_kw": 2, "discharge_kw": 0},
                                             {"hour": 1, "charge_kw": 0, "discharge_kw": 1}]}]}})
    result = tools.fetch_current_dispatch_plan(2)
    assert result["kpis"]["cost_savings_usd"] == 10
    assert result["kpis"]["carbon_saved_kg"] == -1
    assert result["industrial_processes"][0]["optimal_start_hour"] == 1
    assert result["batteries"][0]["charge_hours"] == [0]
    assert "error" in tools.explain_asset_decision("nonexistent")
    assert tools.explain_asset_decision("Machine")["evidence"]["scheduled_hours"] == [1]


def test_fallback_preserves_increases_and_requires_capacity(monkeypatch):
    received = []
    def scenario(**kwargs):
        received.append(kwargs)
        return {"impact_vs_baseline": {"cost_change_usd": 15, "emissions_change_kg": 8,
                                       "peak_load_change_kw": -2}, "sources": {}}
    monkeypatch.setattr(service, "run_whatif_simulation", scenario)
    answer = service._rule_based_fallback("What if we install 350 kW solar?", "facility_manager")
    assert received == [{"pv_capacity_kw": 350}]
    assert "+15.00" in answer["reply"] and "+8.00" in answer["reply"]
    assert "reduces by" not in answer["reply"]
    assert service._rule_based_fallback("What if solar drops 20%?", "facility_manager")["status"] == "needs_input"


def test_chat_limits_guest_paid_access_and_history(monkeypatch):
    from agent import router
    requests = []
    async def stub(*args, **kwargs):
        requests.append(kwargs)
        return {"status": "success", "reply": "test", "role": "facility_manager", "tool_calls": []}
    monkeypatch.setattr(router, "chat_with_copilot", stub)
    client = TestClient(app)
    for _ in range(6):
        assert client.post("/copilot/chat", json={"message": "test"}).status_code == 200
    assert requests[0]["allow_llm"] is False
    assert client.post("/copilot/chat", json={"message": "test"}).status_code == 429
    assert client.post("/copilot/chat", json={"message": "test", "conversation_history": [
        {"role": "user", "text": "x" * 2001}]}).status_code == 422
    assert client.post("/copilot/chat", json={"message": "test", "conversation_history": [
        {"role": "user", "text": "x"}] * 7}).status_code == 422
    assert client.get("/copilot/tools").json()["protocol"] == "HTTP tool catalog"


def test_authenticated_chat_uses_full_token_validation(monkeypatch):
    from agent import router
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        user = User(username="operator", hashed_password=hash_password("test-password"),
                    role=UserRole.grid_operator, is_active=True, must_change_password=False)
        db.add(user); db.commit()
        token = create_access_token({"sub": user.username, "role": user.role.value,
                                     "pwd": password_version(user.hashed_password)})
    def test_db():
        with sessions() as db:
            yield db
    async def stub(message, role, history, **kwargs):
        return {"role": role, "allow_llm": kwargs["allow_llm"]}
    monkeypatch.setattr(router, "chat_with_copilot", stub)
    app.dependency_overrides[get_db] = test_db
    try:
        client = TestClient(app)
        headers = {"Authorization": f"Bearer {token}"}
        result = client.post("/copilot/chat", headers=headers, json={"message": "test"})
        assert result.json() == {"role": "grid_operator", "allow_llm": True}
        assert client.post("/copilot/chat", headers=headers, json={"message": "test", "role": "admin"}).status_code == 403
        with sessions() as db:
            db.query(User).first().hashed_password = hash_password("changed-password"); db.commit()
        assert client.post("/copilot/chat", headers=headers, json={"message": "test"}).status_code == 401
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_model_budget_and_blocking_work_is_off_loop(monkeypatch):
    monkeypatch.setattr(settings, "copilot_daily_model_calls", 1)
    assert limits.reserve_model_call() is True
    assert limits.reserve_model_call() is False
    main_thread = threading.get_ident()
    def fallback(*args):
        assert threading.get_ident() != main_thread
        return {"mode": "local_tools"}
    monkeypatch.setattr(service, "_rule_based_fallback", fallback)
    assert asyncio.run(service.chat_with_copilot("test"))["mode"] == "local_tools"


def test_gemini_multi_tool_exchange_and_safe_key_header(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(service, "reserve_model_call", lambda: True)
    monkeypatch.setattr(service, "_execute_local_tool", lambda name, args: {"value": 710})
    bodies = []
    def handler(request):
        assert "key=" not in str(request.url)
        assert request.headers["x-goog-api-key"] == "test-key"
        body = json.loads(request.content); bodies.append(body)
        if len(bodies) == 1:
            return httpx.Response(200, json={"candidates": [{"content": {"role": "model", "parts": [
                {"functionCall": {"name": "get_solar_forecast", "args": {}}},
                {"functionCall": {"name": "get_dispatch_schedule", "args": {}}}]}}]})
        assert body["contents"][-1]["role"] == "user"
        assert len(body["contents"][-1]["parts"]) == 2
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "Tool evidence: 710."}]}}]})
    original = httpx.AsyncClient
    monkeypatch.setattr(service.httpx, "AsyncClient", lambda **kw: original(**kw, transport=httpx.MockTransport(handler)))
    result = asyncio.run(service.chat_with_copilot("Compare", conversation_history=[{"role": "user", "text": "Earlier question"}]))
    assert result["mode"] == "gemini" and len(result["tool_calls"]) == 2
    assert bodies[0]["contents"][0]["parts"][0]["text"] == "Earlier question"
