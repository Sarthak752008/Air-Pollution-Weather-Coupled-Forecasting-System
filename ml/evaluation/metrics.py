import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Calculate regression evaluation metrics."""
    return {
        'mae': mean_absolute_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'r2': r2_score(y_true, y_pred),
        'mape': np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1e-8))) * 100,
        'n_samples': len(y_true),
    }

def print_metrics(metrics: dict, prefix: str = '') -> None:
    """Pretty print evaluation metrics."""
    p = f"{prefix} " if prefix else ""
    print(f"{p}MAE:  {metrics['mae']:.2f}")
    print(f"{p}RMSE: {metrics['rmse']:.2f}")
    print(f"{p}R²:   {metrics['r2']:.4f}")
    print(f"{p}MAPE: {metrics['mape']:.1f}%")
    print(f"{p}N:    {metrics['n_samples']}")
