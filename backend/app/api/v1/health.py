from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.api.deps import get_db_session, get_app_settings
from app.core.config import Settings
from app.schemas.health import HealthResponse, DataFreshnessResponse, ProviderStatus
from app.services.ingestion import IngestionService
import time

router = APIRouter()
START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
async def get_health(
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_app_settings)
):
    service = IngestionService(db, settings)
    provider_status = await service.get_provider_status()
    
    return HealthResponse(
        status="healthy",
        mode=settings.APP_MODE,
        version="0.1.0",
        uptime_seconds=time.time() - START_TIME,
        providers=[ProviderStatus(**p) for p in provider_status]
    )

@router.get("/data-freshness", response_model=DataFreshnessResponse)
def get_data_freshness(
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_app_settings)
):
    from app.models.observation import Observation
    from app.models.station import Station
    from app.models.forecast import ForecastRun
    
    last_obs = db.query(Observation).order_by(Observation.timestamp.desc()).first()
    last_fc = db.query(ForecastRun).order_by(ForecastRun.created_at.desc()).first()
    
    obs_count = db.query(Observation).count()
    station_count = db.query(Station).count()
    
    return DataFreshnessResponse(
        mode=settings.APP_MODE,
        last_observation_time=last_obs.timestamp if last_obs else None,
        last_forecast_time=last_fc.created_at if last_fc else None,
        observation_count=obs_count,
        station_count=station_count
    )
