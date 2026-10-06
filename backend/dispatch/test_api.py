from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth.utils import get_current_user
from db.database import Base, get_db
from db.models import DispatchRun, User, UserRole
from dispatch.main import app

# /dispatch/plan requires an authenticated user and a database session.
# Use an in-memory SQLite DB and a fake admin user so the test is self-contained.
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSession = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=_engine)


def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


def _override_current_user():
    return User(
        id=1,
        username="test_admin",
        role=UserRole.admin,
        is_active=True,
        must_change_password=False,
    )


app.dependency_overrides[get_db] = _override_get_db
app.dependency_overrides[get_current_user] = _override_current_user

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
    assert "cost_saved_usd" in kpis
    assert "co2_saved_kg" in kpis
    assert "peak_baseline_kw" in kpis
    assert "peak_optimized_kw" in kpis
    assert "peak_shaved_kw" in kpis

    print("\nDispatch API test passed!")


def test_dispatch_run_logs_real_kpis():
    """Regression: DispatchRun rows must store the KPIs, not None."""
    response = client.get("/dispatch/plan")
    assert response.status_code == 200
    kpis = response.json()["plan"]["kpis"]

    db = _TestingSession()
    try:
        run = db.query(DispatchRun).order_by(DispatchRun.id.desc()).first()
        assert run is not None
        assert run.cost_saved_usd is not None
        assert run.co2_saved_kg is not None
        assert run.peak_shaved_kw is not None
        assert run.cost_saved_usd == kpis["cost_saved_usd"]
        assert run.peak_shaved_kw == kpis["peak_shaved_kw"]
    finally:
        db.close()


if __name__ == "__main__":
    test_dispatch_api()