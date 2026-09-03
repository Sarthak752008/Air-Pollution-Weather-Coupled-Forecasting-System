import json
import os
import numpy as np
import xgboost as xgb
from pathlib import Path

class PM25XGBoostModel:
    """XGBoost regressor for PM2.5 single-step prediction."""
    
    DEFAULT_PARAMS = {
        'n_estimators': 500,
        'learning_rate': 0.05,
        'max_depth': 6,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 5,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'tree_method': 'hist',
        'random_state': 42,
    }
    
    def __init__(self, params: dict = None):
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.model = xgb.XGBRegressor(**self.params)
        self.feature_names: list[str] = []
    
    def train(self, X_train, y_train, X_val=None, y_val=None):
        """Train the model with optional early stopping."""
        self.feature_names = list(X_train.columns) if hasattr(X_train, 'columns') else []
        fit_params = {}
        if X_val is not None and y_val is not None:
            fit_params['eval_set'] = [(X_train, y_train), (X_val, y_val)]
            fit_params['verbose'] = False
        self.model.fit(X_train, y_train, **fit_params)
        return self
    
    def predict(self, X) -> np.ndarray:
        """Generate predictions."""
        return self.model.predict(X)
    
    def save(self, path: str = 'ml/models/xgb_pm25_v1.json'):
        """Save model to JSON format."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.model.save_model(path)
        # Save feature names alongside
        meta_path = path.replace('.json', '_meta.json')
        with open(meta_path, 'w') as f:
            json.dump({'feature_names': self.feature_names}, f)
    
    def load(self, path: str = 'ml/models/xgb_pm25_v1.json'):
        """Load model from JSON format."""
        self.model.load_model(path)
        meta_path = path.replace('.json', '_meta.json')
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                meta = json.load(f)
                self.feature_names = meta.get('feature_names', [])
        return self
    
    def get_feature_importance(self) -> dict:
        """Get feature importance scores."""
        if not self.feature_names:
            return {}
        importances = self.model.feature_importances_
        return dict(sorted(zip(self.feature_names, importances), key=lambda x: x[1], reverse=True))
