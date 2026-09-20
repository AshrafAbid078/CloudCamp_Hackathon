"""
db/__init__.py — Database package
Exposes the session dependency and Base for use across the backend.
"""

# pyrefly: ignore [missing-import]
from .database import Base, SessionLocal, engine, get_db, init_db

__all__ = ["Base", "SessionLocal", "engine", "get_db", "init_db"]
