from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime

class AQDataProvider(ABC):
    @abstractmethod
    async def fetch_current(self, station_id: str) -> Optional[Dict]:
        pass
        
    @abstractmethod
    async def fetch_historical(self, station_id: str, start: datetime, end: datetime) -> List[Dict]:
        pass
        
    @abstractmethod
    async def check_connection(self) -> bool:
        pass

class WeatherDataProvider(ABC):
    @abstractmethod
    async def fetch_current(self, lat: float, lon: float) -> Optional[Dict]:
        pass
        
    @abstractmethod
    async def fetch_forecast(self, lat: float, lon: float, hours: int) -> List[Dict]:
        pass
        
    @abstractmethod
    async def check_connection(self) -> bool:
        pass
