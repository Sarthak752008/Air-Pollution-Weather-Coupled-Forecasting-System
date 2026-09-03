"""Unit tests for Physics-AI Residual Correction and Blending Engine."""

import os
import sys
import pytest

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from backend.app.services.residual_blending import ResidualCorrectionService


class TestResidualCorrectionService:
    def test_residual_estimation_nocturnal_inversion(self):
        service = ResidualCorrectionService()
        # Nocturnal, shallow PBLH (250m), calm wind (1.0 m/s), 2am
        res = service.estimate_residual_correction(
            pm25_phys=70.0,
            pblh=250.0,
            wind_speed=1.0,
            hour=2,
            temperature=18.0
        )
        assert res["predicted_residual_pm25"] > 15.0
        assert res["nocturnal_inversion_bias"] > 10.0
        assert res["calm_stagnation_bias"] > 5.0
        assert res["uncertainty_sigma"] > 0.0

    def test_residual_estimation_afternoon_convective(self):
        service = ResidualCorrectionService()
        # Afternoon, high PBLH (1500m), strong wind (5.0 m/s), 2pm
        res = service.estimate_residual_correction(
            pm25_phys=60.0,
            pblh=1500.0,
            wind_speed=5.0,
            hour=14,
            temperature=32.0
        )
        # Deep mixing layer results in little or negative residual
        assert res["predicted_residual_pm25"] <= 5.0

    def test_blended_forecast_generation(self):
        service = ResidualCorrectionService()
        res = service.generate_blended_forecast(
            station_id="anand_vihar",
            station_name="Anand Vihar",
            lat=28.6468,
            lon=77.3160
        )
        assert res["station_id"] == "anand_vihar"
        assert len(res["points"]) == 72

        # Check provenance
        prov = res["provenance"]
        assert prov["forecast_type"] == "PHYSICS_AI_RESIDUAL_BLENDED"
        assert "blending_weights" in prov
        assert "physics_model" in prov
        assert "ai_residual_corrector" in prov

        # Check blended arithmetic
        pt = res["points"][0]
        assert "physics_pm25" in pt
        assert "ai_residual_pm25" in pt
        assert "blended_pm25" in pt
        assert "uncertainty_lower_pm25" in pt
        assert "uncertainty_upper_pm25" in pt
        assert pt["blended_pm25"] == pytest.approx(round(pt["physics_pm25"] + pt["ai_residual_pm25"], 1), abs=0.2)
        assert pt["uncertainty_lower_pm25"] <= pt["blended_pm25"] <= pt["uncertainty_upper_pm25"]
