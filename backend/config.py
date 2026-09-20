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
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ------------------------------------------------------------------ #
    # Security                                                             #
    # ------------------------------------------------------------------ #
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_32_CHAR_RANDOM_STRING"
    """JWT signing key. Must be changed before any public deployment."""

    algorithm: str = "HS256"
    """JWT signing algorithm."""

    access_token_expire_minutes: int = 60
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

    poll_interval_hours: int = 24
    """How often to poll the Electricity Maps API (default: once per day)."""

    poll_region: str = "BD"
    """ISO 3166-1 alpha-2 zone code used by Electricity Maps (Bangladesh = BD)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Singleton — import this everywhere
settings = Settings()
