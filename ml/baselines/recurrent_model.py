"""Baseline B: Temporal Recurrent Model (LSTM / GRU).

Multi-horizon and multi-target deep sequence baseline for air quality forecasting.
Predicts PM2.5, O3, and NAQI simultaneously across [6h, 12h, 24h, 48h, 72h].
"""

import os
import json
import numpy as np
import torch
import torch.nn as nn


class TemporalRecurrentModel(nn.Module):
    """Multi-layer GRU/LSTM network for multi-horizon, multi-target air quality forecasting."""

    HORIZONS = [6, 12, 24, 48, 72]
    TARGET_NAMES = ["pm25", "o3", "aqi"]

    def __init__(
        self,
        input_dim: int = 11,
        hidden_dim: int = 64,
        num_layers: int = 2,
        dropout: float = 0.1,
        cell_type: str = "gru"
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.cell_type = cell_type.lower()
        self.num_horizons = len(self.HORIZONS)
        self.num_targets = len(self.TARGET_NAMES)

        if self.cell_type == "lstm":
            self.rnn = nn.LSTM(
                input_size=input_dim,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                dropout=dropout if num_layers > 1 else 0.0
            )
        else:
            self.rnn = nn.GRU(
                input_size=input_dim,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                dropout=dropout if num_layers > 1 else 0.0
            )

        # Multi-Horizon Projection Head: Hidden -> (num_horizons * num_targets)
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, self.num_horizons * self.num_targets)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_dim)
            
        Returns:
            predictions: Tensor of shape (batch_size, num_horizons, num_targets)
        """
        rnn_out, _ = self.rnn(x)  # (B, T, hidden_dim)
        last_hidden = rnn_out[:, -1, :]  # (B, hidden_dim)

        out = self.head(last_hidden)  # (B, num_horizons * num_targets)
        out = out.view(-1, self.num_horizons, self.num_targets)
        return out

    def save(self, path: str = "ml/models/temporal_recurrent_v1.pt"):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save({
            "state_dict": self.state_dict(),
            "config": {
                "input_dim": self.input_dim,
                "hidden_dim": self.hidden_dim,
                "num_layers": self.num_layers,
                "cell_type": self.cell_type,
            }
        }, path)

    @classmethod
    def load(cls, path: str = "ml/models/temporal_recurrent_v1.pt") -> "TemporalRecurrentModel":
        checkpoint = torch.load(path, map_location="cpu")
        config = checkpoint.get("config", {})
        model = cls(**config)
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()
        return model
