"""Integration tests for Phase 2 API endpoints:
- /api/v1/atmospheric/regime
- /api/v1/atmospheric/indices
- /api/v1/fires/active
- /api/v1/transport/corridors
- /api/v1/forecast/explain/{station_id}
"""

import sys
import os

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
from app.core.database import init_db, SessionLocal
from seed_stations import seed_stations

init_db()
_db = SessionLocal()
try:
    seed_stations(_db)
finally:
    _db.close()

client = TestClient(app)


class TestPhase2Endpoints:
    def test_atmospheric_regime_endpoint(self):
        resp = client.get("/api/v1/atmospheric/regime")
        assert resp.status_code == 200
        data = resp.json()
        assert "regime" in data
        assert "confidence" in data
        assert "explanation" in data
        assert "severity_level" in data
        assert data["mode"] == "DEMO"

    def test_atmospheric_indices_endpoint(self):
        resp = client.get("/api/v1/atmospheric/indices")
        assert resp.status_code == 200
        data = resp.json()
        assert "ventilation_index" in data
        assert "ventilation_category" in data
        assert "stagnation_index" in data
        assert "inversion_risk_score" in data
        assert "wind_transport_indicator" in data
        assert 0 <= data["stagnation_index"] <= 100
        assert 0 <= data["inversion_risk_score"] <= 100
        assert 0 <= data["wind_transport_indicator"] <= 100

    def test_active_fires_endpoint(self):
        resp = client.get("/api/v1/fires/active")
        assert resp.status_code == 200
        data = resp.json()
        assert "fires" in data
        assert "count" in data
        assert "total_frp" in data
        assert data["count"] > 0
        assert data["total_frp"] > 0
        fire = data["fires"][0]
        assert "latitude" in fire
        assert "longitude" in fire
        assert "frp" in fire

    def test_transport_corridors_endpoint(self):
        resp = client.get("/api/v1/transport/corridors")
        assert resp.status_code == 200
        data = resp.json()
        assert "corridors" in data
        assert "disclaimer" in data
        assert "dominant_wind_direction" in data
        assert len(data["corridors"]) > 0
        corridor = data["corridors"][0]
        assert "origin_cluster" in corridor
        assert "coordinates" in corridor
        assert len(corridor["coordinates"]) == 2

    def test_forecast_explain_endpoint(self):
        resp = client.get("/api/v1/forecast/explain/anand_vihar")
        assert resp.status_code == 200
        data = resp.json()
        assert data["station_id"] == "anand_vihar"
        assert "primary_driver" in data
        assert "secondary_driver" in data
        assert "dispersion_rating" in data
        assert "drivers" in data
        assert len(data["drivers"]) >= 3

    def test_forecast_explain_not_found(self):
        resp = client.get("/api/v1/forecast/explain/invalid_station_xyz")
        assert resp.status_code == 404
