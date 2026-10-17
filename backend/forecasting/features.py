"""Hourly forecast-origin features; only observations available at that origin."""
import numpy as np
import pandas as pd

GFS_COLUMNS = ["latitude", "longitude", "temperature_2m_k",
    "relative_humidity_2m_percent", "specific_humidity_2m", "wind_u_10m",
    "wind_v_10m", "wind_gust", "precipitation_rate", "sunshine_duration",
    "cloud_cover_max_isobaric"]
FORECAST_LEAD_HOURS = 24

def build_features(nsrdb_df: pd.DataFrame, gfs_df: pd.DataFrame | None = None) -> pd.DataFrame:
    if not {"timestamp", "GHI"}.issubset(nsrdb_df.columns):
        raise ValueError("NSRDB data requires timestamp and GHI")
    df = nsrdb_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df = df.sort_values("timestamp").set_index("timestamp")
    if df.empty or df.index.has_duplicates:
        raise ValueError("NSRDB timestamps must be nonempty and unique")
    # Reindex before shifts: a missing row must never change an hour into a step.
    df = df.reindex(pd.date_range(df.index.min(), df.index.max(), freq="h"))
    df.index.name = "timestamp"
    df = df.replace([-9999, np.inf, -np.inf], np.nan)
    for name, values in {"hour": df.index.hour, "month": df.index.month,
                         "day_of_week": df.index.dayofweek, "day_of_year": df.index.dayofyear}.items():
        df[name] = values
    df["hour_sin"] = np.sin(2*np.pi*df.hour/24)
    df["hour_cos"] = np.cos(2*np.pi*df.hour/24)
    df["day_sin"] = np.sin(2*np.pi*df.day_of_year/365.25)
    df["day_cos"] = np.cos(2*np.pi*df.day_of_year/365.25)
    df["GHI_lag_24"] = df.GHI.shift(24)
    df["GHI_lag_48"] = df.GHI.shift(48)
    df["GHI_roll_mean_24"] = df.GHI.shift(1).rolling(24).mean()
    df["GHI_roll_std_24"] = df.GHI.shift(1).rolling(24).std()
    if gfs_df is not None and not gfs_df.empty:
        gfs = gfs_df.copy()
        gfs["datetime"] = pd.to_datetime(gfs["datetime"], utc=True)
        gfs = gfs.dropna(subset=["datetime"]).sort_values("datetime").drop_duplicates("datetime")
        gfs = gfs.set_index("datetime").reindex(columns=GFS_COLUMNS)
        # Daily cached observations expire after 24 hours. No backward fill or
        # indefinite extrapolation across the remainder of the historical data.
        weather = gfs.reindex(df.index, method="ffill", tolerance=pd.Timedelta(hours=24))
    else:
        weather = pd.DataFrame(np.nan, index=df.index, columns=GFS_COLUMNS)
    df = df.join(weather)
    # LightGBM handles missing weather and missing non-target observations.
    # Do not drop two years of solar history just because GFS starts in 2020.
    return df.dropna(subset=["GHI", "GHI_lag_24", "GHI_lag_48", "GHI_roll_mean_24", "GHI_roll_std_24"])

def extract_target(df: pd.DataFrame, target_col: str = "GHI", horizon: int = 24):
    if horizon <= 0:
        raise ValueError("horizon must be positive")
    future = df[target_col].reindex(df.index + pd.Timedelta(hours=horizon))
    y = pd.Series(future.to_numpy(), index=df.index, name="target")
    valid = y.notna()
    # GHI(t) is observable at origin t and is a legitimate input for GHI(t+24).
    return df.loc[valid].copy(), y.loc[valid]

def chronological_split(X, y, test_fraction=0.2, horizon=24):
    split = int(len(X)*(1-test_fraction))
    if split <= horizon or split >= len(X):
        raise ValueError("Not enough data for a purged train/test split")
    cutoff = X.index[split]
    train = X.index + pd.Timedelta(hours=horizon) < cutoff
    return X.loc[train], X.iloc[split:], y.loc[train], y.iloc[split:]

def physical_solar(predictions, timestamps, latitude=24.34, longitude=90.07):
    """Nonnegative irradiance, zero while the sun is below the horizon.

    Uses a solar-position approximation, not a measured weather forecast.
    Coordinates come from the cached NSRDB metadata.
    """
    times = pd.DatetimeIndex(pd.to_datetime(timestamps, utc=True))
    gamma = 2*np.pi/365*(times.dayofyear.to_numpy()-1+(times.hour.to_numpy()-12)/24)
    equation = 229.18*(0.000075+0.001868*np.cos(gamma)-0.032077*np.sin(gamma)
                      -0.014615*np.cos(2*gamma)-0.040849*np.sin(2*gamma))
    declination = (0.006918-0.399912*np.cos(gamma)+0.070257*np.sin(gamma)
                   -0.006758*np.cos(2*gamma)+0.000907*np.sin(2*gamma)
                   -0.002697*np.cos(3*gamma)+0.00148*np.sin(3*gamma))
    solar_minutes = times.hour.to_numpy()*60+times.minute.to_numpy()+equation+4*longitude
    hour_angle = np.deg2rad(solar_minutes/4-180)
    elevation = np.sin(np.deg2rad(latitude))*np.sin(declination)+np.cos(np.deg2rad(latitude))*np.cos(declination)*np.cos(hour_angle)
    values = np.asarray(predictions, dtype=float)
    if not np.isfinite(values).all():
        raise ValueError("Solar model returned non-finite values")
    return np.where(elevation > 0, np.maximum(0, values), 0.0)
