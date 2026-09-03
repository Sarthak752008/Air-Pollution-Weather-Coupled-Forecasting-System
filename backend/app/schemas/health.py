from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

class ProviderStatus(BaseModel):
    name: str
    status: Literal["connected", "error", "not_configured"]
    last_check: Optional[datetime] = None
    message: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    mode: str
    version: str
    uptime_seconds: float
    providers: List[ProviderStatus]

class DataFreshnessResponse(BaseModel):
    mode: str
    last_observation_time: Optional[datetime] = None
    last_forecast_time: Optional[datetime] = None
    observation_count: int
    station_count: int
