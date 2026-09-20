"""
poller/scheduler.py — APScheduler Background Job Manager
=========================================================
Registers the Electricity Maps poller as a recurring background job
using APScheduler's AsyncIOScheduler.

Integration with FastAPI lifespan (in main.py):

    from poller.scheduler import start_scheduler, stop_scheduler

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        start_scheduler()
        yield
        stop_scheduler()

The job interval is controlled by POLL_INTERVAL_HOURS in .env (default: 24).
The first poll runs immediately on startup (next_run_time=datetime.now()).
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import settings
from poller.electricity_maps import poll_carbon_intensity

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler(timezone="UTC")


def _poll_job() -> None:
    """Wrapper so APScheduler can call the poller as a plain function."""
    logger.info("[Scheduler] Running scheduled carbon intensity poll...")
    result = poll_carbon_intensity()
    if result is None:
        logger.info("[Scheduler] Poll returned no data (see warnings above).")
    else:
        logger.info(
            "[Scheduler] Poll complete — snapshot id=%s ci=%.1f",
            result.id,
            result.carbon_intensity_gco2eq_kwh,
        )


def start_scheduler() -> None:
    """
    Start the background scheduler and register the poller job.
    Safe to call multiple times — checks if already running first.
    """
    if _scheduler.running:
        logger.debug("[Scheduler] Already running — skipping start.")
        return

    _scheduler.add_job(
        _poll_job,
        trigger=IntervalTrigger(hours=settings.poll_interval_hours, timezone="UTC"),
        id="carbon_intensity_poller",
        name="Electricity Maps Carbon Intensity Poller",
        # Run once immediately on startup so DB has data right away
        next_run_time=datetime.now(timezone.utc),
        replace_existing=True,
        misfire_grace_time=300,  # 5 min grace window if server was busy
    )

    _scheduler.start()
    logger.info(
        "[Scheduler] Started. Carbon poller will run every %d hour(s). "
        "First poll: immediately.",
        settings.poll_interval_hours,
    )


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler on server exit."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Stopped.")
