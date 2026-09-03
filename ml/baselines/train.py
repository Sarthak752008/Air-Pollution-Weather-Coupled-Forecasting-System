"""Training script for XGBoost PM2.5 baseline model.

Usage:
    python -m ml.baselines.train --station anand_vihar --db sqlite:///data/aerosense.db
"""
import argparse
import sys
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.preprocessing.feature_engineering import build_features, get_feature_columns
from ml.preprocessing.data_loader import load_observations
from ml.baselines.xgboost_model import PM25XGBoostModel
from ml.evaluation.metrics import evaluate_regression

def train_model(station_id: str = 'anand_vihar', db_url: str = 'sqlite:///data/aerosense.db'):
    """Train XGBoost model with proper time-series cross-validation."""
    print(f"Loading data for station: {station_id}")
    df = load_observations(db_url, station_id)
    
    if df.empty or len(df) < 100:
        print(f"Insufficient data ({len(df)} rows). Need at least 100 hourly observations.")
        print("Run the application in DEMO mode first to generate training data.")
        return None
    
    print(f"Loaded {len(df)} observations")
    print(f"Date range: {df.index.min()} to {df.index.max()}")
    
    # Build features
    target_col = 'pm25'
    if target_col not in df.columns or df[target_col].isna().all():
        print(f"No {target_col} data available")
        return None
    
    df = df.dropna(subset=[target_col])
    df_features = build_features(df, target_col)
    print(f"After feature engineering: {len(df_features)} samples")
    
    feature_cols = get_feature_columns(df_features, target_col)
    X = df_features[feature_cols]
    y = df_features[target_col]
    
    # Time-series cross-validation
    tscv = TimeSeriesSplit(n_splits=min(5, max(2, len(X) // 48)))
    
    print(f"\nTraining with {len(feature_cols)} features, {tscv.n_splits} time-series folds")
    print(f"Features: {feature_cols[:10]}...\n")
    
    best_model = None
    best_rmse = float('inf')
    
    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        
        model = PM25XGBoostModel()
        model.train(X_train, y_train, X_val, y_val)
        
        preds = model.predict(X_val)
        metrics = evaluate_regression(y_val.values, preds)
        
        print(f"Fold {fold+1}: RMSE={metrics['rmse']:.2f}, MAE={metrics['mae']:.2f}, R²={metrics['r2']:.4f}")
        
        if metrics['rmse'] < best_rmse:
            best_rmse = metrics['rmse']
            best_model = model
    
    # Save best model
    if best_model:
        save_path = 'ml/models/xgb_pm25_v1.json'
        best_model.save(save_path)
        print(f"\nBest model saved to {save_path} (RMSE: {best_rmse:.2f})")
        
        # Print top features
        importance = best_model.get_feature_importance()
        print("\nTop 10 features:")
        for feat, imp in list(importance.items())[:10]:
            print(f"  {feat}: {imp:.4f}")
    
    return best_model

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train XGBoost PM2.5 model')
    parser.add_argument('--station', default='anand_vihar', help='Station ID')
    parser.add_argument('--db', default='sqlite:///data/aerosense.db', help='Database URL')
    args = parser.parse_args()
    train_model(args.station, args.db)
