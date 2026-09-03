from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ForecastPointSchema(BaseModel):
    hour_offset: int
    timestamp: datetime
    pm25_predicted: float
    aqi_predicted: Optional[int] = None
    aqi_category: Optional[str] = None

class ForecastResponse(BaseModel):
    station_id: str
    station_name: str
    created_at: datetime
    model_version: str
    mode: str
    horizon_hours: int
    points: List[ForecastPointSchema]
