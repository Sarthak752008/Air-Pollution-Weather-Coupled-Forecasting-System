"""Ingestion service — orchestrates data fetch from providers and serves observations."""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from datetime import datetime

from app.core.config import Settings
from app.providers.demo import DemoDataProvider
from app.providers.cpcb import CPCBProvider
from app.providers.imd import IMDWeatherProvider
from app.models.station import Station
from app.services.aqi import calculate_naqi


class IngestionService:
    def __init__(self, db: Session, settings: Settings):
        self.db = db
        self.settings = settings
        if settings.APP_MODE == "DEMO":
            self._demo = DemoDataProvider()
            self.aq_provider = self._demo
            self.weather_provider = self._demo
        else:
            self.aq_provider = CPCBProvider(api_key=settings.CPCB_API_KEY)
            self.weather_provider = IMDWeatherProvider()
            self._demo = None

    async def get_current_observations(
        self, station_id: Optional[str] = None
    ) -> List[Dict]:
        """Return current observations for all (or one) station."""
        query = self.db.query(Station)
        if station_id:
            query = query.filter(Station.id == station_id)
        stations = query.filter(Station.is_active == True).all()

        results: List[Dict] = []
        for s in stations:
            aq_data = await self.aq_provider.fetch_current(s.id, s.latitude, s.longitude)
            if not aq_data:
                continue

            # In DEMO mode the demo provider returns everything in one dict
            if self.settings.APP_MODE == "DEMO":
                merged = aq_data
            else:
                weather_data = await self.weather_provider.fetch_current(
                    s.latitude, s.longitude
                )
                merged = {**aq_data, **(weather_data or {})}

            measurements = {
                k: merged.get(k)
                for k in ("pm25", "pm10", "no2", "so2", "co", "o3", "nh3")
            }
            aqi_info = calculate_naqi(measurements)

            results.append(
                {
                    "station_id": s.id,
                    "station_name": s.name,
                    "timestamp": merged.get("timestamp", datetime.now()).isoformat()
                    if isinstance(merged.get("timestamp"), datetime)
                    else str(merged.get("timestamp", datetime.now())),
                    "pollutants": measurements,
                    "meteorology": {
                        "temperature": merged.get("temperature"),
                        "humidity": merged.get("humidity"),
                        "wind_speed": merged.get("wind_speed"),
                        "wind_direction": merged.get("wind_direction"),
                    },
                    "aqi": aqi_info.get("aqi"),
                    "aqi_category": aqi_info.get("category"),
                    "aqi_color": aqi_info.get("color"),
                    "prominent_pollutant": aqi_info.get("prominent_pollutant"),
                    "source": merged.get("source", "UNKNOWN"),
                    "mode": self.settings.APP_MODE,
                }
            )

        return results

    async def get_provider_status(self) -> List[Dict]:
        """Return connection status of configured providers."""
        statuses = []
        try:
            aq_ok = await self.aq_provider.check_connection()
        except Exception:
            aq_ok = False
        statuses.append(
            {
                "name": "CPCB" if self.settings.APP_MODE == "LIVE" else "Demo AQ",
                "status": "connected" if aq_ok else "error",
            }
        )

        try:
            w_ok = await self.weather_provider.check_connection()
        except Exception:
            w_ok = False
        statuses.append(
            {
                "name": "IMD" if self.settings.APP_MODE == "LIVE" else "Demo Weather",
                "status": "connected" if w_ok else "error",
            }
        )

        return statuses
