"""Unit tests for the Atmospheric Intelligence Engine and Derived Indices."""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.services.atmospheric import (
    calculate_ventilation_index,
    calculate_stagnation_index,
    calculate_inversion_risk,
    calculate_transport_indicator,
    classify_regime,
    compute_transport_corridors,
    explain_forecast_drivers
)


class TestVentilationIndex:
    def test_critical_stagnation(self):
        # 1.5 m/s * 800 m = 1200 m²/s -> Critical (<2000)
        vi, cat = calculate_ventilation_index(1.5, 800.0)
        assert vi == 1200.0
        assert cat == "Critical"

    def test_moderate_dispersion(self):
        # 3.0 m/s * 1000 m = 3000 m²/s -> Moderate (2000-6000)
        vi, cat = calculate_ventilation_index(3.0, 1000.0)
        assert vi == 3000.0
        assert cat == "Moderate"

    def test_high_ventilation(self):
        # 5.0 m/s * 1500 m = 7500 m²/s -> High (>6000)
        vi, cat = calculate_ventilation_index(5.0, 1500.0)
        assert vi == 7500.0
        assert cat == "High"


class TestStagnationIndex:
    def test_high_stagnation_calm_dry(self):
        # 0 m/s wind, 0 m BLH -> 50 + 50 = 100
        si = calculate_stagnation_index(0.0, 0.0, precipitation=0.0)
        assert si == 100.0

    def test_low_stagnation_brisk_deep(self):
        # >=8 m/s, >=1500 m BLH -> 0 + 0 = 0
        si = calculate_stagnation_index(8.0, 1500.0, precipitation=0.0)
        assert si == 0.0

    def test_precipitation_washout_dampening(self):
        # Stagnant conditions with heavy rain should be sharply reduced
        si_dry = calculate_stagnation_index(1.0, 300.0, precipitation=0.0)
        si_wet = calculate_stagnation_index(1.0, 300.0, precipitation=5.0)
        assert si_wet < si_dry
        assert si_wet <= 20.0


class TestInversionRisk:
    def test_nocturnal_compressed_high_risk(self):
        # 02:00 IST (night), shallow BLH (150m), calm wind (0.5 m/s), high RH (85%)
        risk = calculate_inversion_risk(temp=15.0, humidity=85.0, wind_speed=0.5, blh=150.0, hour=2)
        assert risk >= 70.0

    def test_afternoon_expanded_low_risk(self):
        # 14:00 IST (midday), deep BLH (1600m), moderate wind (4.0 m/s), low RH (30%)
        risk = calculate_inversion_risk(temp=32.0, humidity=30.0, wind_speed=4.0, blh=1600.0, hour=14)
        assert risk <= 30.0


class TestTransportIndicator:
    def test_aligned_northwest_wind_with_fires(self):
        # Wind from 305° (exact NW alignment), 4.5 m/s, 30 active fires, 400 MW FRP
        wti = calculate_transport_indicator(wind_speed=4.5, wind_dir=305.0, fire_count=30, total_frp=400.0)
        assert wti >= 65.0

    def test_easterly_wind_misaligned(self):
        # Wind from 90° (East - opposite of fires), 4.0 m/s, 30 fires
        wti = calculate_transport_indicator(wind_speed=4.0, wind_dir=90.0, fire_count=30, total_frp=400.0)
        # Alignment is 0 (cos of 145° is negative, clamped to 0)
        assert wti < 40.0


class TestRegimeClassification:
    def test_rain_washout_classification(self):
        meteo = {"precipitation": 2.5, "wind_speed": 2.0, "boundary_layer_height": 600.0}
        res = classify_regime(meteo, active_fires=[])
        assert res["regime"] == "RAIN_WASHOUT"
        assert "precipitation" in res["explanation"].lower() or "scavenging" in res["explanation"].lower()

    def test_high_ventilation_classification(self):
        meteo = {"wind_speed": 5.5, "boundary_layer_height": 1400.0, "precipitation": 0.0}
        res = classify_regime(meteo, active_fires=[])
        assert res["regime"] == "HIGH_VENTILATION"

    def test_strong_inversion_classification(self):
        meteo = {
            "wind_speed": 1.0,
            "boundary_layer_height": 200.0,
            "temperature": 14.0,
            "humidity": 80.0,
            "precipitation": 0.0
        }
        res = classify_regime(meteo, active_fires=[], hour=3)
        assert res["regime"] == "STRONG_INVERSION"

    def test_regional_transport_classification(self):
        meteo = {
            "wind_speed": 4.0,
            "wind_direction": 305.0,
            "boundary_layer_height": 800.0,
            "precipitation": 0.0
        }
        fake_fires = [{"id": f"f_{i}", "latitude": 31.0, "longitude": 75.0, "frp": 50.0} for i in range(25)]
        res = classify_regime(meteo, active_fires=fake_fires, hour=15)
        assert res["regime"] == "REGIONAL_TRANSPORT"


class TestTransportCorridorsAndExplain:
    def test_compute_corridors(self):
        fake_fires = [
            {"id": "f_1", "latitude": 31.6, "longitude": 74.8, "frp": 60.0},
            {"id": "f_2", "latitude": 30.2, "longitude": 75.8, "frp": 80.0}
        ]
        corridors = compute_transport_corridors(wind_speed=3.5, wind_dir=305.0, fires=fake_fires)
        assert len(corridors) >= 1
        assert "origin_cluster" in corridors[0]
        assert "coordinates" in corridors[0]

    def test_explain_forecast_drivers(self):
        meteo = {"wind_speed": 1.2, "boundary_layer_height": 240.0, "wind_direction": 290.0}
        regime = {"regime": "STRONG_INVERSION"}
        indices = {"ventilation_index": 288.0, "stagnation_index": 82.0}
        explanation = explain_forecast_drivers("anand_vihar", "Anand Vihar", meteo, regime, indices, [])
        assert explanation["station_id"] == "anand_vihar"
        assert len(explanation["drivers"]) >= 3
        assert "primary_driver" in explanation
