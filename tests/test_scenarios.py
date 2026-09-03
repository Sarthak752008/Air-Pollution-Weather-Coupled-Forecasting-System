"""Unit tests for What-If Scenario Simulation Engine."""

import os
import sys
import pytest

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from backend.app.services.scenario_engine import ScenarioEngine


class TestScenarioEngine:
    def test_presets_exist(self):
        engine = ScenarioEngine()
        assert "zero_stubble_burning" in engine.PRESETS
        assert "monsoon_washout" in engine.PRESETS
        assert "severe_winter_stagnation" in engine.PRESETS

    def test_rainfall_wet_scavenging_reduction(self):
        engine = ScenarioEngine()
        res = engine.simulate_scenario(
            station_id="anand_vihar",
            station_name="Anand Vihar",
            lat=28.6468,
            lon=77.3160,
            wind_speed_delta_pct=0.0,
            rainfall_mm=30.0,
            fire_activity_delta_pct=0.0
        )
        delta = res["summary_delta"]["net_change_pm25"]
        # Rainfall must reduce ambient PM2.5 (negative delta)
        assert delta < -15.0
        assert "Precipitation" in " ".join(res["explanation"]["primary_mechanisms"])
        assert len(res["assumptions"]) > 0

    def test_wind_speed_dilution_and_stagnation(self):
        engine = ScenarioEngine()
        # Brisk wind (+50%)
        res_windy = engine.simulate_scenario(
            station_id="anand_vihar",
            station_name="Anand Vihar",
            lat=28.6468,
            lon=77.3160,
            wind_speed_delta_pct=50.0
        )
        assert res_windy["summary_delta"]["net_change_pm25"] < 0.0

        # Stagnation (-50%)
        res_calm = engine.simulate_scenario(
            station_id="anand_vihar",
            station_name="Anand Vihar",
            lat=28.6468,
            lon=77.3160,
            wind_speed_delta_pct=-50.0
        )
        # Calm winds must increase ambient PM2.5 (positive delta)
        assert res_calm["summary_delta"]["net_change_pm25"] > 0.0

    def test_zero_stubble_burning_reduction(self):
        engine = ScenarioEngine()
        res = engine.simulate_scenario(
            station_id="anand_vihar",
            station_name="Anand Vihar",
            lat=28.6468,
            lon=77.3160,
            fire_activity_delta_pct=-100.0
        )
        assert res["summary_delta"]["net_change_pm25"] < -10.0
        assert "abatement" in " ".join(res["explanation"]["primary_mechanisms"]).lower()

    def test_uncertainty_bounds(self):
        engine = ScenarioEngine()
        res = engine.simulate_scenario(
            station_id="anand_vihar",
            station_name="Anand Vihar",
            lat=28.6468,
            lon=77.3160,
            rainfall_mm=15.0,
            wind_speed_delta_pct=25.0
        )
        for pt in res["points"]:
            assert pt["uncertainty_lower"] <= pt["scenario_pm25"] <= pt["uncertainty_upper"]
            assert pt["uncertainty_lower"] >= 0.0
