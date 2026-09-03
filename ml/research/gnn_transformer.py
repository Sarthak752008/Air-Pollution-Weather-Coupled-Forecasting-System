"""Proposed Research Model: Spatio-Temporal GNN-Transformer.

Combines:
1. Spatial Graph Convolution over wind-aware station topology.
2. Temporal Multi-Head Attention (Transformer) for long-range temporal evolution.
3. Physics Residual Coupling (Ventilation Index and Boundary Layer Height).
4. Multi-Horizon (6h, 12h, 24h, 48h, 72h) and Multi-Target (PM2.5, O3, AQI) Output Head.
"""

import os
import math
import json
import numpy as np
import torch
import torch.nn as nn


class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for temporal sequence representation."""

    def __init__(self, d_model: int, max_len: int = 120):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, T, D)
        return x + self.pe[:, :x.size(1), :]


class SpatialGraphConv(nn.Module):
    """Spatial Graph Convolution operating on wind-aware normalized adjacency."""

    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features, bias=bias)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        """Args:
            x: Node features of shape (B, N, F_in)
            adj: Normalized adjacency matrix of shape (N, N) or (B, N, N)
        Returns:
            out: (B, N, F_out)
        """
        if adj.dim() == 2:
            # (N, N) @ (B, N, F) -> einsum
            support = self.linear(x)  # (B, N, F_out)
            out = torch.einsum("nm,bmf->bnf", adj, support)
        else:
            support = self.linear(x)
            out = torch.bmm(adj, support)
        return out


class SpatioTemporalGNNTransformer(nn.Module):
    """Research Model: Spatio-Temporal Graph Neural Network with Temporal Attention."""

    HORIZONS = [6, 12, 24, 48, 72]
    TARGET_NAMES = ["pm25", "o3", "aqi"]

    def __init__(
        self,
        num_nodes: int = 40,
        input_dim: int = 11,
        hidden_dim: int = 64,
        num_spatial_layers: int = 2,
        num_temporal_layers: int = 2,
        num_heads: int = 4,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.num_nodes = num_nodes
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_horizons = len(self.HORIZONS)
        self.num_targets = len(self.TARGET_NAMES)

        # 1. Spatial Graph Convolutional Stack
        self.spatial_layers = nn.ModuleList([
            SpatialGraphConv(input_dim if i == 0 else hidden_dim, hidden_dim)
            for i in range(num_spatial_layers)
        ])
        self.spatial_act = nn.GELU()
        self.spatial_dropout = nn.Dropout(dropout)

        # 2. Temporal Transformer Encoder Stack
        self.pos_encoder = PositionalEncoding(hidden_dim)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=num_heads,
            dim_feedforward=hidden_dim * 2,
            dropout=dropout,
            activation="gelu",
            batch_first=True
        )
        self.temporal_transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_temporal_layers)

        # 3. Physics Residual Coupling Branch
        # Takes co-located dispersion drivers: [PBLH, Wind Speed, Ventilation Index, Temp, Humidity]
        self.physics_branch = nn.Sequential(
            nn.Linear(input_dim, hidden_dim // 2),
            nn.GELU(),
            nn.Linear(hidden_dim // 2, hidden_dim),
            nn.Dropout(dropout)
        )

        # 4. Multi-Horizon Multi-Target Projection Head
        self.output_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, self.num_horizons * self.num_targets)
        )

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        """Forward propagation.
        
        Args:
            x: Input tensor of shape (B, T, N, input_dim)
               where B = batch size, T = sequence length (e.g. 24),
               N = number of stations (40), input_dim = 11 features.
            adj: Normalized wind-aware adjacency matrix of shape (N, N)
            
        Returns:
            predictions: Tensor of shape (B, N, num_horizons, num_targets)
                         representing PM2.5, O3, and AQI at 6h, 12h, 24h, 48h, 72h.
        """
        B, T, N, F = x.shape

        # Step 1: Spatial Graph Convolutions at each time step
        # Reshape to (B * T, N, F)
        x_flat = x.reshape(B * T, N, F)
        h_spatial = x_flat

        for layer in self.spatial_layers:
            h_spatial = layer(h_spatial, adj)
            h_spatial = self.spatial_act(h_spatial)
            h_spatial = self.spatial_dropout(h_spatial)

        # h_spatial: (B * T, N, hidden_dim) -> (B, T, N, hidden_dim)
        h_spatial = h_spatial.reshape(B, T, N, self.hidden_dim)

        # Transpose to (B, N, T, hidden_dim) -> (B * N, T, hidden_dim)
        h_temporal_in = h_spatial.permute(0, 2, 1, 3).contiguous().reshape(B * N, T, self.hidden_dim)

        # Step 2: Temporal Transformer Self-Attention
        h_pos = self.pos_encoder(h_temporal_in)
        h_temporal = self.temporal_transformer(h_pos)  # (B * N, T, hidden_dim)
        last_temporal = h_temporal[:, -1, :]  # (B * N, hidden_dim)

        # Step 3: Physics Residual Coupling
        # Extract latest physical meteo features at t = -1
        x_latest = x[:, -1, :, :]  # (B, N, F) -> (B * N, F)
        physics_emb = self.physics_branch(x_latest.reshape(B * N, F))

        # Additive residual fusion with layer norm
        fused = last_temporal + physics_emb

        # Step 4: Multi-Horizon Projection
        out = self.output_head(fused)  # (B * N, num_horizons * num_targets)

        # Reshape to (B, N, num_horizons, num_targets)
        out = out.reshape(B, N, self.num_horizons, self.num_targets)
        return out

    def save(self, path: str = "ml/models/gnn_transformer_v1.pt"):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save({
            "state_dict": self.state_dict(),
            "config": {
                "num_nodes": self.num_nodes,
                "input_dim": self.input_dim,
                "hidden_dim": self.hidden_dim,
                "num_spatial_layers": len(self.spatial_layers),
            }
        }, path)

    @classmethod
    def load(cls, path: str = "ml/models/gnn_transformer_v1.pt") -> "SpatioTemporalGNNTransformer":
        checkpoint = torch.load(path, map_location="cpu")
        config = checkpoint.get("config", {})
        model = cls(**config)
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()
        return model
