from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

from forecasting import live_sources, router


def test_open_meteo_hourly_forecast_is_current(monkeypatch):
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    hours = [(now + timedelta(hours=index)).strftime("%Y-%m-%dT%H:%M") for index in range(24)]
    response = Mock()
    response.json.return_value = {"hourly": {"time": hours, "shortwave_radiation": [100.0] * 24}}
    monkeypatch.setattr(live_sources.requests, "get", lambda *args, **kwargs: response)
    monkeypatch.setattr(live_sources.settings, "live_weather_enabled", True)
    live_sources._cache.clear()
    forecast = live_sources.weather_forecast()
    assert len(forecast["timestamps"]) == 24
    assert forecast["ghi"][0] == 100
    assert forecast["timestamps"][0].endswith("+00:00")


def test_electricity_maps_carbon_requires_every_matching_hour(monkeypatch):
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    hours = [(now + timedelta(hours=index)).isoformat() for index in range(2)]
    response = Mock()
    response.json.return_value = {"forecast": [
        {"datetime": hours[0], "carbonIntensity": 500},
        {"datetime": hours[1], "carbonIntensity": 450},
    ], "updatedAt": now.isoformat()}
    monkeypatch.setattr(live_sources.requests, "get", lambda *args, **kwargs: response)
    monkeypatch.setattr(live_sources.settings, "electricity_maps_api_key", "test-key")
    live_sources._cache.clear()
    result = live_sources.carbon_forecast(hours)
    assert result["values"] == [500, 450]
    assert live_sources.carbon_forecast(hours + [(now + timedelta(hours=2)).isoformat()]) is None


def test_current_weather_with_archived_carbon_is_labelled(monkeypatch):
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    monkeypatch.setattr(router, "weather_forecast", lambda: {
        "timestamps": [(now + timedelta(hours=index)).isoformat() for index in range(24)],
        "ghi": [100.0] * 24, "fetched_at": now.isoformat(),
    })
    monkeypatch.setattr(router, "carbon_forecast", lambda timestamps: None)
    monkeypatch.setattr(router, "_recent_carbon_snapshot", lambda: None)
    result = router.get_forecast("bd", 6)
    assert result["accuracy"]["model"] == "OpenMeteoForecast"
    assert result["sources"]["solar"] == "open_meteo_weather_forecast"
    assert result["sources"]["carbon"] == "archived_constant"
    assert result["sources"]["fallback"] is True
    assert len(result["forecast"]["timestamps"]) == 6


def test_weather_failure_falls_back_to_dated_archive(monkeypatch):
    monkeypatch.setattr(router, "weather_forecast", lambda: None)
    result = router.get_forecast("bd", 1)
    assert result["sources"]["solar"] == "archived_2020"
    assert result["sources"]["fallback"] is True
    assert result["forecast"]["timestamps"][0].startswith("2020-")
