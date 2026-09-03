from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db_session, get_app_settings
from app.core.config import Settings
from app.schemas.forecast import ForecastResponse
from app.services.forecast_service import ForecastService

router = APIRouter()

@router.get("/{station_id}", response_model=ForecastResponse)
def get_forecast(
    station_id: str,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_app_settings)
):
    service = ForecastService(db, settings)
    try:
        return service.generate_forecast(station_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
