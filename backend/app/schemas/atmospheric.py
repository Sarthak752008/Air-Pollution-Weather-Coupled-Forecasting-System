"""Pydantic schemas for atmospheric intelligence, derived indices, fire observations, and transport corridors."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AtmosphericRegimeResponse(BaseModel):
    regime: str = Field(..., description="NORMAL, STAGNATION, STRONG_INVERSION, HIGH_VENTILATION, RAIN_WASHOUT, REGIONAL_TRANSPORT")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    explanation: str = Field(..., description="Scientific physical rationale for classification")
    severity_level: str = Field(..., description="low, moderate, high, or severe")
    timestamp: datetime = Field(default_factory=datetime.now)
    mode: str = "DEMO"


class DerivedIndicesResponse(BaseModel):
    ventilation_index: float = Field(..., description="Ventilation Index (m²/s) = Wind Speed * PBLH")
    ventilation_category: str = Field(..., description="Critical (<2000), Moderate (2000-6000), or High (>6000)")
    stagnation_index: float = Field(..., ge=0.0, le=100.0, description="Stagnation Index (0-100)")
    inversion_risk_score: float = Field(..., ge=0.0, le=100.0, description="Nocturnal Inversion Risk Score (0-100)")
    wind_transport_indicator: float = Field(..., ge=0.0, le=100.0, description="Regional Transport Advection Indicator (0-100)")
    timestamp: datetime = Field(default_factory=datetime.now)
    mode: str = "DEMO"


class ActiveFirePoint(BaseModel):
    id: str
    latitude: float
    longitude: float
    frp: float = Field(..., description="Fire Radiative Power in Megawatts (MW)")
    brightness: float = Field(..., description="Brightness temperature (Kelvin)")
    confidence: str = Field(default="nominal", description="Detection confidence")
    acq_date: str
    acq_time: str
    satellite: str = "VIIRS_N20"
    source: str = "DEMO"


class ActiveFiresResponse(BaseModel):
    fires: List[ActiveFirePoint]
    count: int
    total_frp: float
    mode: str = "DEMO"
    last_updated: datetime = Field(default_factory=datetime.now)


class TransportCorridor(BaseModel):
    id: str
    origin_cluster: str
    destination: str
    bearing_degrees: float
    wind_speed_kmh: float
    estimated_transit_hours: float
    transport_risk: str = Field(..., description="low, moderate, elevated, severe")
    coordinates: List[List[float]] = Field(..., description="[[origin_lon, origin_lat], [dest_lon, dest_lat]]")


class TransportResponse(BaseModel):
    corridors: List[TransportCorridor]
    dominant_wind_direction: float
    wind_speed_ms: float
    disclaimer: str = "Estimated atmospheric transport trajectory and relative influence based on prevailing wind advection; not an exact chemical source apportionment."
    mode: str = "DEMO"


class DriverAttribution(BaseModel):
    factor: str
    impact: str = Field(..., description="trapping, clearing, advection, emission")
    contribution_pct: float
    description: str


class ForecastExplanationResponse(BaseModel):
    station_id: str
    station_name: str
    summary: str
    regime: str
    primary_driver: str
    secondary_driver: str
    dispersion_rating: str
    drivers: List[DriverAttribution]
    mode: str = "DEMO"
