"""
DB layer tests — in-memory SQLite, no network, no files touched.

Covers:
  - UTCDateTime round-trips as timezone-aware UTC
  - Poller does not store the same upstream reading twice
  - Seeded admin creation only happens on an empty users table
"""

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.database import Base
from db.models import CarbonSnapshot, DispatchRun, User, UserRole


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


def test_datetimes_round_trip_as_utc(session_factory):
    db = session_factory()
    try:
        run = DispatchRun(region="bd", hours=24)
        db.add(run)
        db.commit()
        db.expire_all()

        loaded = db.query(DispatchRun).first()
        assert loaded.timestamp.tzinfo is not None
        assert loaded.timestamp.utcoffset().total_seconds() == 0
        # Serialized form must carry the offset so browsers don't treat it as local time.
        assert loaded.timestamp.isoformat().endswith("+00:00")
    finally:
        db.close()


def test_carbon_snapshot_reading_datetime_is_utc(session_factory):
    db = session_factory()
    try:
        reading = datetime(2024, 1, 15, 12, 0, tzinfo=timezone.utc)
        db.add(
            CarbonSnapshot(
                region="BD",
                reading_datetime=reading,
                carbon_intensity_gco2eq_kwh=574.0,
            )
        )
        db.commit()
        db.expire_all()

        loaded = db.query(CarbonSnapshot).first()
        assert loaded.reading_datetime == reading
        assert loaded.polled_at.tzinfo is not None
    finally:
        db.close()


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def test_poller_skips_duplicate_reading(session_factory, monkeypatch):
    from poller import electricity_maps

    payload = {
        "zone": "BD",
        "carbonIntensity": 574,
        "datetime": "2024-01-15T12:00:00.000Z",
        "isEstimated": True,
        "estimationMethod": "TIME_SLICER_AVERAGE",
    }

    monkeypatch.setattr(electricity_maps, "SessionLocal", session_factory)
    monkeypatch.setattr(electricity_maps.settings, "electricity_maps_api_key", "test-key")
    monkeypatch.setattr(
        electricity_maps.requests,
        "get",
        lambda *a, **kw: _FakeResponse(payload),
    )

    first = electricity_maps.poll_carbon_intensity("BD")
    second = electricity_maps.poll_carbon_intensity("BD")

    assert first is not None
    assert second is not None
    assert second.id == first.id

    db = session_factory()
    try:
        assert db.query(CarbonSnapshot).count() == 1
    finally:
        db.close()


def test_seed_admin_only_when_empty(session_factory):
    import main

    db = session_factory()
    try:
        main._seed_admin(db)
        assert db.query(User).count() == 1
        admin = db.query(User).first()
        assert admin.role == UserRole.admin
        assert admin.must_change_password is True

        # Second call must not create another user.
        main._seed_admin(db)
        assert db.query(User).count() == 1
    finally:
        db.close()
