"""Forecast regression tests. Direct execution retains the legacy training command."""
from pathlib import Path
import sys
if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

def test_router():
    from backend.forecasting.router import get_forecast
    import numpy as np
    response = get_forecast("bd", 24)
    arrays = response["forecast"]
    assert all(len(array) == 24 for array in arrays.values())
    lo, pred, hi = [np.array(arrays[key]) for key in ["solar_ghi_lower", "solar_ghi_w_m2", "solar_ghi_upper"]]
    assert np.isfinite(pred).all()
    assert (0 <= lo).all() and (lo <= pred).all() and (pred <= hi).all()
    for horizon in (1, 6, 12):
        short = get_forecast("bd", horizon)["forecast"]
        assert short["timestamps"] == arrays["timestamps"][:horizon]
        assert short["solar_ghi_w_m2"] == arrays["solar_ghi_w_m2"][:horizon]

if __name__ == "__main__":
    from backend.forecasting.train import main
    main()
