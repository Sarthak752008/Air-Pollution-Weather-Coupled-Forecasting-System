import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
from ml.preprocessing.feature_engineering import (
    add_temporal_features, add_lag_features, add_rolling_features,
    add_wind_features, build_features
)

def make_sample_df(n_hours=200):
    """Create a sample hourly DataFrame for testing."""
    dates = pd.date_range('2026-01-01', periods=n_hours, freq='h')
    np.random.seed(42)
    df = pd.DataFrame({
        'pm25': 80 + 40 * np.sin(np.arange(n_hours) * 2 * np.pi / 24) + np.random.normal(0, 10, n_hours),
        'pm10': 150 + 60 * np.sin(np.arange(n_hours) * 2 * np.pi / 24) + np.random.normal(0, 15, n_hours),
        'temperature': 25 + 8 * np.sin(np.arange(n_hours) * 2 * np.pi / 24 - np.pi/2) + np.random.normal(0, 1, n_hours),
        'wind_speed': np.abs(3 + np.random.normal(0, 1.5, n_hours)),
        'wind_direction': np.random.uniform(0, 360, n_hours),
    }, index=dates)
    return df

class TestTemporalFeatures:
    def test_adds_cyclical_features(self):
        df = make_sample_df()
        result = add_temporal_features(df)
        assert 'hour_sin' in result.columns
        assert 'hour_cos' in result.columns
        assert 'dow_sin' in result.columns
        assert 'dow_cos' in result.columns
    
    def test_sin_cos_range(self):
        df = make_sample_df()
        result = add_temporal_features(df)
        assert result['hour_sin'].between(-1, 1).all()
        assert result['hour_cos'].between(-1, 1).all()
    
    def test_is_weekend(self):
        df = make_sample_df()
        result = add_temporal_features(df)
        assert set(result['is_weekend'].unique()).issubset({0, 1})

class TestLagFeatures:
    def test_creates_lags(self):
        df = make_sample_df()
        result = add_lag_features(df, 'pm25', [1, 24])
        assert 'pm25_lag_1' in result.columns
        assert 'pm25_lag_24' in result.columns
    
    def test_lag_values_correct(self):
        df = make_sample_df()
        result = add_lag_features(df, 'pm25', [1])
        # lag_1 at index 5 should equal pm25 at index 4
        assert result['pm25_lag_1'].iloc[5] == df['pm25'].iloc[4]
    
    def test_lag_creates_nans(self):
        df = make_sample_df()
        result = add_lag_features(df, 'pm25', [24])
        assert result['pm25_lag_24'].iloc[:24].isna().all()

class TestRollingFeatures:
    def test_creates_rolling_stats(self):
        df = make_sample_df()
        result = add_rolling_features(df, 'pm25', [6])
        assert 'pm25_roll_mean_6' in result.columns
        assert 'pm25_roll_std_6' in result.columns
        assert 'pm25_roll_max_6' in result.columns
        assert 'pm25_roll_min_6' in result.columns
    
    def test_no_data_leakage(self):
        """Rolling stats at time t should NOT include value at time t."""
        df = make_sample_df(50)
        result = add_rolling_features(df, 'pm25', [3])
        # The rolling mean at index 10 should be mean of indices 7,8,9 (shifted by 1)
        # NOT include index 10
        expected = df['pm25'].iloc[7:10].mean()
        actual = result['pm25_roll_mean_3'].iloc[10]
        np.testing.assert_almost_equal(actual, expected, decimal=5)

class TestWindFeatures:
    def test_creates_components(self):
        df = make_sample_df()
        result = add_wind_features(df)
        assert 'wind_u' in result.columns
        assert 'wind_v' in result.columns
    
    def test_north_wind(self):
        """Wind from north (0°) should have u≈0, v<0."""
        df = pd.DataFrame({
            'wind_speed': [5.0],
            'wind_direction': [0.0]
        }, index=pd.date_range('2026-01-01', periods=1, freq='h'))
        result = add_wind_features(df)
        assert abs(result['wind_u'].iloc[0]) < 0.01
        assert result['wind_v'].iloc[0] < 0

class TestBuildFeatures:
    def test_full_pipeline(self):
        df = make_sample_df(200)
        result = build_features(df, 'pm25')
        # Should have more columns than input
        assert len(result.columns) > len(df.columns)
        # Should have no NaN
        assert not result.isna().any().any()
        # Should have fewer rows (dropped NaN from lags)
        assert len(result) < len(df)
