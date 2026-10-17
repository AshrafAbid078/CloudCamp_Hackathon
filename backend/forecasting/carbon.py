"""Latest valid live carbon reading, with explicit freshness and cache fallback."""
from datetime import datetime, timedelta, timezone
import math
from pathlib import Path
import pandas as pd
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from backend.config import settings
from backend.db.database import SessionLocal
from backend.db.models import CarbonSnapshot

def carbon_signal(region: str, cache_path: Path, db: Session | None = None, now=None):
    now = now or datetime.now(timezone.utc)
    if db is None:
        with SessionLocal() as session:
            return carbon_signal(region, cache_path, session, now)
    reason = "No fresh live reading"
    try:
        readings = db.query(CarbonSnapshot).filter(
            CarbonSnapshot.region == region.upper(),
            CarbonSnapshot.reading_datetime >= now-timedelta(hours=settings.carbon_max_age_hours),
            CarbonSnapshot.reading_datetime <= now,
        ).order_by(CarbonSnapshot.reading_datetime.desc()).all()
        for reading in readings:
            value = reading.carbon_intensity_gco2eq_kwh
            if not math.isfinite(value) or value < 0:
                continue
            return float(value), {
                "source": reading.source, "reading_datetime": reading.reading_datetime.isoformat(),
                "polled_at": reading.polled_at.isoformat(),
                "age_hours": (now-reading.reading_datetime).total_seconds()/3600,
                "is_estimated": bool(reading.is_estimated), "estimation_method": reading.estimation_method,
                "is_stale": False, "fallback_reason": None,
            }
    except SQLAlchemyError:
        # Standalone training/forecast CLI can run before database initialization.
        db.rollback()
        reason = "Live carbon database unavailable"
    if not cache_path.exists():
        raise FileNotFoundError("No fresh live carbon reading or cached carbon file")
    frame = pd.read_parquet(cache_path).copy()
    frame["datetime"] = pd.to_datetime(frame["datetime"], utc=True, errors="coerce")
    frame["carbon_intensity_gco2eq_kwh"] = pd.to_numeric(frame["carbon_intensity_gco2eq_kwh"], errors="coerce")
    valid = frame["carbon_intensity_gco2eq_kwh"].map(lambda x: math.isfinite(x) and x >= 0)
    frame = frame.loc[valid & frame.datetime.notna() & (frame.datetime <= now)].sort_values("datetime")
    if frame.empty:
        raise ValueError("Cached carbon data has no valid reading")
    row = frame.iloc[-1]
    age = (now-row.datetime).total_seconds()/3600
    return float(row.carbon_intensity_gco2eq_kwh), {
        "source": "historical_parquet", "reading_datetime": row.datetime.isoformat(), "polled_at": None,
        "age_hours": age, "is_estimated": bool(row.get("isestimated", True)),
        "estimation_method": str(row.get("estimationmethod", "unknown")),
        "is_stale": age > settings.carbon_max_age_hours, "fallback_reason": reason,
    }
