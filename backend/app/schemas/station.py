from pydantic import BaseModel, ConfigDict
from typing import List

class StationResponse(BaseModel):
    id: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    operating_agency: str
    zone_type: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class StationListResponse(BaseModel):
    stations: List[StationResponse]
    count: int
