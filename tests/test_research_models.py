"""Unit tests for Phase 3 PyTorch Forecasting Models (LSTM/GRU & GNN-Transformer)."""

import sys
import os
import torch
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.baselines.recurrent_model import TemporalRecurrentModel
from ml.research.gnn_transformer import SpatioTemporalGNNTransformer
from ml.graph.spatial_graph import StationGraph


class TestTemporalRecurrentModel:
    def test_gru_forward_shape(self):
        B, T, F = 4, 24, 11
        x = torch.randn(B, T, F)
        model = TemporalRecurrentModel(input_dim=11, hidden_dim=32, num_layers=1, cell_type="gru")
        out = model(x)
        # Expected shape: (batch_size, num_horizons=5, num_targets=3)
        assert out.shape == (4, 5, 3)

    def test_lstm_forward_shape(self):
        B, T, F = 2, 24, 11
        x = torch.randn(B, T, F)
        model = TemporalRecurrentModel(input_dim=11, hidden_dim=32, num_layers=2, cell_type="lstm")
        out = model(x)
        assert out.shape == (2, 5, 3)


class TestSpatioTemporalGNNTransformer:
    def test_forward_pass_shape(self):
        graph = StationGraph()
        N = graph.num_nodes  # 40
        B, T, F = 2, 24, 11
        x = torch.randn(B, T, N, F)

        adj = torch.tensor(graph.get_normalized_laplacian(graph.base_adjacency), dtype=torch.float32)

        model = SpatioTemporalGNNTransformer(
            num_nodes=N,
            input_dim=11,
            hidden_dim=32,
            num_spatial_layers=1,
            num_temporal_layers=1,
            num_heads=2
        )
        out = model(x, adj)
        # Expected shape: (batch_size=2, num_stations=40, num_horizons=5, num_targets=3)
        assert out.shape == (2, 40, 5, 3)

    def test_save_and_load(self, tmp_path):
        model = SpatioTemporalGNNTransformer(num_nodes=40, input_dim=11, hidden_dim=32)
        save_file = str(tmp_path / "test_gnn.pt")
        model.save(save_file)
        assert os.path.exists(save_file)

        loaded = SpatioTemporalGNNTransformer.load(save_file)
        assert loaded.num_nodes == 40
