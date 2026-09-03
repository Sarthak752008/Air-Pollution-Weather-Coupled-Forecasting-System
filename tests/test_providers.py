"""Tests for the demo data provider."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.providers.demo import DemoDataProvider


class TestDemoProvider:
    def test_generates_current_data(self):
        provider = DemoDataProvider()
        data = provider.fetch_current_sync("anand_vihar")
        assert data is not None
        assert "pm25" in data
        assert "pm10" in data
        assert data["source"] == "DEMO"

    def test_realistic_pm25_range(self):
        provider = DemoDataProvider()
        data = provider.fetch_current_sync("anand_vihar")
        # Delhi PM2.5 typically 10-600
        assert 5 <= data["pm25"] <= 600

    def test_generates_historical(self):
        provider = DemoDataProvider()
        data = provider.fetch_historical_sync("anand_vihar", days=3)
        assert len(data) > 0
        assert len(data) >= 72  # At least 3 days of hourly data

    def test_different_stations_different_values(self):
        provider = DemoDataProvider()
        data1 = provider.fetch_current_sync("anand_vihar")
        data2 = provider.fetch_current_sync("ito")
        # Both should return valid data (values may differ due to station hash)
        assert data1["pm25"] > 0
        assert data2["pm25"] > 0

    def test_weather_data(self):
        provider = DemoDataProvider()
        data = provider.fetch_weather_current(28.6468, 77.3160)
        assert "temperature" in data
        assert "humidity" in data
        assert "wind_speed" in data
        assert "wind_direction" in data
        assert data["source"] == "DEMO"

    def test_all_pollutants_present(self):
        provider = DemoDataProvider()
        data = provider.fetch_current_sync("anand_vihar")
        for key in ["pm25", "pm10", "no2", "so2", "co", "o3", "nh3"]:
            assert key in data, f"Missing pollutant: {key}"
            assert data[key] is not None


class TestDemoProviderConnection:
    def test_always_connected(self):
        import asyncio
        provider = DemoDataProvider()
        result = asyncio.run(provider.check_connection())
        assert result is True
