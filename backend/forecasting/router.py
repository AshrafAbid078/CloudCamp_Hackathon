# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
import pandas as pd
import numpy as np
import json
from pathlib import Path
from typing import Dict, Any

from .features import build_features
from .models.baseline import PersistenceForecaster
from .models.lgbm import GBMForecaster
from auth.utils import require_role
from db.models import UserRole

router = APIRouter(prefix="/forecast", tags=["forecasting"])

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
    if _MODEL_PATH.exists():
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
        "note": "LightGBM model not found. Run test_forecasting.py to train and save it.",
    }
    return forecaster, accuracy


_forecaster, _accuracy = _load_forecaster()


def get_forecast(region: str, horizon_hours: int = 24) -> Dict[str, Any]:
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
    if len(features_df) < horizon_hours:
        raise ValueError("Not enough data to form a forecast horizon.")

    # Get the latest `horizon_hours` rows to act as our forecast base.
    # For the persistence / LightGBM pattern: we take the last known window
    # and use it as the feature set for the next `horizon_hours` predictions.
    current_features = features_df.iloc[-horizon_hours:].copy()

    # Drop raw GHI from the inference feature set to match the training schema.
    # extract_target() removes GHI during training to prevent data leakage;
    # we must do the same here or LightGBM will see a different feature count.
    if isinstance(_forecaster, GBMForecaster) and 'GHI' in current_features.columns:
        current_features = current_features.drop(columns=['GHI'])

    # 3. Solar Forecast — uses whichever model was loaded at startup
    solar_pred = _forecaster.predict(current_features)

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
        "forecast": {
            "timestamps": [t.isoformat() for t in future_timestamps],
            "solar_ghi_w_m2": solar_pred.tolist(),
            "solar_ghi_lower": solar_lower.tolist(),
            "solar_ghi_upper": solar_upper.tolist(),
            "grid_stress_gco2_kwh": carbon_pred.tolist()
        }
    }


@router.get("/{region}")
def forecast_endpoint(
    region: str,
    horizon_hours: int = Query(24, description="Hours ahead to forecast"),
    _user=Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
) -> Dict[str, Any]:
    """
    FastAPI route — delegates to get_forecast() and converts domain errors to HTTP responses.
    Requires a valid JWT (any role: facility_manager, grid_operator, admin).
    """
    try:
        return get_forecast(region=region, horizon_hours=horizon_hours)
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
