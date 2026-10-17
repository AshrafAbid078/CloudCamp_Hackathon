"""Historical demo solar forecast with live-or-cached carbon metadata."""
import json
import logging
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.auth.utils import require_role
from backend.db.database import get_db
from backend.db.models import UserRole
from backend.forecasting.features import build_features, physical_solar, FORECAST_LEAD_HOURS, GFS_COLUMNS
from backend.forecasting.models.baseline import PersistenceForecaster
from backend.forecasting.models.lgbm import GBMForecaster
from backend.forecasting.carbon import carbon_signal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/forecast", tags=["forecasting"])
PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = PROJECT_ROOT/"data/processed"
MODELS_DIR = Path(__file__).parent/"models/saved"
_MODEL_PATH = MODELS_DIR/"lgbm_solar.joblib"
_METRICS_PATH = MODELS_DIR/"lgbm_metrics.json"

def _baseline_accuracy(metrics, reason=None):
    scores = metrics.get("benchmarks", {}).get("PersistenceBaseline", {})
    return {**metrics, "model": "PersistenceBaseline", "rmse": scores.get("rmse"),
            "mape": scores.get("mape"), "mae": scores.get("mae"), "fallback_reason": reason}

def _load_forecaster():
    metrics = {}
    try:
        if _METRICS_PATH.exists():
            metrics = json.loads(_METRICS_PATH.read_text(encoding="utf-8"))
        if metrics.get("schema_version") != 2:
            raise ValueError("Rebuild model metrics with python -m backend.forecasting.train")
        if metrics.get("model") == "LightGBM":
            model = GBMForecaster()
            model.load(str(_MODEL_PATH))
            return model, metrics
        return PersistenceForecaster().fit(None, None), _baseline_accuracy(metrics)
    except (OSError, ValueError, RuntimeError) as exc:
        logger.warning("Using persistence solar fallback: %s", exc)
        return PersistenceForecaster().fit(None, None), _baseline_accuracy(metrics, str(exc))

_forecaster, _accuracy = _load_forecaster()

def get_forecast(region: str, horizon_hours: int = 24, db: Session | None = None):
    if region.lower() != "bd":
        raise NotImplementedError(f"Region '{region}' is architecture-ready only; live demo region is bd")
    if isinstance(horizon_hours, bool) or not isinstance(horizon_hours, int) or not 1 <= horizon_hours <= 24:
        raise ValueError("horizon_hours must be an integer from 1 to 24")
    nsrdb_path = PROCESSED_DIR/"bangladesh_nsrdb_clean.parquet"
    if not nsrdb_path.exists():
        raise FileNotFoundError("Solar data missing; run the NSRDB pipeline")
    solar = pd.read_parquet(nsrdb_path)
    weather_path = PROCESSED_DIR/"bangladesh_gfs_clean.parquet"
    weather = pd.read_parquet(weather_path) if weather_path.exists() else None
    features = build_features(solar, weather)
    if len(features) < FORECAST_LEAD_HOURS:
        raise ValueError("At least 24 complete hourly feature rows are required")
    # Predict the same fixed 24-hour window for every horizon, then slice.
    last = features.index[-1]
    origins = pd.date_range(last-pd.Timedelta(hours=23), periods=24, freq="h")
    current = features.reindex(origins)
    if current.GHI.isna().any():
        raise ValueError("Latest solar observation window contains gaps")
    timestamps = origins+pd.Timedelta(hours=FORECAST_LEAD_HOURS)
    forecaster, accuracy = _forecaster, dict(_accuracy)
    if weather is None and isinstance(forecaster, GBMForecaster):
        forecaster = PersistenceForecaster().fit(None, None)
        accuracy = _baseline_accuracy(_accuracy, "GFS file missing; using compatible persistence model")
    try:
        predictions = forecaster.predict(current)
    except ValueError as exc:
        forecaster = PersistenceForecaster().fit(None, None)
        accuracy = _baseline_accuracy(_accuracy, str(exc))
        predictions = forecaster.predict(current)
    values = physical_solar(predictions, timestamps)[:horizon_hours]
    carbon, carbon_meta = carbon_signal(region, PROCESSED_DIR/"bangladesh_carbon_intensity_clean.parquet", db)
    return {"region": region.lower(), "horizon_hours": horizon_hours, "accuracy": accuracy,
        "data_quality": {"solar_mode": "historical_demo", "solar_last_observation": last.isoformat(),
            "solar_location": {"latitude": 24.34, "longitude": 90.07},
            "interval_method": "Fixed +/-15 percent heuristic", "carbon": carbon_meta,
            "time_basis_note": "Historical solar scenario; carbon reading time is reported separately",
            "weather_available": bool(current[GFS_COLUMNS].notna().any().any()),
            "weather_file_present": weather is not None,
            "weather_max_age_hours": 24},
        "forecast": {"timestamps": [t.isoformat() for t in timestamps[:horizon_hours]],
            "solar_ghi_w_m2": values.tolist(), "solar_ghi_lower": (values*0.85).tolist(),
            "solar_ghi_upper": (values*1.15).tolist(), "grid_stress_gco2_kwh": [carbon]*horizon_hours}}

@router.get("/{region}")
def forecast_endpoint(region: str, horizon_hours: int = Query(24, ge=1, le=24),
    _user=Depends(require_role(UserRole.facility_manager, UserRole.grid_operator, UserRole.admin)),
    db: Session = Depends(get_db)):
    try:
        return get_forecast(region, horizon_hours, db)
    except NotImplementedError as exc:
        raise HTTPException(501, detail=str(exc)) from exc
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(503, detail=str(exc)) from exc
