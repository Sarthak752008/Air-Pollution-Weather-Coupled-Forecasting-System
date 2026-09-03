"""FastAPI routes for What-If Decision-Support Scenario Simulations."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.api.deps import get_db
from app.models.station import Station
from app.services.scenario_engine import ScenarioEngine
from app.schemas.scenarios import (
    ScenarioParameters,
    ScenarioResponse,
    PresetsResponse,
    PresetScenario
)

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

_scenario_engine = ScenarioEngine()


@router.get("/presets", response_model=PresetsResponse)
def get_scenario_presets():
    """Returns curated policy and atmospheric event scenario presets."""
    presets_list = [
        PresetScenario(
            id=key,
            name=val["name"],
            description=val["description"],
            wind_speed_delta_pct=val["wind_speed_delta_pct"],
            rainfall_mm=val["rainfall_mm"],
            fire_activity_delta_pct=val["fire_activity_delta_pct"]
        )
        for key, val in _scenario_engine.PRESETS.items()
    ]
    return PresetsResponse(presets=presets_list)


@router.post("/simulate", response_model=ScenarioResponse)
def simulate_scenario(params: ScenarioParameters, db: Session = Depends(get_db)):
    """Runs a counterfactual What-If atmospheric simulation under controlled perturbations."""
    station = db.query(Station).filter(Station.id == params.station_id).first()
    if not station:
        if params.station_id == "anand_vihar":
            lat, lon, name = 28.6468, 77.3160, "Anand Vihar"
        else:
            raise HTTPException(status_code=404, detail=f"Station '{params.station_id}' not found")
    else:
        lat, lon, name = station.latitude, station.longitude, station.name

    result = _scenario_engine.simulate_scenario(
        station_id=params.station_id,
        station_name=name,
        lat=lat,
        lon=lon,
        wind_speed_delta_pct=params.wind_speed_delta_pct,
        rainfall_mm=params.rainfall_mm,
        fire_activity_delta_pct=params.fire_activity_delta_pct,
        scenario_name=params.scenario_name
    )

    return ScenarioResponse(**result)
