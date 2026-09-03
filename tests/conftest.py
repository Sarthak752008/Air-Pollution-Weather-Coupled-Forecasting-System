"""Pytest configuration and shared fixtures."""

import sys
import os

# Add project root and backend to path
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

# Set test environment variables BEFORE any imports
os.environ["APP_MODE"] = "DEMO"
os.environ["DATABASE_URL"] = "sqlite:///./data/test_aerosense.db"
os.environ["CPCB_API_KEY"] = ""
os.environ["LOG_LEVEL"] = "WARNING"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.core.config import Settings


@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    yield session
    session.close()


@pytest.fixture
def test_settings():
    """Test settings in DEMO mode."""
    return Settings(
        APP_MODE="DEMO",
        DATABASE_URL="sqlite:///:memory:",
        CPCB_API_KEY="",
        LOG_LEVEL="WARNING",
    )
