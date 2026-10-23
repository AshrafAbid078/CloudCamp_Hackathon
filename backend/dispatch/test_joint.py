import pytest

from dispatch.adapters import IndustrialProcessAdapter
from dispatch.joint import solve_joint_schedule


def test_shared_feeder_limit_prevents_coincident_processes():
    processes = [
        IndustrialProcessAdapter("a", "A", 10, 0, 3, 1),
        IndustrialProcessAdapter("b", "B", 10, 0, 3, 1),
    ]
    result = solve_joint_schedule(processes, [], [1, 2, 3], [0, 0, 0], feeder_capacity_kw=10)
    assert result["process_hours"]["a"] != result["process_hours"]["b"]
    assert max(result["grid_import_kw"]) <= 10

    with pytest.raises(ValueError, match="No feasible plan"):
        solve_joint_schedule(processes, [], [1, 2, 3], [0, 0, 0], feeder_capacity_kw=5)


def test_pv_offsets_only_available_hourly_generation():
    process = IndustrialProcessAdapter("a", "A", 10, 0, 1, 1)
    result = solve_joint_schedule([process], [], [1], [0], pv_generation_kw=[6])
    assert result["grid_import_kw"] == [4]
