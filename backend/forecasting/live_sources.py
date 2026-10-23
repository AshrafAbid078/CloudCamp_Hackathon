"""Current regional forecast inputs with bounded requests and explicit provenance."""

from __future__ import annotations

import logging
import math
import threading
import time
from datetime import datetime, timezone
from typing import Any

import requests

from config import settings

logger = logging.getLogger(__name__)
_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = threading.Lock()
_TIMEOUT = 8


def _cached(key: str, loader):
    now = time.monotonic()
    with _cache_lock:
        cached = _cache.get(key)
        if cached and now - cached[0] < max(1, settings.live_source_cache_minutes) * 60:
            return cached[1]
    try:
        value = loader()
    except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
        logger.warning("Live source %s unavailable: %s", key, exc)
        value = None
    with _cache_lock:
        _cache[key] = (now, value)
    return value


def _utc_hour(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return (parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)


def weather_forecast() -> dict[str, Any] | None:
    """Return 24 current hourly GHI values, or None when unusable."""
    if not settings.live_weather_enabled:
        return None

    def fetch():
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": settings.forecast_latitude,
                "longitude": settings.forecast_longitude,
                "hourly": "shortwave_radiation,cloud_cover,temperature_2m",
                "forecast_hours": 24,
                "timezone": "UTC",
            },
            timeout=_TIMEOUT,
        )
        response.raise_for_status()
        hourly = response.json()["hourly"]
        times = [_utc_hour(item) for item in hourly["time"]]
        ghi = [float(item) for item in hourly["shortwave_radiation"]]
        if len(times) != 24 or len(ghi) != 24 or not all(math.isfinite(item) and item >= 0 for item in ghi):
            raise ValueError("Incomplete or invalid weather forecast")
        if abs((times[0] - datetime.now(timezone.utc)).total_seconds()) > 2 * 3600:
            raise ValueError("Weather forecast is stale")
        if any((times[i + 1] - times[i]).total_seconds() != 3600 for i in range(23)):
            raise ValueError("Weather forecast has non-hourly timestamps")
        return {"timestamps": [item.isoformat() for item in times], "ghi": ghi,
                "fetched_at": datetime.now(timezone.utc).isoformat()}

    return _cached(f"weather:{settings.forecast_latitude}:{settings.forecast_longitude}", fetch)


def carbon_forecast(timestamps: list[str]) -> dict[str, Any] | None:
    """Use Electricity Maps v4 forecast when configured and all slots align."""
    if not settings.electricity_maps_api_key:
        return None

    def fetch():
        response = requests.get(
            "https://api.electricitymaps.com/v4/carbon-intensity/forecast",
            headers={"auth-token": settings.electricity_maps_api_key},
            params={"zone": settings.poll_region.upper(), "horizonHours": 24},
            timeout=_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()
        values = {}
        for item in payload["forecast"]:
            value = float(item["carbonIntensity"])
            if math.isfinite(value) and value >= 0:
                values[_utc_hour(item["datetime"])] = value
        return {"values": values, "updated_at": payload.get("updatedAt")}

    data = _cached(f"carbon:{settings.poll_region.upper()}", fetch)
    if not data:
        return None
    hours = [_utc_hour(item) for item in timestamps]
    if any(hour not in data["values"] for hour in hours):
        logger.warning("Electricity Maps forecast does not cover all weather slots")
        return None
    return {"values": [data["values"][hour] for hour in hours],
            "updated_at": data["updated_at"]}
