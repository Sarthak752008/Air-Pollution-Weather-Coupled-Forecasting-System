"""Data normalization utilities for incoming provider data."""

from typing import Optional, Dict
from datetime import datetime


# Valid physical ranges for pollutants and meteorological values
VALID_RANGES = {
    "pm25": (0, 2000),
    "pm10": (0, 3000),
    "no2": (0, 1000),
    "so2": (0, 2500),
    "co": (0, 100),
    "o3": (0, 1200),
    "nh3": (0, 3000),
    "temperature": (-10, 55),
    "humidity": (0, 100),
    "wind_speed": (0, 50),
    "wind_direction": (0, 360),
}


def validate_range(value, min_val: float, max_val: float) -> Optional[float]:
    """Return value if within valid range, else None."""
    if value is None:
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    if min_val <= value <= max_val:
        return value
    return None


def _safe_float(val) -> Optional[float]:
    """Parse a value to float, returning None on failure."""
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# Mapping from CPCB pollutant_id strings to internal keys
CPCB_POLLUTANT_MAP = {
    "PM2.5": "pm25",
    "PM10": "pm10",
    "NO2": "no2",
    "SO2": "so2",
    "CO": "co",
    "OZONE": "o3",
    "O3": "o3",
    "NH3": "nh3",
}


def normalize_cpcb_record(raw: Dict) -> Optional[Dict]:
    """Normalize a single CPCB API record into internal format.
    
    CPCB records have one pollutant per row:
    {
        "station": "Anand Vihar, Delhi - DPCC",
        "pollutant_id": "PM2.5",
        "pollutant_avg": "112.0",
        "last_update": "04-09-2026 02:00:00"
    }
    """
    pollutant_id = raw.get("pollutant_id", "")
    internal_key = CPCB_POLLUTANT_MAP.get(pollutant_id)
    if not internal_key:
        return None

    value = _safe_float(raw.get("pollutant_avg"))
    if value is None:
        return None

    # Validate against physical range
    vrange = VALID_RANGES.get(internal_key)
    if vrange:
        value = validate_range(value, vrange[0], vrange[1])
        if value is None:
            return None

    # Parse timestamp
    timestamp = None
    ts_str = raw.get("last_update", "")
    for fmt in ("%d-%m-%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            timestamp = datetime.strptime(ts_str, fmt)
            break
        except (ValueError, TypeError):
            continue

    return {
        "station": raw.get("station", ""),
        "pollutant": internal_key,
        "value": value,
        "timestamp": timestamp,
    }


def normalize_weather_record(raw: Dict) -> Dict:
    """Normalize Open-Meteo weather data to internal format."""
    return {
        "temperature": validate_range(raw.get("temperature_2m"), -10, 55),
        "humidity": validate_range(raw.get("relative_humidity_2m"), 0, 100),
        "wind_speed": validate_range(raw.get("wind_speed_10m"), 0, 50),
        "wind_direction": validate_range(raw.get("wind_direction_10m"), 0, 360),
        "surface_pressure": _safe_float(raw.get("surface_pressure")),
        "precipitation": _safe_float(raw.get("precipitation")),
        "boundary_layer_height": _safe_float(raw.get("boundary_layer_height")),
    }
