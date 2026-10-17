from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.auth.utils import get_current_user
from backend.db.database import Base, get_db
from backend.db.models import CarbonSnapshot, User, UserRole
from backend.forecasting import router as service
from backend.forecasting.carbon import carbon_signal
from backend.forecasting.features import build_features, extract_target, chronological_split, physical_solar
from backend.forecasting.models.baseline import PersistenceForecaster
from backend.forecasting.models.lgbm import GBMForecaster
from backend.data_pipeline.loaders.nsrdb_loader import NSRDBLoader

@pytest.fixture
def session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as db:
        yield db
    engine.dispose()

@pytest.mark.parametrize("offset", [0, 6])
def test_loader_uses_source_timezone(tmp_path, offset):
    path = tmp_path/"solar.csv"
    path.write_text(f"Time Zone,Local Time Zone\n{offset},6\nYear,Month,Day,Hour,Minute,GHI\n2020,1,1,12,0,500\n", encoding="utf-8")
    loader = NSRDBLoader([path], tmp_path/"out.parquet")
    result = loader.create_timestamp(loader.load_data())
    assert result.timestamp.iloc[0] == pd.Timestamp(f"2020-01-01 {12-offset:02d}:00Z")

def test_features_keep_solar_years_and_expire_weather():
    times = pd.date_range("2019-12-20", periods=24*30, freq="h", tz="UTC")
    solar = pd.DataFrame({"timestamp": times, "GHI": np.arange(len(times))})
    weather = pd.DataFrame({"datetime": [pd.Timestamp("2020-01-01", tz="UTC")], "temperature_2m_k": [300]})
    features = build_features(solar, weather)
    assert set(features.index.year) == {2019, 2020}
    assert pd.isna(features.loc["2020-01-03 00:00Z", "temperature_2m_k"])

def test_baseline_and_split_match_forecast_origin():
    times = pd.date_range("2020-01-01", periods=200, freq="h", tz="UTC")
    data = pd.DataFrame({"GHI": np.arange(200)}, index=times)
    X, y = extract_target(data)
    predicted = PersistenceForecaster().fit(None, None).predict(X)
    assert (y-predicted == 24).all()
    train, test, _, _ = chronological_split(X, y)
    assert train.index[-1]+pd.Timedelta(hours=24) < test.index[0]

def test_target_does_not_bridge_missing_hour():
    times = pd.date_range("2020-01-01", periods=80, freq="h", tz="UTC")
    frame = pd.DataFrame({"GHI": np.arange(80)}, index=times).drop(times[30])
    X, y = extract_target(frame)
    assert times[6] not in X.index
    assert y.loc[times[7]] == 31

def test_physical_bounds_and_night():
    result = physical_solar([-20, 500, 500], pd.to_datetime(["2020-06-01T06:00Z", "2020-06-01T18:00Z", "2020-06-01T06:00Z"]))
    assert result.tolist() == [0, 0, 500]

@pytest.mark.parametrize("horizon", [-1, 0, 25, 10000])
def test_invalid_horizon_is_422(horizon, session):
    app = FastAPI()
    app.include_router(service.router)
    app.dependency_overrides[get_current_user] = lambda: User(username="test", role=UserRole.admin, must_change_password=False)
    app.dependency_overrides[get_db] = lambda: session
    assert TestClient(app).get(f"/forecast/bd?horizon_hours={horizon}").status_code == 422
    with pytest.raises(ValueError):
        service.get_forecast("bd", horizon)

def test_live_carbon_wins_and_stale_invalid_readings_fall_back(session, tmp_path):
    now = datetime.now(timezone.utc)
    cache = tmp_path/"carbon.parquet"
    pd.DataFrame({"datetime": [now-timedelta(days=90)], "carbon_intensity_gco2eq_kwh": [625], "isestimated": [True]}).to_parquet(cache)
    live = CarbonSnapshot(region="BD", reading_datetime=now-timedelta(hours=1), carbon_intensity_gco2eq_kwh=450)
    session.add(live)
    session.commit()
    value, metadata = carbon_signal("bd", cache, session, now)
    assert value == 450 and metadata["fallback_reason"] is None
    live.carbon_intensity_gco2eq_kwh = float("inf")
    session.commit()
    assert carbon_signal("bd", cache, session, now)[0] == 625
    live.carbon_intensity_gco2eq_kwh = 450
    live.reading_datetime = now-timedelta(days=3)
    session.commit()
    value, metadata = carbon_signal("bd", cache, session, now)
    assert value == 625 and metadata["is_stale"]

def test_missing_weather_uses_compatible_fallback(monkeypatch, session):
    original = Path.exists
    monkeypatch.setattr(Path, "exists", lambda p: False if p.name == "bangladesh_gfs_clean.parquet" else original(p))
    result = service.get_forecast("bd", 6, session)
    assert result["accuracy"]["model"] == "PersistenceBaseline"
    assert len(result["forecast"]["timestamps"]) == 6

def test_native_model_handles_crlf_and_rejects_bad_offsets(tmp_path):
    model_path = Path(__file__).parent/"models/saved/lgbm_solar.joblib"
    crlf = tmp_path/"crlf.txt"
    raw = model_path.read_bytes().replace(b"\r\n", b"\n")
    crlf.write_bytes(raw.replace(b"\n", b"\r\n"))
    model = GBMForecaster()
    model.load(str(crlf))
    assert model.is_fitted
    saved = tmp_path/"saved.txt"
    model.save(str(saved))
    assert b"\r\n" not in saved.read_bytes()
    reloaded = GBMForecaster()
    reloaded.load(str(saved))
    assert reloaded._booster.num_trees() == model._booster.num_trees()
    crlf.write_bytes(raw.replace(b"Tree=0\n", b"Tree=0\n\n", 1))
    with pytest.raises(ValueError, match="byte offsets"):
        model.load(str(crlf))
