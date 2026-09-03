"""Tests for the Indian NAQI calculator."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.services.aqi import calculate_sub_index, calculate_naqi, get_aqi_category


class TestSubIndex:
    def test_pm25_good(self):
        # 15 is midpoint of 0-30 band → sub-index = 25
        assert calculate_sub_index("pm25", 15.0) == 25

    def test_pm25_zero(self):
        assert calculate_sub_index("pm25", 0.0) == 0

    def test_pm25_boundary_30(self):
        assert calculate_sub_index("pm25", 30.0) == 50

    def test_pm25_moderate(self):
        # 75.0 in band 60.1-90 (I: 101-200)
        result = calculate_sub_index("pm25", 75.0)
        assert result is not None
        assert 140 <= result <= 160

    def test_pm25_severe(self):
        result = calculate_sub_index("pm25", 300.0)
        assert result is not None
        assert result > 300

    def test_pm25_over_max(self):
        assert calculate_sub_index("pm25", 600.0) == 500

    def test_invalid_pollutant(self):
        assert calculate_sub_index("INVALID", 100.0) is None

    def test_negative_concentration(self):
        assert calculate_sub_index("pm25", -5.0) is None

    def test_pm10_good(self):
        assert calculate_sub_index("pm10", 25.0) == 25

    def test_co_moderate(self):
        # 5.0 in band 2.01-10.0 (I: 101-200)
        result = calculate_sub_index("co", 5.0)
        assert result is not None
        assert 101 <= result <= 200


class TestNAQI:
    def test_sufficient_data(self):
        result = calculate_naqi({"pm25": 75.0, "pm10": 120.0, "no2": 50.0})
        assert result["status"] == "success"
        assert result["aqi"] is not None
        assert result["aqi"] > 0
        assert result["category"] in [
            "Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"
        ]

    def test_insufficient_data_no_particulate(self):
        result = calculate_naqi({"no2": 50.0, "so2": 30.0, "co": 1.0})
        assert result["status"] == "insufficient_data"

    def test_insufficient_data_too_few(self):
        result = calculate_naqi({"pm25": 75.0, "pm10": 120.0})
        assert result["status"] == "insufficient_data"

    def test_prominent_pollutant(self):
        # PM2.5 at very high level should be prominent
        result = calculate_naqi({"pm25": 200.0, "pm10": 100.0, "no2": 40.0})
        assert result["status"] == "success"
        assert result["prominent_pollutant"] == "pm25"

    def test_aqi_is_maximum_sub_index(self):
        result = calculate_naqi({"pm25": 200.0, "pm10": 100.0, "no2": 40.0})
        assert result["aqi"] == max(result["sub_indices"].values())

    def test_all_pollutants(self):
        result = calculate_naqi({
            "pm25": 80.0, "pm10": 150.0, "no2": 60.0,
            "so2": 25.0, "co": 1.5, "o3": 70.0, "nh3": 100.0,
        })
        assert result["status"] == "success"
        assert len(result["sub_indices"]) == 7


class TestAQICategory:
    def test_good(self):
        name, color = get_aqi_category(25)
        assert name == "Good"

    def test_satisfactory(self):
        name, _ = get_aqi_category(75)
        assert name == "Satisfactory"

    def test_moderate(self):
        name, _ = get_aqi_category(150)
        assert name == "Moderate"

    def test_poor(self):
        name, _ = get_aqi_category(250)
        assert name == "Poor"

    def test_very_poor(self):
        name, _ = get_aqi_category(350)
        assert name == "Very Poor"

    def test_severe(self):
        name, _ = get_aqi_category(450)
        assert name == "Severe"
