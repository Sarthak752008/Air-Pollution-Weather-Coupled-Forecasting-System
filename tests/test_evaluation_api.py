"""Integration tests for Phase 3 Evaluation and Model Selection API endpoints."""

import sys
import os
import pytest

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

os.environ["APP_MODE"] = "DEMO"
os.environ["DATABASE_URL"] = "sqlite:///./data/test_aerosense.db"

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestEvaluationEndpoints:
    def test_model_comparison_endpoint(self):
        resp = client.get("/api/v1/evaluation/comparison")
        assert resp.status_code == 200
        data = resp.json()

        assert "experiment_id" in data
        assert "models" in data
        assert len(data["models"]) == 3

        model_ids = [m["model_id"] for m in data["models"]]
        assert "xgboost_baseline" in model_ids
        assert "lstm_gru_baseline" in model_ids
        assert "gnn_transformer_proposed" in model_ids

        # Verify GNN-Transformer outperforms XGBoost
        xgb_m = next(m for m in data["models"] if m["model_id"] == "xgboost_baseline")
        gnn_m = next(m for m in data["models"] if m["model_id"] == "gnn_transformer_proposed")
        assert gnn_m["metrics_overall"]["mae"] < xgb_m["metrics_overall"]["mae"]

    def test_horizon_evaluation_endpoint(self):
        resp = client.get("/api/v1/evaluation/horizons")
        assert resp.status_code == 200
        data = resp.json()

        assert "horizons" in data
        assert data["horizons"] == [6, 12, 24, 48, 72]
        assert "horizon_data" in data
        assert len(data["horizon_data"]) == 5

    def test_peak_events_endpoint(self):
        resp = client.get("/api/v1/evaluation/peak-events")
        assert resp.status_code == 200
        data = resp.json()

        assert "threshold_pm25" in data
        assert data["threshold_pm25"] == 250.0
        assert "models" in data
        assert len(data["models"]) == 3
        for m in data["models"]:
            assert "precision" in m["peak_metrics"]
            assert "recall" in m["peak_metrics"]
            assert "f1_score" in m["peak_metrics"]

    def test_select_model_endpoint(self):
        # Switch to XGBoost
        resp = client.post("/api/v1/evaluation/select-model", json={"model_id": "xgboost_baseline"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["selected_model_id"] == "xgboost_baseline"

        # Switch back to proposed GNN-Transformer
        resp = client.post("/api/v1/evaluation/select-model", json={"model_id": "gnn_transformer_proposed"})
        assert resp.status_code == 200
        assert resp.json()["selected_model_id"] == "gnn_transformer_proposed"

    def test_select_invalid_model(self):
        resp = client.post("/api/v1/evaluation/select-model", json={"model_id": "non_existent_ai_model"})
        assert resp.status_code == 400
