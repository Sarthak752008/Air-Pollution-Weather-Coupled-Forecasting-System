"""Integration tests for Phase 4 WRF-Chem and What-If Scenario API endpoints."""

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


class TestPhase4Endpoints:
    def test_wrfchem_status_endpoint(self):
        resp = client.get("/api/v1/wrfchem/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "netcdf_support" in data
        assert data["netcdf_support"] is True
        assert "available_files" in data
        assert "status" in data

    def test_raw_wrfchem_forecast_endpoint(self):
        resp = client.get("/api/v1/wrfchem/forecast/anand_vihar")
        assert resp.status_code == 200
        data = resp.json()
        assert data["station_id"] == "anand_vihar"
        assert "provenance" in data
        assert len(data["points"]) == 72

    def test_blended_forecast_endpoint(self):
        resp = client.get("/api/v1/forecast/blended/anand_vihar")
        assert resp.status_code == 200
        data = resp.json()
        assert data["station_id"] == "anand_vihar"
        assert "provenance" in data
        assert data["provenance"]["forecast_type"] == "PHYSICS_AI_RESIDUAL_BLENDED"
        assert "blending_weights" in data["provenance"]
        assert len(data["points"]) == 72
        pt = data["points"][0]
        assert "physics_pm25" in pt
        assert "ai_residual_pm25" in pt
        assert "blended_pm25" in pt

    def test_scenario_presets_endpoint(self):
        resp = client.get("/api/v1/scenarios/presets")
        assert resp.status_code == 200
        data = resp.json()
        assert "presets" in data
        assert len(data["presets"]) >= 3
        preset_ids = [p["id"] for p in data["presets"]]
        assert "zero_stubble_burning" in preset_ids

    def test_simulate_scenario_endpoint(self):
        payload = {
            "station_id": "anand_vihar",
            "wind_speed_delta_pct": 30.0,
            "rainfall_mm": 15.0,
            "fire_activity_delta_pct": -50.0,
            "scenario_name": "Test Combined Scenario"
        }
        resp = client.post("/api/v1/scenarios/simulate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["scenario_name"] == "Test Combined Scenario"
        assert data["station_id"] == "anand_vihar"
        assert "summary_delta" in data
        assert data["summary_delta"]["net_change_pm25"] < 0.0  # Reduced PM2.5
        assert "explanation" in data
        assert len(data["explanation"]["primary_mechanisms"]) > 0
        assert "disclaimer" in data
        assert len(data["points"]) == 72
