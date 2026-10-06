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
            "auth": ["POST /auth/login", "GET /auth/me", "PUT /auth/me/password"],
            "forecast": ["GET /forecast/{region}?horizon_hours=24"],
            "dispatch": ["GET /dispatch/plan?hours=24", "GET /dispatch/history"],
            "admin": ["POST /auth/register", "GET /auth/users", "DELETE /auth/users/{id}"],
            "meta": ["GET /health"],
        },
    }
