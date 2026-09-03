import httpx
from typing import Dict, List, Optional
from datetime import datetime
from .base import AQDataProvider

class CPCBProvider(AQDataProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
        
    async def fetch_current(self, station_id: str) -> Optional[Dict]:
        if not self.api_key:
            return None
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "api-key": self.api_key,
                        "format": "json",
                        "limit": 100,
                        "filters[station]": station_id
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                if not data.get("records"):
                    return None
                    
                records = data["records"]
                
                result = {
                    "station_id": station_id,
                    "timestamp": datetime.now(), # ideally parse from record
                    "pollutants": {}
                }
                
                for r in records:
                    pollutant_id = r.get("pollutant_id", "").lower()
                    avg = r.get("pollutant_avg")
                    try:
                        val = float(avg) if avg not in (None, "NA") else None
                        if val is not None:
                            result["pollutant_id"] = val # Will be replaced by normalization
                    except (ValueError, TypeError):
                        pass
                
                return result
        except Exception:
            return None

    async def fetch_historical(self, station_id: str, start: datetime, end: datetime) -> List[Dict]:
        return []

    async def check_connection(self) -> bool:
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={"api-key": self.api_key, "format": "json", "limit": 1},
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception:
            return False
