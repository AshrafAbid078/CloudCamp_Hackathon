"""
db/database.py — SQLAlchemy Engine & Session
=============================================
SQLite-backed persistence layer for Meridian Grid.

Tables created here (via init_db):
  - users          → auth.User
  - dispatch_runs  → DispatchRun history
  - carbon_snapshots → auto-polled Electricity Maps data

The DB file lives at backend/meridian.db (configurable via DB_PATH in .env).
"""

from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

# ------------------------------------------------------------------ #
# Engine setup                                                         #
# ------------------------------------------------------------------ #

# Resolve the DB file path relative to the backend/ directory so it
# works regardless of where uvicorn is launched from.
_BACKEND_DIR = Path(__file__).resolve().parents[1]   # backend/
_DB_FILE = Path(settings.db_path)

if not _DB_FILE.is_absolute():
    _DB_FILE = _BACKEND_DIR / _DB_FILE

DATABASE_URL = f"sqlite:///{_DB_FILE}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite + FastAPI
    echo=False,                                  # set True to log SQL statements
)

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
