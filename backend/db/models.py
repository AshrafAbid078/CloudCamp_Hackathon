"""
db/models.py — ORM Table Definitions
======================================
Three tables:

  users              — registered users with role-based access
  dispatch_runs      — history of every /dispatch/plan call
  carbon_snapshots   — auto-polled Electricity Maps readings (grows daily)
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
)
from sqlalchemy.types import TypeDecorator

from db.database import Base


class UTCDateTime(TypeDecorator):
    """
    Timezone-aware UTC datetime for SQLite.

    SQLite has no native timezone support: values are stored as naive
    timestamps and come back without tzinfo, so isoformat() would omit the
    UTC offset and a browser would parse it as local time. This type stores
    everything as UTC and re-attaches tzinfo=UTC when reading.
    """
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)


# ------------------------------------------------------------------ #
# Role enum                                                            #
# ------------------------------------------------------------------ #

class UserRole(str, enum.Enum):
    """
    Three-tier role hierarchy:

    admin            → full access: manage users, view all history, all endpoints
    grid_operator    → view all forecasts (any region), dispatch history, run plans
    facility_manager → run dispatch plans, view BD forecast, own profile only
    """
    admin = "admin"
    grid_operator = "grid_operator"
    facility_manager = "facility_manager"


# ------------------------------------------------------------------ #
# User table                                                           #
# ------------------------------------------------------------------ #

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.facility_manager)

    must_change_password = Column(Boolean, default=False, nullable=False)
    """
    Set True for the seeded admin account so the first real operator
    is forced to pick their own password via PUT /auth/me/password.
    """

    is_active = Column(Boolean, default=True, nullable=False)
    """Soft-delete: set False instead of removing the row."""

    created_at = Column(
        UTCDateTime(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} role={self.role}>"


# ------------------------------------------------------------------ #
# Dispatch run history                                                  #
# ------------------------------------------------------------------ #

class DispatchRun(Base):
    """
    One row written per successful GET /dispatch/plan call.
    Enables the dashboard to show historical KPI trends.
    """
    __tablename__ = "dispatch_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(
        UTCDateTime(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    region = Column(String(8), nullable=False, default="bd")
    hours = Column(Integer, nullable=False)

    # Asset counts
    industrial_count = Column(Integer, nullable=False, default=0)
    battery_count = Column(Integer, nullable=False, default=0)

    # KPI deltas (system totals from planner.dispatch_plan())
    cost_saved_usd = Column(Float, nullable=True)
    co2_saved_kg = Column(Float, nullable=True)
    peak_shaved_kw = Column(Float, nullable=True)

    # Which forecast model was active during this run
    model_used = Column(String(64), nullable=True)

    # Who triggered this run
    triggered_by = Column(String(64), nullable=True)

    def __repr__(self) -> str:
        return (
            f"<DispatchRun id={self.id} ts={self.timestamp} "
            f"region={self.region} hours={self.hours}>"
        )


# ------------------------------------------------------------------ #
# Carbon snapshots (Electricity Maps auto-poll)                        #
# ------------------------------------------------------------------ #

class CarbonSnapshot(Base):
    """
    One row per Electricity Maps API poll (default: daily).
    The forecasting service will eventually use this growing table
    instead of the static 1-day parquet file.
    """
    __tablename__ = "carbon_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    # When this reading was polled / when Electricity Maps says it applies
    polled_at = Column(
        UTCDateTime(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    reading_datetime = Column(UTCDateTime(), nullable=True)

    region = Column(String(8), nullable=False, default="BD")
    carbon_intensity_gco2eq_kwh = Column(Float, nullable=False)
    is_estimated = Column(Boolean, default=True, nullable=False)
    estimation_method = Column(String(128), nullable=True)
    source = Column(String(64), nullable=True, default="electricity_maps_api")

    def __repr__(self) -> str:
        return (
            f"<CarbonSnapshot id={self.id} region={self.region} "
            f"ci={self.carbon_intensity_gco2eq_kwh:.1f} polled={self.polled_at}>"
        )
