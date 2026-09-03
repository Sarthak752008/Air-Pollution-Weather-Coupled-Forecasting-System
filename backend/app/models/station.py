from sqlalchemy import Column, String, Float, Boolean
from app.core.database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operating_agency = Column(String, nullable=False)
    zone_type = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
