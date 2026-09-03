"""Demo data provider — generates realistic synthetic air quality and weather data.

All data is clearly sourced as "DEMO" and uses deterministic seeding
based on station_id + timestamp for reproducibility.
"""

import math
import hashlib
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from .base import AQDataProvider, WeatherDataProvider


class DemoDataProvider(AQDataProvider, WeatherDataProvider):
    """Generates synthetic but realistic Delhi NCR air quality and weather data."""

    def _get_seed(self, station_id, dt: datetime) -> float:
        """Deterministic seed from station + hour for reproducible values."""
        s = f"{str(station_id)}_{dt.strftime('%Y%m%d%H')}"
        return int(hashlib.md5(s.encode()).hexdigest(), 16) / (16**32)

    def _generate_observation(self, station_id: str, dt: datetime) -> Dict:
        """Generate one hourly observation with realistic diurnal + seasonal patterns."""
        hour = dt.hour
        day_of_year = dt.timetuple().tm_yday
        seed = self._get_seed(station_id, dt)

        # Seasonal factor: higher in winter (Dec-Jan ~day 350-30)
        seasonal = math.cos(2 * math.pi * (day_of_year - 15) / 365)
        seasonal_factor = 1.0 + 0.5 * seasonal  # 0.5x summer to 1.5x winter

        # Diurnal factor: peaks at ~2-6am (boundary layer collapse)
        diurnal = math.cos(2 * math.pi * (hour - 3) / 24)
        diurnal_factor = 1.0 + 0.3 * diurnal

        # Station-specific base
        station_hash = int(hashlib.md5(str(station_id).encode()).hexdigest()[:6], 16)
        base_pm25 = 80 + (station_hash % 60)

        noise = (seed - 0.5) * 40
        pm25 = max(10, base_pm25 * seasonal_factor * diurnal_factor + noise)
        pm10 = pm25 * 1.8 + seed * 20

        # Meteorological data
        temp = 28 + 7 * math.sin(2 * math.pi * (hour - 14) / 24) + (seed - 0.5) * 4
        humidity = 55 + 25 * math.cos(2 * math.pi * (hour - 4) / 24) + (seed - 0.5) * 10
        wind_speed = max(0.5, 2 + 4 * math.sin(2 * math.pi * (hour - 12) / 24) ** 2 + seed * 2)
        wind_direction = (station_hash + hour * 15 + seed * 50) % 360

        # Ozone peaks during daytime photochemistry
        o3 = max(5, 40 + 50 * math.sin(2 * math.pi * (hour - 14) / 24))

        return {
            "station_id": station_id,
            "timestamp": dt,
            "source": "DEMO",
            "pm25": round(pm25, 1),
            "pm10": round(pm10, 1),
            "no2": round(max(5, pm25 * 0.35 + (seed - 0.5) * 15), 1),
            "so2": round(max(2, pm25 * 0.15 + (seed - 0.5) * 8), 1),
            "co": round(max(0.2, pm25 * 0.012 + (seed - 0.5) * 0.3), 2),
            "o3": round(o3, 1),
            "nh3": round(max(5, pm25 * 0.12 + (seed - 0.5) * 10), 1),
            "temperature": round(temp, 1),
            "humidity": round(max(10, min(98, humidity)), 1),
            "wind_speed": round(wind_speed, 1),
            "wind_direction": round(wind_direction, 1),
        }

    # ── AQDataProvider interface ──

    async def fetch_current(self, station_id: str, lat: float = 28.6, lon: float = 77.2) -> Optional[Dict]:
        return self._generate_observation(station_id, datetime.now())

    async def fetch_historical(self, station_id: str, start: datetime, end: datetime) -> List[Dict]:
        results = []
        curr = start
        while curr <= end:
            results.append(self._generate_observation(station_id, curr))
            curr += timedelta(hours=1)
        return results

    # ── WeatherDataProvider interface ──

    async def fetch_forecast(self, lat: float, lon: float, hours: int) -> List[Dict]:
        now = datetime.now()
        return [
            self._generate_observation("weather_forecast", now + timedelta(hours=i))
            for i in range(hours)
        ]

    async def check_connection(self) -> bool:
        return True

    # ── Convenience methods used by tests and direct calls ──

    def fetch_current_sync(self, station_id: str) -> Dict:
        """Synchronous version for use outside async context."""
        return self._generate_observation(station_id, datetime.now())

    def fetch_historical_sync(self, station_id: str, days: int = 7) -> List[Dict]:
        """Synchronous historical data generation."""
        end = datetime.now()
        start = end - timedelta(days=days)
        results = []
        curr = start
        while curr <= end:
            results.append(self._generate_observation(station_id, curr))
            curr += timedelta(hours=1)
        return results

    def fetch_weather_current(self, lat: float, lon: float) -> Dict:
        """Synchronous weather data for a location."""
        obs = self._generate_observation(f"weather_{lat:.2f}_{lon:.2f}", datetime.now())
        return {
            "temperature": obs["temperature"],
            "humidity": obs["humidity"],
            "wind_speed": obs["wind_speed"],
            "wind_direction": obs["wind_direction"],
            "source": "DEMO",
        }
