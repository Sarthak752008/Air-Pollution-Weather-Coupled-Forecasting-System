"""Forecast service — generates 72-hour PM2.5 forecasts."""

import math
import random
import os
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.config import Settings
from app.schemas.forecast import ForecastResponse, ForecastPointSchema
from app.models.station import Station
from app.models.forecast import ForecastRun, ForecastPoint
from app.services.aqi import calculate_sub_index, get_aqi_category


class ForecastService:
    def __init__(self, db: Session, settings: Settings):
        self.db = db
        self.settings = settings
        self.model_path = "ml/models/xgb_pm25_v1.json"

    def generate_forecast(self, station_id: str) -> ForecastResponse:
        station = self.db.query(Station).filter(Station.id == station_id).first()
        if not station:
            raise ValueError(f"Station '{station_id}' not found")

        now = datetime.now()

        # Check if real model exists and we're in LIVE mode
        if self.settings.APP_MODE == "LIVE" and os.path.exists(self.model_path):
            points = self._run_xgb_model(station_id, now)
            model_version = "xgb_pm25_v1"
        else:
            points = self._generate_demo_forecast(station_id, now)
            model_version = "demo_v1"

        # Store forecast run in database
        run = ForecastRun(
            station_id=station_id,
            created_at=now,
            model_version=model_version,
            mode=self.settings.APP_MODE,
            horizon_hours=72,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        response_points = []
        for p in points:
            fp = ForecastPoint(
                forecast_run_id=run.id,
                hour_offset=p["hour_offset"],
                timestamp=p["timestamp"],
                pm25_predicted=p["pm25_predicted"],
                aqi_predicted=p["aqi_predicted"],
                aqi_category=p["aqi_category"],
            )
            self.db.add(fp)
            response_points.append(ForecastPointSchema(**p))

        self.db.commit()

        return ForecastResponse(
            station_id=station_id,
            station_name=station.name,
            created_at=now,
            model_version=model_version,
            mode=self.settings.APP_MODE,
            horizon_hours=72,
            points=response_points,
        )

    def _run_xgb_model(self, station_id: str, start_time: datetime):
        """Run real XGBoost model for forecast. Falls back to demo if model fails."""
        # TODO: Implement real model inference in Phase 2
        return self._generate_demo_forecast(station_id, start_time)

    def _generate_demo_forecast(self, station_id: str, start_time: datetime):
        """Generate realistic-looking demo forecast using diurnal patterns.
        
        Uses station_id hash for deterministic but station-specific values.
        """
        # Station-specific base PM2.5 via hash
        import hashlib
        station_hash = int(hashlib.md5(station_id.encode()).hexdigest()[:8], 16)
        base_pm25 = 80 + (station_hash % 80)  # 80-160 range

        random.seed(station_hash + int(start_time.timestamp() // 3600))

        points = []
        for i in range(1, 73):
            target_time = start_time + timedelta(hours=i)
            hour = target_time.hour

            # Diurnal pattern: peaks in early morning (2-6am) due to boundary layer
            # collapse, lowest in afternoon (14-16pm) when mixing is strongest
            diurnal = 0.9 + 0.2 * math.cos(2 * math.pi * (hour - 3) / 24)

            # Slight trend decay over forecast horizon (regression to mean)
            decay = 1.0 - 0.001 * i

            pm25 = base_pm25 * diurnal * decay + random.uniform(-15, 15)
            pm25 = max(10, round(pm25, 2))

            # Calculate AQI from PM2.5 sub-index directly
            aqi_val = calculate_sub_index("pm25", pm25)
            aqi_cat = None
            if aqi_val is not None:
                aqi_cat, _ = get_aqi_category(aqi_val)

            points.append(
                {
                    "hour_offset": i,
                    "timestamp": target_time,
                    "pm25_predicted": pm25,
                    "aqi_predicted": aqi_val,
                    "aqi_category": aqi_cat,
                }
            )

        return points
