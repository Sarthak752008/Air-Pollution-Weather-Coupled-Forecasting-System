from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False)
    model_version = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    horizon_hours = Column(Integer, default=72, nullable=False)
    
    points = relationship("ForecastPoint", back_populates="run", cascade="all, delete-orphan")

class ForecastPoint(Base):
    __tablename__ = "forecast_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    forecast_run_id = Column(Integer, ForeignKey("forecast_runs.id"), nullable=False)
    hour_offset = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    
    pm25_predicted = Column(Float, nullable=False)
    aqi_predicted = Column(Integer, nullable=True)
    aqi_category = Column(String, nullable=True)
    
    run = relationship("ForecastRun", back_populates="points")
