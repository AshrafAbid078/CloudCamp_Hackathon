"""
config.py — Meridian Grid Backend Settings
==========================================
All runtime configuration is loaded from environment variables (or a .env file).
Import `settings` anywhere in the backend — never hard-code secrets or paths.

Usage:
    from config import settings
    key = settings.electricity_maps_api_key
"""

from pathlib import Path
import secrets
import warnings
from typing import Literal
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ and the repository root. Both are searched for a .env file so the
# documented `cp .env.example .env` (repo root) works no matter which
# directory uvicorn/pytest is launched from. backend/.env overrides root .env.
_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent


class Settings(BaseSettings):
    # ------------------------------------------------------------------ #
    # Security                                                             #
    # ------------------------------------------------------------------ #
    environment: Literal["development", "production"] = "development"
    secret_key: str = ""
    """Persistent JWT key; development generates an ephemeral key if omitted."""
    bootstrap_admin_password: str = ""

    algorithm: Literal["HS256"] = "HS256"
    """JWT signing algorithm."""

    access_token_expire_minutes: int = Field(default=60, gt=0)
    """JWT lifetime in minutes (default: 1 hour)."""

    # ------------------------------------------------------------------ #
    # Database                                                             #
    # ------------------------------------------------------------------ #
    db_path: str = "meridian.db"
    """
    SQLite database file path, relative to the backend/ directory.
    An absolute path is also accepted.
    """

    # ------------------------------------------------------------------ #
    # Electricity Maps poller                                              #
    # ------------------------------------------------------------------ #
    electricity_maps_api_key: str = ""
    """
    Electricity Maps REST API key.
    Get a free key at https://app.electricitymaps.com/
    Leave empty to disable the poller (server will still start fine).
    """

    poll_interval_hours: int = Field(default=24, gt=0)
    """How often to poll the Electricity Maps API (default: once per day)."""

    poll_region: str = "BD"
    """ISO 3166-1 alpha-2 zone code used by Electricity Maps (Bangladesh = BD)."""

    carbon_max_age_hours: float = Field(default=48, gt=0, allow_inf_nan=False)
    """Maximum age of a live carbon reading before static fallback is used."""

    # ------------------------------------------------------------------ #
    # CORS                                                                 #
    # ------------------------------------------------------------------ #
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    """Comma-separated browser origins allowed to call the API (the frontend)."""

    model_config = SettingsConfigDict(
        env_file=(str(_PROJECT_ROOT / ".env"), str(_BACKEND_DIR / ".env")),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_security(self):
        if not self.secret_key or self.secret_key.startswith("CHANGE_ME"):
            if self.environment == "production":
                raise ValueError("Production requires an explicitly configured SECRET_KEY.")
            self.secret_key = secrets.token_urlsafe(48)
            warnings.warn("Using an ephemeral development JWT key; configure SECRET_KEY to retain logins across restarts.", UserWarning)
        elif len(self.secret_key.encode("utf-8")) < 32:
            raise ValueError("SECRET_KEY must contain at least 32 bytes.")
        return self


# Singleton — import this everywhere
settings = Settings()
