"""Tests for health endpoint details."""

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

client = TestClient(app)


class TestHealthDetails:
    def test_health_has_providers(self):
        response = client.get("/api/v1/health")
        data = response.json()
        providers = data["providers"]
        assert isinstance(providers, list)
        assert len(providers) >= 1

    def test_demo_mode_indicator(self):
        response = client.get("/api/v1/health")
        data = response.json()
        assert data["mode"] == "DEMO"

    def test_health_uptime(self):
        response = client.get("/api/v1/health")
        data = response.json()
        assert data["uptime_seconds"] >= 0

    def test_version_present(self):
        response = client.get("/api/v1/health")
        data = response.json()
        assert data["version"] == "0.1.0"
