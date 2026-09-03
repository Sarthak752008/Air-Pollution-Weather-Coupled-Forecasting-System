"""FastAPI routes for WRF-Chem Numerical Atmospheric Chemistry and Physics-AI Blending."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.api.deps import get_db
from app.models.station import Station
from app.providers.wrfchem import WRFChemAdapter
from app.services.residual_blending import ResidualCorrectionService
from app.schemas.scenarios import WRFChemStatusResponse, BlendedForecastResponse

router = APIRouter(tags=["wrfchem"])

_wrf_adapter = WRFChemAdapter()
_blending_service = ResidualCorrectionService(wrf_adapter=_wrf_adapter)


@router.get("/wrfchem/status", response_model=WRFChemStatusResponse)
def get_wrfchem_status():
    """Returns WRF-Chem NetCDF provider status and available numerical simulation files."""
    status = _wrf_adapter.get_status()
    return WRFChemStatusResponse(**status)


@router.get("/wrfchem/forecast/{station_id}")
def get_raw_wrfchem_forecast(station_id: str, db: Session = Depends(get_db)):
    """Returns raw numerical WRF-Chem forecast extracted for given CAAQMS station."""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        # Fallback coordinates for common stations
        if station_id == "anand_vihar":
            lat, lon, name = 28.6468, 77.3160, "Anand Vihar"
        else:
            raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
    else:
        lat, lon, name = station.latitude, station.longitude, station.name

    res = _wrf_adapter.load_station_forecast(lat=lat, lon=lon)
    res["station_id"] = station_id
    res["station_name"] = name
    return res


@router.get("/forecast/blended/{station_id}", response_model=BlendedForecastResponse)
def get_blended_forecast(station_id: str, db: Session = Depends(get_db)):
    """Returns coupled Physics-AI Blended forecast with explicit residual correction and scientific provenance."""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        if station_id == "anand_vihar":
            lat, lon, name = 28.6468, 77.3160, "Anand Vihar"
        else:
            raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
    else:
        lat, lon, name = station.latitude, station.longitude, station.name

    blended_data = _blending_service.generate_blended_forecast(
        station_id=station_id,
        station_name=name,
        lat=lat,
        lon=lon
    )
    return BlendedForecastResponse(**blended_data)
