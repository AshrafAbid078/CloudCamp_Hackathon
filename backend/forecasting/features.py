import pandas as pd
import numpy as np

def build_features(nsrdb_df: pd.DataFrame, gfs_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Builds feature sets for forecasting.
    Joins NSRDB (historical solar) with GFS (cloud cover) if provided.
    
    Args:
        nsrdb_df: DataFrame containing 'timestamp' and 'GHI'
        gfs_df: DataFrame containing 'datetime' and weather features like 'cloud_cover_max_isobaric'
        
    Returns:
        DataFrame with combined and engineered features.
    """
    # Create a copy to avoid mutating the original
    df = nsrdb_df.copy()
    
    if 'timestamp' not in df.columns:
        raise ValueError("nsrdb_df must contain 'timestamp' column.")
    
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').set_index('timestamp')
    
    # 1. Time-based features
    df['hour'] = df.index.hour
    df['month'] = df.index.month
    df['day_of_week'] = df.index.dayofweek
    df['day_of_year'] = df.index.dayofyear
    
    # Cyclic encoding for hour and day of year (since time is circular)
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365.25)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365.25)
    
    # 2. Lag features (e.g., yesterday's solar output at the same time)
    # Assuming hourly data, lag 24 is exactly 24 hours ago
    if 'GHI' in df.columns:
        df['GHI_lag_24'] = df['GHI'].shift(24)
        df['GHI_lag_48'] = df['GHI'].shift(48)
        
        # Rolling averages over the last 24h
        df['GHI_roll_mean_24'] = df['GHI'].shift(1).rolling(window=24).mean()
        df['GHI_roll_std_24'] = df['GHI'].shift(1).rolling(window=24).std()
        
    # 3. Incorporate GFS weather features if available
    if gfs_df is not None:
        gfs = gfs_df.copy()
        if 'datetime' not in gfs.columns:
            raise ValueError("gfs_df must contain 'datetime' column.")
        
        gfs['datetime'] = pd.to_datetime(gfs['datetime'])
        # Set index and resample if needed, we assume it's hourly or we merge on nearest
        gfs = gfs.sort_values('datetime').set_index('datetime')
        
        # Merge on the time index
        # We assume GFS features are available as forecasts for the timestamp.
        df = df.join(gfs, how='left')
        
        # We can fill forward some weather features if there are gaps (e.g. 3h resolution to 1h)
        df = df.ffill()
        
    # Drop rows with NaNs caused by lagging
    df = df.dropna()
    
    return df

def extract_target(df: pd.DataFrame, target_col: str = 'GHI', horizon: int = 24):
    """
    Shifts the target column to create the label for forecasting `horizon` steps ahead.
    
    Args:
        df: The feature dataframe.
        target_col: The column to predict.
        horizon: The number of steps (hours) ahead to predict.
        
    Returns:
        X, y: Feature matrix and target vector.
    """
    df_copy = df.copy()
    
    # The target is the GHI `horizon` hours in the future
    df_copy['target'] = df_copy[target_col].shift(-horizon)
    
    # Drop NaNs at the end where we don't have future data
    df_copy = df_copy.dropna(subset=['target'])
    
    y = df_copy.pop('target')

    # Drop the raw (un-shifted) target column from features to prevent data leakage.
    # The model should only see past observations (lag features), not the current true value.
    if target_col in df_copy.columns:
        df_copy = df_copy.drop(columns=[target_col])

    X = df_copy
    
    return X, y
