"""
poller/electricity_maps.py — Electricity Maps Live Carbon Intensity Poller
===========================================================================
Fetches the latest carbon intensity for a given zone from the
Electricity Maps REST API v3 and persists the reading to the
`carbon_snapshots` DB table.

This function is called by the APScheduler job in poller/scheduler.py
on a configurable interval (default: every 24 hours).

Graceful degradation:
  - If ELECTRICITY_MAPS_API_KEY is empty → logs warning, returns None (no crash).
  - If the API request fails (network error, rate limit, etc.) → logs warning, returns None.
  - The server will start and serve normally regardless.

API reference:
  https://static.electricitymaps.com/api/docs/index.html
  GET /v3/carbon-intensity/latest?zone=BD
  Header: auth-token: <key>
"""

import logging
import math
from datetime import datetime, timezone

import requests

from backend.config import settings
from backend.db.database import SessionLocal
from backend.db.models import CarbonSnapshot

logger = logging.getLogger(__name__)

_API_BASE = "https://api.electricitymap.org/v3"
_TIMEOUT_SEC = 10


def poll_carbon_intensity(region: str | None = None) -> CarbonSnapshot | None:
    """
    Fetch the latest carbon intensity for *region* from Electricity Maps
    and insert a new CarbonSnapshot row into the database.

    Args:
        region: Electricity Maps zone code (e.g. "BD"). Defaults to
                settings.poll_region from .env.

    Returns:
        The newly inserted CarbonSnapshot ORM object, or None if the
        poll was skipped (missing API key) or failed (network/API error).
    """
    zone = (region or settings.poll_region).upper()

    # ---- Guard: API key required -----------------------------------------
    if not settings.electricity_maps_api_key:
        logger.warning(
            "[Poller] ELECTRICITY_MAPS_API_KEY is not set. "
            "Skipping carbon intensity poll for zone '%s'. "
            "Add the key to .env to enable daily auto-polling.",
            zone,
        )
        return None

    # ---- Fetch from Electricity Maps API ---------------------------------
    url = f"{_API_BASE}/carbon-intensity/latest"
    headers = {"auth-token": settings.electricity_maps_api_key}
    params = {"zone": zone}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=_TIMEOUT_SEC)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout:
        logger.warning("[Poller] Request to Electricity Maps timed out (zone=%s).", zone)
        return None
    except requests.exceptions.HTTPError as exc:
        logger.warning(
            "[Poller] Electricity Maps API returned HTTP %s for zone=%s: %s",
            exc.response.status_code,
            zone,
            exc.response.text[:200],
        )
        return None
    except requests.exceptions.RequestException as exc:
        logger.warning("[Poller] Network error polling Electricity Maps: %s", exc)
        return None
    except ValueError:
        logger.warning("[Poller] Upstream response is not valid JSON.")
        return None

    # ---- Parse response --------------------------------------------------
    # Example v3 response:
    # {
    #   "zone": "BD",
    #   "carbonIntensity": 574,
    #   "datetime": "2024-01-15T12:00:00.000Z",
    #   "updatedAt": "2024-01-15T12:45:00.000Z",
    #   "isEstimated": true,
    #   "estimationMethod": "TIME_SLICER_AVERAGE"
    # }
    try:
        if not isinstance(data, dict) or data.get("zone", zone) != zone:
            raise ValueError("Unexpected response zone or payload")
        if isinstance(data["carbonIntensity"], bool):
            raise ValueError("Carbon intensity must be numeric")
        carbon_intensity = float(data["carbonIntensity"])
        if not math.isfinite(carbon_intensity) or carbon_intensity < 0:
            raise ValueError("Carbon intensity must be finite and nonnegative")
        is_estimated = data.get("isEstimated", True)
        if type(is_estimated) is not bool:
            raise ValueError("isEstimated must be a boolean")
        estimation_method: str | None = data.get("estimationMethod")

        reading_str = data["datetime"]
        if not isinstance(reading_str, str):
            raise ValueError("Missing reading timestamp")
        reading_dt = datetime.fromisoformat(reading_str.replace("Z", "+00:00"))
        if reading_dt.tzinfo is None or reading_dt > datetime.now(timezone.utc):
            raise ValueError("Reading timestamp must be timezone-aware and not in the future")
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning("[Poller] Failed to parse Electricity Maps response: %s | data=%s", exc, data)
        return None

    # ---- Persist to DB ---------------------------------------------------
    db = SessionLocal()
    try:
        # The scheduler polls immediately on every server start, so avoid
        # storing the same upstream reading twice after restarts.
        if reading_dt is not None:
            existing = (
                db.query(CarbonSnapshot)
                .filter(
                    CarbonSnapshot.region == zone,
                    CarbonSnapshot.reading_datetime == reading_dt,
                )
                .first()
            )
            if existing is not None:
                logger.info(
                    "[Poller] Reading for zone=%s at %s already stored (id=%s) — skipping insert.",
                    zone,
                    reading_dt,
                    existing.id,
                )
                return existing

        snapshot = CarbonSnapshot(
            polled_at=datetime.now(timezone.utc),
            reading_datetime=reading_dt,
            region=zone,
            carbon_intensity_gco2eq_kwh=carbon_intensity,
            is_estimated=is_estimated,
            estimation_method=estimation_method,
            source="electricity_maps_api_v3",
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        logger.info(
            "[Poller] CarbonSnapshot saved — zone=%s ci=%.1f estimated=%s id=%s",
            zone,
            carbon_intensity,
            is_estimated,
            snapshot.id,
        )
        return snapshot
    except Exception as exc:
        db.rollback()
        logger.error("[Poller] DB write failed: %s", exc)
        return None
    finally:
        db.close()
