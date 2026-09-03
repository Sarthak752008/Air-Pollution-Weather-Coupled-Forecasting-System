"""Unit tests for NASA FIRMS Active Fire Providers."""

import sys
import os
import pytest
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.providers.firms import DemoFIRMSProvider, NASAFIRMSProvider


@pytest.mark.asyncio
async def test_demo_firms_provider_generates_fires():
    provider = DemoFIRMSProvider()
    fires = await provider.fetch_active_fires()
    assert len(fires) > 0
    
    first = fires[0]
    assert "latitude" in first
    assert "longitude" in first
    assert "frp" in first
    assert first["frp"] > 0
    assert first["source"] == "DEMO"
    assert 28.0 <= first["latitude"] <= 32.5
    assert 74.0 <= first["longitude"] <= 78.5


@pytest.mark.asyncio
async def test_demo_firms_provider_connection():
    provider = DemoFIRMSProvider()
    connected = await provider.check_connection()
    assert connected is True


@pytest.mark.asyncio
async def test_nasa_firms_fallback_without_key():
    provider = NASAFIRMSProvider(map_key="")
    connected = await provider.check_connection()
    assert connected is False
    fires = await provider.fetch_active_fires()
    assert fires == []
