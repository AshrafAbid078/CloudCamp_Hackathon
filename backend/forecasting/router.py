# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
import pandas as pd
import numpy as np
import json
from pathlib import Path
from typing import Dict, Any, Literal
from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy.exc import SQLAlchemyError

from .features import build_features
from .models.baseline import PersistenceForecaster
from .models.lgbm import GBMForecaster
from auth.utils import require_role
from db.models import UserRole
from db.models import CarbonSnapshot
from db.database import SessionLocal
from config import settings
from .live_sources import weather_forecast, carbon_forecast

router = APIRouter(prefix="/forecast", tags=["forecasting"])
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = Path(__file__).resolve().parent / "models" / "saved"

# ---------------------------------------------------------------------------
# Model + metrics — loaded once at module import time (not per-request).
# Prefer the trained LightGBM model if it exists on disk; fall back to the
# stateless persistence baseline so the endpoint always works.
# ---------------------------------------------------------------------------

_MODEL_PATH = MODELS_DIR / "lgbm_solar.joblib"
_METRICS_PATH = MODELS_DIR / "lgbm_metrics.json"

def _load_forecaster():
    """
    Returns (forecaster, accuracy_dict).
    Uses LightGBM if the saved model file exists; otherwise falls back to the
    persistence baseline with a clearly-labelled placeholder accuracy dict.
    """
    # The saved native artifact crashes inference in the supported local runtime.
    # Opt in only after a compatible artifact has been verified independently.
    import os
    if os.environ.get("MERIDIAN_ENABLE_LIGHTGBM") == "1" and _MODEL_PATH.exists():
        forecaster = GBMForecaster()
        forecaster.load(str(_MODEL_PATH))

        if _METRICS_PATH.exists():
            with open(_METRICS_PATH) as f:
                metrics = json.load(f)
            accuracy = {
                "model": metrics.get("model", "LightGBM"),
                "rmse": metrics.get("rmse"),
                "mape": metrics.get("mape"),
            }
        else:
            # Model exists but metrics file not yet generated — run test_forecasting.py
            accuracy = {
                "model": "LightGBM",
                "rmse": None,
                "mape": None,
                "note": "Metrics not yet computed. Run backend/forecasting/test_forecasting.py.",
            }

        return forecaster, accuracy

    # Fallback: persistence baseline
    forecaster = PersistenceForecaster(lag_feature_col='GHI_lag_24')
    forecaster.fit(None, None)
    accuracy = {
        "model": "PersistenceBaseline",
        "rmse": None,
        "mape": None,
        "note": "Historical persistence forecast; saved LightGBM artifact is disabled pending runtime validation.",
    }
    return forecaster, accuracy


_forecaster, _accuracy = _load_forecaster()


def _archive_forecast(region: str, horizon_hours: int = 24) -> Dict[str, Any]:
    """
    Core forecast logic — callable directly from tests and CLI,
    without requiring a FastAPI request context.

    Args:
        region: The region code (currently only 'bd' is live).
        horizon_hours: Number of hours ahead to forecast.

    Returns:
        A dict with region, horizon_hours, accuracy metadata, and forecast arrays.

    Raises:
        NotImplementedError: If region is not yet supported.
        FileNotFoundError: If required processed data files are missing.
        ValueError: If there is not enough data for the requested horizon.
    """
    if not 1 <= horizon_hours <= 24:
        raise ValueError("horizon_hours must be between 1 and 24.")
    if region.lower() != "bd":
        # System architecture §2.1: Only BD is live MVP.
        raise NotImplementedError(
            f"Region adapter for '{region}' is an architecture-ready stub. "
            "Live region is 'bd'."
        )

    # 1. Load Data
    nsrdb_path = PROCESSED_DIR / "bangladesh_nsrdb_clean.parquet"
    carbon_path = PROCESSED_DIR / "bangladesh_carbon_intensity_clean.parquet"
    gfs_path = PROCESSED_DIR / "bangladesh_gfs_clean.parquet"

    if not nsrdb_path.exists() or not carbon_path.exists():
        raise FileNotFoundError(
            "Required processed data not found. Please run data pipeline ingestion first."
        )

    nsrdb_df = pd.read_parquet(nsrdb_path)
    carbon_df = pd.read_parquet(carbon_path)

    gfs_df = pd.read_parquet(gfs_path) if gfs_path.exists() else None

    # 2. Build Features
    features_df = build_features(nsrdb_df, gfs_df)

    # Ensure we have enough data for the horizon
    if len(features_df) < 24:
        raise ValueError("Not enough data to form a forecast horizon.")

    # Get the latest `horizon_hours` rows to act as our forecast base.
    # For the persistence / LightGBM pattern: we take the last known window
    # and use it as the feature set for the next `horizon_hours` predictions.
    current_features = features_df.iloc[-24:].copy()

    # Drop raw GHI from the inference feature set to match the training schema.
    # extract_target() removes GHI during training to prevent data leakage;
    # we must do the same here or LightGBM will see a different feature count.
    if isinstance(_forecaster, GBMForecaster) and 'GHI' in current_features.columns:
        current_features = current_features.drop(columns=['GHI'])

    # 3. Solar Forecast — uses whichever model was loaded at startup
    if isinstance(_forecaster, PersistenceForecaster):
        # Tomorrow's same-hour values are today's observed GHI values.
        solar_pred = features_df["GHI"].iloc[-24:].clip(lower=0)
    else:
        solar_pred = _forecaster.predict(current_features)
    solar_pred = solar_pred.iloc[:horizon_hours]

    # Confidence bands: +/- 15% for baseline/LightGBM MVP
    solar_upper = solar_pred * 1.15
    solar_lower = np.maximum(0, solar_pred * 0.85)  # Solar cannot be negative

    # 4. Grid-stress Forecast (Extrapolation of Carbon Intensity)
    # Simple short-horizon extrapolation of last known value (persistence).
    # Deliberately kept simple — not oversold per system-arch.md §2.2.
    last_carbon = carbon_df['carbon_intensity_gco2eq_kwh'].iloc[-1]
    carbon_pred = np.full(horizon_hours, last_carbon)

    # 5. Prepare timestamps — hourly steps from the last known timestamp
    last_timestamp = features_df.index[-1]
    future_timestamps = [last_timestamp + pd.Timedelta(hours=i + 1) for i in range(horizon_hours)]

    return {
        "region": region,
        "horizon_hours": horizon_hours,
        "accuracy": _accuracy,
        "sources": {"solar": "archived_2020", "carbon": "archived", "location": "Bangladesh regional demo", "fallback": False},
        "forecast": {
            "timestamps": [t.isoformat() for t in future_timestamps],
            "solar_ghi_w_m2": solar_pred.tolist(),
            "solar_ghi_lower": solar_lower.tolist(),
            "solar_ghi_upper": solar_upper.tolist(),
            "grid_stress_gco2_kwh": carbon_pred.tolist()
        }
    }


def _recent_carbon_snapshot() -> CarbonSnapshot | None:
    db = SessionLocal()
    try:
        return (db.query(CarbonSnapshot)
                .filter(CarbonSnapshot.region == settings.poll_region.upper())
                .order_by(CarbonSnapshot.reading_datetime.desc(), CarbonSnapshot.id.desc())
                .first())
    except SQLAlchemyError as exc:
        logger.warning("Recent carbon snapshot unavailable: %s", exc)
        return None
    finally:
        db.close()


def get_forecast(region: str, horizon_hours: int = 24, source: Literal["auto", "archive"] = "auto") -> Dict[str, Any]:
    """Prefer current weather, then explicitly labelled archived fallback."""
    if region.lower() != "bd":
        raise NotImplementedError(f"Region adapter for '{region}' is unavailable. Supported region: bd.")
    if not 1 <= horizon_hours <= 24:
        raise ValueError("horizon_hours must be between 1 and 24.")
    if source not in ("auto", "archive"):
        raise ValueError("source must be auto or archive.")
    if source == "archive":
        return _archive_forecast(region, horizon_hours)

    weather = weather_forecast()
    if weather is None:
        result = _archive_forecast(region, horizon_hours)
        result["sources"]["fallback"] = True
        result["sources"]["note"] = "Current weather unavailable; showing archived 2020 data."
        return result

    timestamps = weather["timestamps"][:horizon_hours]
    solar = weather["ghi"][:horizon_hours]
    carbon = carbon_forecast(timestamps)
    if carbon:
        carbon_values = carbon["values"]
        carbon_source = "electricity_maps_v4_forecast"
        carbon_as_of = carbon["updated_at"]
    else:
        snapshot = _recent_carbon_snapshot()
        reading = snapshot.reading_datetime if snapshot else None
        if reading and reading.tzinfo is None:
            reading = reading.replace(tzinfo=timezone.utc)
        fresh = bool(reading and -timedelta(minutes=5) <= datetime.now(timezone.utc) - reading <= timedelta(hours=2))
        if fresh and snapshot:
            carbon_values = [snapshot.carbon_intensity_gco2eq_kwh] * horizon_hours
            carbon_source = "electricity_maps_recent_reading_persistence"
            carbon_as_of = reading.isoformat() if reading else None
        else:
            carbon_path = PROCESSED_DIR / "bangladesh_carbon_intensity_clean.parquet"
            if not carbon_path.exists():
                raise FileNotFoundError("Archived carbon fallback is unavailable.")
            archived_carbon = float(pd.read_parquet(carbon_path)["carbon_intensity_gco2eq_kwh"].iloc[-1])
            carbon_values = [archived_carbon] * horizon_hours
            carbon_source = "archived_constant"
            carbon_as_of = None

    return {
        "region": region,
        "horizon_hours": horizon_hours,
        "accuracy": {"model": "OpenMeteoForecast", "rmse": None, "mape": None,
                     "note": "Current weather-model forecast, not a measured GHI or validated LightGBM result."},
        "sources": {"solar": "open_meteo_weather_forecast", "carbon": carbon_source,
                    "location": {"latitude": settings.forecast_latitude, "longitude": settings.forecast_longitude},
                    "weather_fetched_at": weather["fetched_at"], "carbon_as_of": carbon_as_of,
                    "fallback": carbon_source == "archived_constant"},
        "forecast": {"timestamps": timestamps, "solar_ghi_w_m2": solar,
                     "solar_ghi_lower": [max(0, value * 0.85) for value in solar],
                     "solar_ghi_upper": [value * 1.15 for value in solar],
                     "grid_stress_gco2_kwh": carbon_values},
    }


@router.get("/{region}")
def forecast_endpoint(
    region: str,
    horizon_hours: int = Query(24, ge=1, le=24, description="Hours ahead to forecast"),
    source: Literal["auto", "archive"] = Query("auto", description="Current weather with fallback, or archived demo"),
    _user=Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
) -> Dict[str, Any]:
    """
    FastAPI route — delegates to get_forecast() and converts domain errors to HTTP responses.
    Requires a valid JWT (any role: facility_manager, grid_operator, admin).
    """
    try:
        return get_forecast(region=region, horizon_hours=horizon_hours, source=source)
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
