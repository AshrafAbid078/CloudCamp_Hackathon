from unittest.mock import Mock

from poller import electricity_maps


def test_v4_latest_reading_is_persisted(monkeypatch):
    response = Mock()
    response.json.return_value = {
        "zone": "BD", "carbonIntensity": 540,
        "datetime": "2026-10-23T09:00:00Z", "isEstimated": True,
        "estimationMethod": "FORECASTS_HIERARCHY",
    }
    request = Mock(return_value=response)
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    monkeypatch.setattr(electricity_maps.settings, "electricity_maps_api_key", "test-key")
    monkeypatch.setattr(electricity_maps.requests, "get", request)
    monkeypatch.setattr(electricity_maps, "SessionLocal", lambda: db)

    result = electricity_maps.poll_carbon_intensity("BD")
    assert result.source == "electricity_maps_api_v4"
    assert result.carbon_intensity_gco2eq_kwh == 540
    assert result.is_estimated is True
    assert request.call_args.args[0] == "https://api.electricitymaps.com/v4/carbon-intensity/latest"
    db.commit.assert_called_once()
