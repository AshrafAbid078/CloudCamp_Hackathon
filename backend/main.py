"""
Meridian Grid — Unified Backend Application
============================================
Single FastAPI app that mounts all service routers:
  - /auth/...          →  Auth: login, register, user management
  - /forecast/{region} →  Phase 2: Solar + grid-stress forecast
  - /dispatch/...      →  Phase 3: Dispatch / optimization + history
  - /copilot/...       →  Phase 5: Grounded AI Copilot & MCP Tools
  - /health            →  Phase 5: Smoke test gate

Run with:
    cd backend/
    uvicorn main:app --reload --port 8000

Then visit http://localhost:8000/docs for the interactive API explorer.
"""

import logging
import secrets
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import settings
from db.database import SessionLocal, init_db
from db.models import User, UserRole
from auth.utils import hash_password, verify_password
from auth.router import router as auth_router
from forecasting.router import router as forecast_router
from dispatch.api import router as dispatch_router
from showcase.router import router as showcase_router, _document as ensure_showcase_document
from poller.scheduler import start_scheduler, stop_scheduler
from agent.router import router as agent_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------ #
# Startup & Shutdown (lifespan)                                        #
# ------------------------------------------------------------------ #

def _seed_admin(db: Session) -> None:
    """Create a first-login admin credential for a fresh database."""
    old_admin = db.query(User).filter(User.username == "admin").first()
    if db.query(User).count() == 0 or (old_admin and verify_password("admin123", old_admin.hashed_password)):
        credential = settings.initial_admin_password or secrets.token_urlsafe(24)
        if not settings.initial_admin_password:
            path = Path(__file__).resolve().parent / ".initial-admin-credential"
            path.write_text(f"admin:{credential}\n", encoding="utf-8")
            logger.warning("Initial admin credential written to %s; change it at first sign-in.", path)
        if old_admin:
            old_admin.hashed_password = hash_password(credential)
            old_admin.must_change_password = True
        else:
            db.add(User(
                username="admin",
                hashed_password=hash_password(credential),
                role=UserRole.admin,
                must_change_password=True,
                is_active=True,
            ))
        db.commit()
        if settings.initial_admin_password:
            logger.warning("Initial admin credential loaded from environment; change it at first sign-in.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager — runs setup before the server
    accepts requests, and teardown after it stops.
    """
    # ---- Startup ----
    logger.info("Initializing Meridian Grid backend...")
    init_db()

    # Seed admin credential if needed
    db = SessionLocal()
    try:
        _seed_admin(db)
        ensure_showcase_document(db)
    finally:
        db.close()

    # Start Electricity Maps background poller if API key is present
    if settings.electricity_maps_api_key:
        logger.info(
            "Electricity Maps API key configured. Starting poller (interval: %dh, region: %s)...",
            settings.poll_interval_hours,
            settings.poll_region,
        )
        start_scheduler()
    else:
        logger.info("No Electricity Maps API key configured. Poller disabled; serving verified archive/cache.")

    logger.info("Meridian Grid backend ready.")
    yield

    # ---- Shutdown ----
    logger.info("Shutting down Meridian Grid backend...")
    if settings.electricity_maps_api_key:
        stop_scheduler()
    logger.info("Shutdown complete.")


# ------------------------------------------------------------------ #
# FastAPI App Instance                                                 #
# ------------------------------------------------------------------ #

app = FastAPI(
    title="Meridian Grid — Energy Orchestration Engine",
    description=(
        "Universal Flexible-Load Orchestration & Carbon-Aware Dispatch Engine.\n\n"
        "- **Auth**: JWT authentication and role-based access control.\n"
        "- **Forecasting**: Live Open-Meteo GHI & Electricity Maps carbon intensity.\n"
        "- **Dispatch**: PuLP MILP solver for flexible industrial processes and batteries.\n"
        "- **Copilot**: Grounded AI Agent using Google Gemini & Model Context Protocol (MCP) tools.\n"
        "- **Showcase**: Markdown-backed technical architecture documentation.\n"
    ),
    version="1.2.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------ #
# CORS Middleware                                                      #
# ------------------------------------------------------------------ #

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
app.include_router(showcase_router)
app.include_router(agent_router)


# ------------------------------------------------------------------ #
# Public routes (no auth required)                                     #
# ------------------------------------------------------------------ #

@app.get("/health", tags=["Meta"])
def health():
    """Report process availability and the active forecast/solver mode."""
    import pulp
    from forecasting.router import get_forecast
    from dispatch.api import _ALL_PROCESSES, _ALL_BATTERIES
    from dispatch.solver import solve_process_schedule
    forecast_ready = False
    solver_ready = False
    forecast_model = "unavailable"
    forecast_sources = None
    try:
        active = get_forecast("bd", 1)
        forecast_ready = len(active["forecast"]["timestamps"]) == 1
        forecast_model = active["accuracy"]["model"]
        forecast_sources = active.get("sources")
    except Exception:
        logger.exception("Forecast readiness check failed")
    try:
        solver_ready = solve_process_schedule(1, 0, 1, 1, [0.1], [500])["status"] == "Optimal"
    except Exception:
        logger.exception("Solver readiness check failed")
    assets_loaded = bool(_ALL_PROCESSES or _ALL_BATTERIES)
    return {
        "status": "available" if forecast_ready and solver_ready and assets_loaded and forecast_model == "OpenMeteoForecast" and forecast_sources and forecast_sources.get("carbon") == "electricity_maps_v4_forecast" else "degraded",
        "version": "1.2.0",
        "forecast_model": forecast_model,
        "forecast_sources": forecast_sources,
        "solver_version": pulp.__version__,
        "copilot_tools_ready": True,
        "gemini_configured": bool(settings.gemini_api_key.strip()),
        "mcp_transport": "separate local stdio server",
        "forecast_ready": forecast_ready,
        "solver_ready": solver_ready,
        "assets_loaded": assets_loaded,
    }


@app.get("/", tags=["Meta"])
def root():
    return {
        "message": "Meridian Grid API is running.",
        "docs": "/docs",
        "endpoints": {
            "auth": ["POST /auth/login", "POST /auth/signup", "GET /auth/me", "PUT /auth/me/password"],
            "forecast": ["GET /forecast/{region}?horizon_hours=24"],
            "dispatch": ["GET /dispatch/plan?hours=24", "GET /dispatch/history"],
            "copilot": ["POST /copilot/chat", "GET /copilot/tools"],
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
