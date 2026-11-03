# conftest.py — pytest configuration for the backend package
#
# Problem this solves:
# When running `pytest` from backend/, test files import modules as e.g.
# `from dispatch.adapters import ...` — this requires `backend/` to be on
# sys.path. Python's pytest rootdir detection doesn't add it automatically
# unless a conftest.py is present at the root of the test tree.
#
# By placing this file in backend/, pytest adds backend/ to sys.path,
# so all absolute package imports (dispatch.*, forecasting.*) resolve
# correctly without any sys.path manipulation inside test files.

# Test collection must never load production credentials from the ignored .env.
import os
import tempfile
from pathlib import Path

_test_dir = tempfile.TemporaryDirectory(prefix="meridian-tests-")
os.environ.update({
    "TURSO_DATABASE_URL": "", "TURSO_AUTH_TOKEN": "", "GEMINI_API_KEY": "",
    "ELECTRICITY_MAPS_API_KEY": "", "LIVE_WEATHER_ENABLED": "false",
    "MERIDIAN_ENABLE_LIGHTGBM": "0",
    "SECRET_KEY": "isolated-test-signing-key-not-for-deployment-2026",
    "INITIAL_ADMIN_PASSWORD": "isolated-test-bootstrap-password-2026",
    "DB_PATH": str(Path(_test_dir.name) / "test.db"),
})


def pytest_sessionfinish(session, exitstatus):
    from db.database import engine
    engine.dispose()
    _test_dir.cleanup()
