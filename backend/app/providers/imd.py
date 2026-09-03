import httpx
from typing import Dict, List, Optional
from datetime import datetime
from .base import WeatherDataProvider

class IMDWeatherProvider(WeatherDataProvider):
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        
    async def fetch_current(self, lat: float, lon: float) -> Optional[Dict]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation",
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                if "current" in data:
                    return data["current"]
                return None
        except Exception:
            return None

    async def fetch_forecast(self, lat: float, lon: float, hours: int) -> List[Dict]:
        return []

    async def check_connection(self) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={"latitude": 28.6, "longitude": 77.2, "current": "temperature_2m"},
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception:
            return False
