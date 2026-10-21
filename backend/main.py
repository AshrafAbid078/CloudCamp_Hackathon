"""
Meridian Grid — Unified Backend Application
============================================
Single FastAPI app that mounts all service routers:
  - /auth/...          →  Auth: login, register, user management
  - /forecast/{region} →  Phase 2: Solar + grid-stress forecast
  - /dispatch/...      →  Phase 3: Dispatch / optimization + history
  - /health            →  Phase 5: Smoke test gate

Run with:
    cd backend/
    uvicorn main:app --reload --port 8000

Then visit http://localhost:8000/docs for the interactive API explorer.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import settings
from db.database import SessionLocal, init_db
from db.models import User, UserRole
from auth.utils import hash_password
from auth.router import router as auth_router
from forecasting.router import router as forecast_router
from dispatch.api import router as dispatch_router
from poller.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ #
# Startup & Shutdown (lifespan)                                        #
# ------------------------------------------------------------------ #

def _seed_admin(db: Session) -> None:
    """
    If no users exist, create a default admin account:
        username: admin
        password: admin123
        must_change_password: True

    The must_change_password flag is True so the operator is reminded
    to change the password via PUT /auth/me/password on first login.
    """
    count = db.query(User).count()
    if count == 0:
        admin = User(
            username="admin",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
            must_change_password=True,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        logger.warning(
            "🔐 Default admin seeded (username=admin, password=admin123). "
            "CHANGE THIS PASSWORD immediately via PUT /auth/me/password."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager — runs setup before the server
    accepts requests, and teardown after it stops.
    """
    # ---- Startup ----
    logger.info("Initialising database...")
    init_db()                          # create tables if they don't exist

    db = SessionLocal()
    try:
        _seed_admin(db)                # create default admin if DB is empty
    finally:
        db.close()

    logger.info("Starting background scheduler...")
    start_scheduler()                  # begin Electricity Maps polling

    logger.info("✅ Meridian Grid API is ready.")
    yield

    # ---- Shutdown ----
    stop_scheduler()
    logger.info("Meridian Grid API stopped.")


# ------------------------------------------------------------------ #
# App factory                                                          #
# ------------------------------------------------------------------ #

app = FastAPI(
    title="Meridian Grid API",
    version="1.0.0",
    description=(
        "AI-powered solar + grid-stress forecasting and "
        "asset dispatch optimization for Bangladesh. "
        "\n\n**Default credentials (change immediately):** `admin` / `admin123`"
    ),
    lifespan=lifespan,
)

# Allow the browser frontend (default http://localhost:3000) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(forecast_router)
app.include_router(dispatch_router)


# ------------------------------------------------------------------ #
# Public routes (no auth required)                                     #
# ------------------------------------------------------------------ #

@app.get("/health", tags=["Meta"])
def health():
    """Phase 5 smoke-test gate — confirms the server is up."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["Meta"])
def root():
    return {
        "message": "Meridian Grid API is running.",
        "docs": "/docs",
        "endpoints": {
            "auth": ["POST /auth/login", "POST /auth/signup", "GET /auth/me", "PUT /auth/me/password"],
            "forecast": ["GET /forecast/{region}?horizon_hours=24"],
            "dispatch": ["GET /dispatch/plan?hours=24", "GET /dispatch/history"],
            "admin": ["POST /auth/register", "GET /auth/users", "DELETE /auth/users/{id}"],
            "meta": ["GET /health"],
        },
    }


# ------------------------------------------------------------------ #
# Data & Provenance routes                                             #
# ------------------------------------------------------------------ #

from db.models import CarbonSnapshot
from db.database import get_db
from fastapi import Query, Depends
from pathlib import Path
import pandas as pd

@app.get("/data/carbon-snapshots", tags=["Data"])
def get_carbon_snapshots(
    limit: int = Query(default=50, ge=1, le=200, description="Maximum snapshot records to return"),
    db: Session = Depends(get_db),
):
    """
    Return latest Electricity Maps carbon intensity readings.
    If the live SQLite table is empty (e.g. before initial poll),
    returns records seeded from the processed carbon intensity dataset.
    """
    snapshots = (
        db.query(CarbonSnapshot)
        .order_by(CarbonSnapshot.polled_at.desc())
        .limit(limit)
        .all()
    )
    if not snapshots:
        processed_path = Path(__file__).resolve().parent.parent / "data" / "processed" / "bangladesh_carbon_intensity_clean.parquet"
        if processed_path.exists():
            df = pd.read_parquet(processed_path)
            tail = df.tail(limit).iloc[::-1]
            results = []
            for idx, row in tail.iterrows():
                ts = str(idx) if isinstance(idx, (pd.Timestamp, str)) else str(row.get("datetime", ""))
                results.append({
                    "id": len(results) + 1,
                    "polled_at": ts,
                    "reading_datetime": ts,
                    "region": "BD",
                    "carbon_intensity_gco2eq_kwh": float(row.get("carbon_intensity_gco2eq_kwh", 650.0)),
                    "is_estimated": bool(row.get("is_estimated", True)),
                    "estimation_method": str(row.get("estimation_method", "MERRA-2 fallback / Electricity Maps")),
                    "source": "electricity_maps_archive",
                })
            return {"count": len(results), "snapshots": results}
        return {"count": 0, "snapshots": []}

    return {
        "count": len(snapshots),
        "snapshots": [
            {
                "id": s.id,
                "polled_at": s.polled_at.isoformat() if s.polled_at else None,
                "reading_datetime": s.reading_datetime.isoformat() if s.reading_datetime else None,
                "region": s.region,
                "carbon_intensity_gco2eq_kwh": s.carbon_intensity_gco2eq_kwh,
                "is_estimated": s.is_estimated,
                "estimation_method": s.estimation_method,
                "source": s.source,
            }
            for s in snapshots
        ],
    }
