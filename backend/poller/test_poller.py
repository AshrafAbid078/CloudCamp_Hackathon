from datetime import datetime, timezone
from threading import Event

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.database import Base
from backend.db.models import CarbonSnapshot
from backend.poller import electricity_maps, scheduler


@pytest.mark.parametrize("value", [-1, float("inf"), float("-inf"), float("nan"), None, True, "invalid"])
def test_invalid_carbon_never_persisted(value, monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(electricity_maps, "SessionLocal", factory)
    monkeypatch.setattr(electricity_maps.settings, "electricity_maps_api_key", "test")
    class Response:
        def raise_for_status(self): pass
        def json(self):
            return {"zone": "BD", "carbonIntensity": value, "datetime": datetime.now(timezone.utc).isoformat()}
    monkeypatch.setattr(electricity_maps.requests, "get", lambda *a, **kw: Response())
    assert electricity_maps.poll_carbon_intensity() is None
    with factory() as db:
        assert db.query(CarbonSnapshot).count() == 0
    engine.dispose()


def test_scheduler_executes_after_each_restart(monkeypatch):
    executed = Event()
    monkeypatch.setattr(scheduler, "_poll_job", executed.set)
    scheduler.stop_scheduler()
    try:
        for _ in range(2):
            executed.clear()
            scheduler.start_scheduler()
            original = scheduler._scheduler
            scheduler.start_scheduler()
            assert scheduler._scheduler is original
            assert executed.wait(timeout=3)
            scheduler.stop_scheduler()
            assert scheduler._scheduler is None
    finally:
        scheduler.stop_scheduler()
