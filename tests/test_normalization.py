"""Tests for data normalization utilities."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.services.normalization import validate_range, normalize_cpcb_record


class TestValidateRange:
    def test_within_range(self):
        assert validate_range(50.0, 0.0, 100.0) == 50.0

    def test_at_boundary(self):
        assert validate_range(0.0, 0.0, 100.0) == 0.0
        assert validate_range(100.0, 0.0, 100.0) == 100.0

    def test_below_range(self):
        assert validate_range(-5.0, 0.0, 100.0) is None

    def test_above_range(self):
        assert validate_range(150.0, 0.0, 100.0) is None

    def test_none_input(self):
        assert validate_range(None, 0.0, 100.0) is None

    def test_string_number(self):
        assert validate_range("42.5", 0.0, 100.0) == 42.5

    def test_invalid_string(self):
        assert validate_range("NA", 0.0, 100.0) is None


class TestNormalizeCPCB:
    def test_valid_pm25_record(self):
        raw = {
            "station": "Anand Vihar, Delhi - DPCC",
            "pollutant_id": "PM2.5",
            "pollutant_avg": "112.0",
            "last_update": "04-09-2026 02:00:00",
        }
        result = normalize_cpcb_record(raw)
        assert result is not None
        assert result["pollutant"] == "pm25"
        assert result["value"] == 112.0

    def test_valid_pm10_record(self):
        raw = {
            "station": "ITO, Delhi - CPCB",
            "pollutant_id": "PM10",
            "pollutant_avg": "250.0",
            "last_update": "04-09-2026 02:00:00",
        }
        result = normalize_cpcb_record(raw)
        assert result is not None
        assert result["pollutant"] == "pm10"
        assert result["value"] == 250.0

    def test_invalid_value_na(self):
        raw = {
            "station": "Test Station",
            "pollutant_id": "PM2.5",
            "pollutant_avg": "NA",
            "last_update": "04-09-2026 02:00:00",
        }
        result = normalize_cpcb_record(raw)
        assert result is None

    def test_unknown_pollutant(self):
        raw = {
            "station": "Test Station",
            "pollutant_id": "UNKNOWN_GAS",
            "pollutant_avg": "50.0",
            "last_update": "04-09-2026 02:00:00",
        }
        result = normalize_cpcb_record(raw)
        assert result is None

    def test_out_of_range_value(self):
        raw = {
            "station": "Test Station",
            "pollutant_id": "PM2.5",
            "pollutant_avg": "5000.0",  # Way above valid range
            "last_update": "04-09-2026 02:00:00",
        }
        result = normalize_cpcb_record(raw)
        assert result is None
