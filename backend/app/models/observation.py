from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    pm25 = Column(Float, nullable=True)
    pm10 = Column(Float, nullable=True)
    no2 = Column(Float, nullable=True)
    so2 = Column(Float, nullable=True)
    co = Column(Float, nullable=True)
    o3 = Column(Float, nullable=True)
    nh3 = Column(Float, nullable=True)
    
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    
    source = Column(String, nullable=False)
    
    __table_args__ = (
        Index('ix_obs_station_time', 'station_id', 'timestamp', unique=True),
    )
    
    station = relationship("Station")
