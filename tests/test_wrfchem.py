"""Unit tests for WRF-Chem NetCDF Provider and Adapter."""

import os
import sys
import pytest

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)
_backend = os.path.join(_root, "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from backend.app.providers.wrfchem import WRFChemAdapter, HAS_NETCDF


class TestWRFChemAdapter:
    def test_netcdf_dependency_available(self):
        assert HAS_NETCDF is True

    def test_generate_and_read_sample_netcdf(self, tmp_path):
        adapter = WRFChemAdapter(netcdf_dir=str(tmp_path))
        test_file = str(tmp_path / "custom_wrfchem.nc")
        adapter.generate_sample_netcdf(test_file, num_hours=24, grid_lat_size=4, grid_lon_size=4)

        assert os.path.exists(test_file)
        # Check forecast extraction for Anand Vihar coordinates (28.6468, 77.3160)
        res = adapter.load_station_forecast(28.6468, 77.3160, filepath=test_file)
        assert "provenance" in res
        assert "points" in res
        assert len(res["points"]) == 24

        pt = res["points"][0]
        assert "pm25" in pt
        assert "pm10" in pt
        assert "o3" in pt
        assert "no2" in pt
        assert "wind_speed" in pt
        assert "pblh" in pt
        assert pt["pm25"] > 0.0

    def test_default_sample_ensured(self):
        adapter = WRFChemAdapter()
        status = adapter.get_status()
        assert status["netcdf_support"] is True
        assert len(status["available_files"]) >= 1
        assert status["status"] == "ready"

    def test_station_coordinate_mapping(self):
        adapter = WRFChemAdapter()
        # Test extraction for a station in south Delhi (Aya Nagar: 28.4707, 77.1099)
        res = adapter.load_station_forecast(28.4707, 77.1099)
        assert res["provenance"]["source"] == "WRF_CHEM_NETCDF"
        assert len(res["points"]) == 72
        assert res["provenance"]["distance_km"] < 25.0
