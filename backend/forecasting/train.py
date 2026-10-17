"""Reproducible, purged 24h-ahead evaluation, independent of the serving app."""
from pathlib import Path
import sys
if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import argparse
from datetime import datetime, timezone
import json
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
from backend.forecasting.features import build_features, extract_target, chronological_split, physical_solar
from backend.forecasting.models.baseline import PersistenceForecaster
from backend.forecasting.models.lgbm import GBMForecaster

ROOT = Path(__file__).resolve().parents[2]

def evaluate(y, prediction):
    return {"rmse": float(np.sqrt(mean_squared_error(y, prediction))),
            "mae": float(mean_absolute_error(y, prediction)),
            "mape": float(mean_absolute_percentage_error(y, prediction))}

def run_backtest(processed_dir=None, output_dir=None):
    processed = Path(processed_dir or ROOT/"data/processed")
    output = Path(output_dir or Path(__file__).parent/"models/saved")
    output.mkdir(parents=True, exist_ok=True)
    nsrdb = pd.read_parquet(processed/"bangladesh_nsrdb_clean.parquet")
    weather_path = processed/"bangladesh_gfs_clean.parquet"
    weather = pd.read_parquet(weather_path) if weather_path.exists() else None
    features = build_features(nsrdb, weather)
    X, y = extract_target(features)
    train_x, test_x, train_y, test_y = chronological_split(X, y)
    target_times = test_x.index + pd.Timedelta(hours=24)
    mask = test_y > 10
    if not mask.any():
        raise ValueError("No daytime targets in held-out window")
    baseline = PersistenceForecaster().fit(train_x, train_y)
    gbm = GBMForecaster(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=2, verbosity=-1)
    gbm.fit(train_x, train_y)
    benchmarks = {}
    for name, model in [("PersistenceBaseline", baseline), ("LightGBM", gbm)]:
        predictions = physical_solar(model.predict(test_x), target_times)
        benchmarks[name] = evaluate(test_y[mask], predictions[mask.to_numpy()])
    selected = min(benchmarks, key=lambda name: benchmarks[name]["rmse"])
    gbm.save(str(output/"lgbm_solar.joblib"))
    metrics = {"schema_version": 2, "model": selected, **benchmarks[selected],
        "benchmarks": benchmarks, "selection_rule": "Lowest held-out daytime RMSE",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "test_size": int(mask.sum()), "test_rows": len(test_x), "train_rows": len(train_x),
        "feature_start": features.index[0].isoformat(), "feature_end": features.index[-1].isoformat(),
        "train_last_target": (train_x.index[-1]+pd.Timedelta(hours=24)).isoformat(),
        "test_first_origin": test_x.index[0].isoformat(),
        "feature_columns": list(X.columns), "horizon_hours": 24,
        "split": "80/20 chronological; labels strictly before first test origin; daytime GHI > 10",
        "weather_note": "Daily cached GFS, backward join with 24h expiry; missing weather stays missing",
        "interval_method": "Fixed +/-15 percent heuristic, not a calibrated statistical interval"}
    (output/"lgbm_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed-dir", type=Path)
    parser.add_argument("--output-dir", type=Path)
    args = parser.parse_args()
    print(json.dumps(run_backtest(args.processed_dir, args.output_dir), indent=2))

if __name__ == "__main__":
    main()
