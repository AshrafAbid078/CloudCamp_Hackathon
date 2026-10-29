"""
db/database.py — SQLAlchemy Engine & Session
=============================================
SQLite-compatible persistence layer for Meridian Grid.

Tables created here (via init_db):
  - users          → auth.User
  - dispatch_runs  → DispatchRun history
  - carbon_snapshots → auto-polled Electricity Maps data

Local development uses backend/meridian.db; hosted deployments can use Turso.
"""

from pathlib import Path
from typing import Generator
from urllib.parse import urlsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

# ------------------------------------------------------------------ #
# Engine setup                                                         #
# ------------------------------------------------------------------ #

def _engine_config() -> tuple[str, dict]:
    """Select the hosted Turso dialect or the existing local SQLite file."""
    if settings.turso_database_url or settings.turso_auth_token:
        if not settings.turso_database_url or not settings.turso_auth_token:
            raise ValueError("Set both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.")
        parsed = urlsplit(settings.turso_database_url)
        if parsed.scheme != "libsql" or not parsed.netloc or parsed.path or parsed.query or parsed.fragment:
            raise ValueError("TURSO_DATABASE_URL must be a libsql:// host URL without a path or query.")
        # The libsql SQLAlchemy dialect maps a secure URL to HTTPS.
        url = f"sqlite+libsql://{parsed.netloc}?secure=true"
        return url, {"connect_args": {"auth_token": settings.turso_auth_token}}

    backend_dir = Path(__file__).resolve().parents[1]
    db_file = Path(settings.db_path)
    if not db_file.is_absolute():
        db_file = backend_dir / db_file
    # The scheduler writes while requests read. Wait briefly for SQLite locks.
    return f"sqlite:///{db_file}", {"connect_args": {"check_same_thread": False, "timeout": 30}}


DATABASE_URL, _ENGINE_OPTIONS = _engine_config()
engine = create_engine(DATABASE_URL, echo=False, **_ENGINE_OPTIONS)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ------------------------------------------------------------------ #
# Declarative base                                                     #
# ------------------------------------------------------------------ #

class Base(DeclarativeBase):
    """All ORM models inherit from this base."""
    pass


# ------------------------------------------------------------------ #
# Session dependency for FastAPI (use with Depends)                    #
# ------------------------------------------------------------------ #

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a DB session per request and
    guarantees cleanup even if the handler raises an exception.

    Usage:
        @router.get("/example")
        def handler(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------------------------------------------ #
# Table creation                                                       #
# ------------------------------------------------------------------ #

def init_db() -> None:
    """
    Create all tables that don't yet exist.
    Called once at server startup (via lifespan in main.py).
    Safe to call repeatedly — does NOT drop existing data.
    """
    # Import models here so SQLAlchemy registers them on Base.metadata
    # before create_all() is called.
    import db.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
