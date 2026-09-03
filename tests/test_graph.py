"""Unit tests for Spatial Station Graph and Wind-Aware Adjacency."""

import sys
import os
import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.graph.spatial_graph import StationGraph


class TestStationGraph:
    def test_loads_stations(self):
        graph = StationGraph()
        assert graph.num_nodes == 40
        assert len(graph.station_ids) == 40
        assert "anand_vihar" in graph.station_ids

    def test_distance_matrix_properties(self):
        graph = StationGraph()
        d = graph.distance_matrix
        assert d.shape == (40, 40)
        # Diagonal must be zero (distance from station to itself)
        assert np.all(np.diag(d) == 0.0)
        # Symmetric: distance i -> j == distance j -> i
        assert np.allclose(d, d.T, atol=1e-3)
        # Real distance between Anand Vihar and Alipur is approx 20-30 km
        av_idx = graph.id_to_idx["anand_vihar"]
        al_idx = graph.id_to_idx["alipur"]
        assert 15.0 <= d[av_idx, al_idx] <= 35.0

    def test_bearing_matrix_properties(self):
        graph = StationGraph()
        b = graph.bearing_matrix
        assert b.shape == (40, 40)
        assert np.all((b >= 0.0) & (b < 360.0))

    def test_wind_aware_adjacency_modulation(self):
        graph = StationGraph()
        # With North-West wind (315°), wind blows towards South-East (135°)
        # Stations with bearing ~135° relative to another should have boosted weight
        adj_calm = graph.get_wind_aware_adjacency(wind_direction=315.0, wind_speed=0.0, beta=0.8)
        adj_windy = graph.get_wind_aware_adjacency(wind_direction=315.0, wind_speed=5.0, beta=0.8)

        assert adj_calm.shape == (40, 40)
        assert adj_windy.shape == (40, 40)
        # Windy adjacency has higher total edge weight along wind advection
        assert np.sum(adj_windy) >= np.sum(adj_calm)

    def test_normalized_laplacian_properties(self):
        graph = StationGraph()
        adj = graph.get_wind_aware_adjacency(wind_direction=300.0, wind_speed=3.0)
        lap = graph.get_normalized_laplacian(adj)

        assert lap.shape == (40, 40)
        assert not np.isnan(lap).any()
        assert not np.isinf(lap).any()
        # Diagonal elements of normalized D^{-1/2}(A+I)D^{-1/2} should be non-zero
        assert np.all(np.diag(lap) > 0.0)
