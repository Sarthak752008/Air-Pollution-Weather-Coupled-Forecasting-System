import numpy as np
import pandas as pd

def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add cyclical temporal features to avoid discontinuities."""
    df = df.copy()
    df['hour'] = df.index.hour
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['dow'] = df.index.dayofweek
    df['dow_sin'] = np.sin(2 * np.pi * df['dow'] / 7.0)
    df['dow_cos'] = np.cos(2 * np.pi * df['dow'] / 7.0)
    df['month_sin'] = np.sin(2 * np.pi * df.index.month / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df.index.month / 12.0)
    df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
    df['is_rush_hour'] = df['hour'].apply(lambda h: 1 if (7 <= h <= 10) or (17 <= h <= 21) else 0)
    return df

def add_lag_features(df: pd.DataFrame, target_col: str = 'pm25', lags: list[int] = None) -> pd.DataFrame:
    """Add autoregressive lag features. Always uses shift to prevent leakage."""
    df = df.copy()
    if lags is None:
        lags = [1, 2, 3, 6, 12, 24, 48]
    for lag in lags:
        df[f'{target_col}_lag_{lag}'] = df[target_col].shift(lag)
    return df

def add_rolling_features(df: pd.DataFrame, target_col: str = 'pm25', windows: list[int] = None) -> pd.DataFrame:
    """Add rolling statistics. CRITICAL: shift(1) before rolling to prevent data leakage."""
    df = df.copy()
    if windows is None:
        windows = [6, 12, 24]
    shifted = df[target_col].shift(1)
    for window in windows:
        rolled = shifted.rolling(window=window, min_periods=1)
        df[f'{target_col}_roll_mean_{window}'] = rolled.mean()
        df[f'{target_col}_roll_std_{window}'] = rolled.std()
        df[f'{target_col}_roll_max_{window}'] = rolled.max()
        df[f'{target_col}_roll_min_{window}'] = rolled.min()
    return df

def add_wind_features(df: pd.DataFrame) -> pd.DataFrame:
    """Decompose wind into u/v vector components."""
    df = df.copy()
    if 'wind_speed' in df.columns and 'wind_direction' in df.columns:
        rad = np.radians(df['wind_direction'])
        df['wind_u'] = -df['wind_speed'] * np.sin(rad)
        df['wind_v'] = -df['wind_speed'] * np.cos(rad)
    return df

def build_features(df: pd.DataFrame, target_col: str = 'pm25') -> pd.DataFrame:
    """Complete feature engineering pipeline."""
    df = add_temporal_features(df)
    df = add_lag_features(df, target_col)
    df = add_rolling_features(df, target_col)
    df = add_wind_features(df)
    # Drop rows with NaN from lagging/rolling
    df = df.dropna()
    return df

def get_feature_columns(df: pd.DataFrame, target_col: str = 'pm25', exclude_cols: list[str] = None) -> list[str]:
    """Get list of feature columns (everything except target and metadata)."""
    if exclude_cols is None:
        exclude_cols = [target_col, 'hour', 'dow', 'station_id', 'source', 'timestamp']
    return [c for c in df.columns if c not in exclude_cols]
