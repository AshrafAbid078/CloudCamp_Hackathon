from dataclasses import dataclass
from typing import Protocol


# ============================================================
# COMMON ASSET ADAPTER INTERFACE
# ============================================================

class AssetAdapter(Protocol):
    """
    Common interface for all dispatchable assets.

    Every asset adapter must provide:
    - asset_id
    - asset_type
    - power information
    """

    asset_id: str
    asset_type: str

    def get_constraints(self) -> dict:
        """
        Return the operating constraints of the asset.
        """
        ...


# ============================================================
# INDUSTRIAL PROCESS ADAPTER
# ============================================================

@dataclass
class IndustrialProcessAdapter:
    """
    Adapter for a flexible industrial process.

    Required fields:
    - asset_id
    - name
    - power_kw
    - earliest_start
    - deadline
    - duration
    """

    asset_id: str
    name: str
    power_kw: float
    earliest_start: int
    deadline: int
    duration: int

    asset_type: str = "industrial"

    def get_constraints(self) -> dict:
        """
        Return the constraints required by the optimizer.
        """

        return {
            "earliest_start": self.earliest_start,
            "deadline": self.deadline,
            "duration": self.duration,
            "power_kw": self.power_kw,
        }


# ============================================================
# BATTERY ADAPTER
# ============================================================

@dataclass
class BatteryAdapter:
    """
    Adapter for a battery energy storage system.

    Required fields:
    - asset_id
    - capacity_kwh
    - current_soc   (state of charge, 0–1)
    - charge_rate_kw
    - discharge_rate_kw
    """

    asset_id: str
    capacity_kwh: float
    current_soc: float
    charge_rate_kw: float
    discharge_rate_kw: float

    asset_type: str = "battery"

    def get_constraints(self) -> dict:
        """
        Return the constraints required by the optimizer.
        """

        return {
            "capacity_kwh": self.capacity_kwh,
            "current_soc": self.current_soc,
            "charge_rate_kw": self.charge_rate_kw,
            "discharge_rate_kw": self.discharge_rate_kw,
        }


# ============================================================
# EV FLEET ADAPTER — STUB (NotImplementedError)
# MVP scope: documented as architecture-ready, not yet built.
# Wiring to real/synthetic EV data is a Phase 6 stretch goal.
# ============================================================

class EVFleetAdapter:
    """
    Placeholder for future EV fleet dispatch support.

    EV fleet optimization is not implemented in the MVP.
    Stub is present so the import surface and architecture are
    visible, per system-arch.md §2.3.
    """

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "EVFleetAdapter is a Phase-6 stretch goal and is not "
            "implemented in the MVP."
        )

    def get_constraints(self) -> dict:
        raise NotImplementedError(
            "EVFleetAdapter is a Phase-6 stretch goal."
        )


# ============================================================
# EU REGION ADAPTER — STUB (NotImplementedError)
# MVP scope: BD (Bangladesh) only. EU adapter is documented
# as architecture-ready. Wire to OPSD data in Phase 6 if
# time_series_*_singleindex.csv is confirmed as OPSD data.
# ============================================================

class EUAdapter:
    """
    Placeholder for a European grid region adapter.

    Not implemented in the MVP. Architecture-ready stub per
    system-arch.md §2.1. Candidate data source: OPSD
    (time_series_*_singleindex.csv — confirm region first).
    """

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "EUAdapter is a Phase-6 stretch goal. "
            "Live region is 'bd' (Bangladesh)."
        )

    def get_constraints(self) -> dict:
        raise NotImplementedError(
            "EUAdapter is a Phase-6 stretch goal."
        )


# ============================================================
# US REGION ADAPTER — STUB (NotImplementedError)
# MVP scope: BD (Bangladesh) only. US adapter is documented
# as architecture-ready for future expansion.
# ============================================================

class USAdapter:
    """
    Placeholder for a US grid region adapter.

    Not implemented in the MVP. Architecture-ready stub per
    system-arch.md §2.1.
    """

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "USAdapter is a Phase-6 stretch goal. "
            "Live region is 'bd' (Bangladesh)."
        )

    def get_constraints(self) -> dict:
        raise NotImplementedError(
            "USAdapter is a Phase-6 stretch goal."
        )