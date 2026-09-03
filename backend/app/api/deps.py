from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings, Settings

def get_db_session(db: Session = Depends(get_db)) -> Session:
    return db

def get_app_settings(settings: Settings = Depends(get_settings)) -> Settings:
    return settings
