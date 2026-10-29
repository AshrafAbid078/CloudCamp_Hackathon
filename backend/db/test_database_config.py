import pytest

from config import settings
from db.database import _engine_config


def test_local_database_still_uses_sqlite(monkeypatch):
    monkeypatch.setattr(settings, "turso_database_url", "")
    monkeypatch.setattr(settings, "turso_auth_token", "")
    url, options = _engine_config()
    assert url.startswith("sqlite:///")
    assert options["connect_args"]["check_same_thread"] is False


def test_turso_connection_keeps_token_out_of_url(monkeypatch):
    monkeypatch.setattr(settings, "turso_database_url", "libsql://example.turso.io")
    monkeypatch.setattr(settings, "turso_auth_token", "private-token")
    url, options = _engine_config()
    assert url == "sqlite+libsql://example.turso.io?secure=true"
    assert options == {"connect_args": {"auth_token": "private-token"}}
    assert "private-token" not in url


@pytest.mark.parametrize(
    ("database_url", "token"),
    [("libsql://example.turso.io", ""), ("", "private-token"), ("https://example.turso.io", "private-token")],
)
def test_turso_configuration_rejects_missing_or_invalid_values(monkeypatch, database_url, token):
    monkeypatch.setattr(settings, "turso_database_url", database_url)
    monkeypatch.setattr(settings, "turso_auth_token", token)
    with pytest.raises(ValueError):
        _engine_config()
