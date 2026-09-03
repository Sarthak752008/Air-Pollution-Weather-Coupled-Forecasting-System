"""Spatial Graph of Delhi NCR Air Quality Monitoring Stations.

Constructs geographic topology and dynamic wind-aware directional
advection adjacency matrices for spatial message passing.
"""

import json
import os
import math
import numpy as np
from typing import List, Dict, Tuple, Optional


class StationGraph:
    """Geospatial and meteorological graph representation of Delhi NCR CAAQMS stations."""

    def __init__(
        self,
        stations_json_path: Optional[str] = None,
        sigma_km: float = 12.0,
        epsilon_threshold: float = 0.05
    ):
        if stations_json_path is None:
            # Default to data/delhi_stations.json
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            stations_json_path = os.path.join(base_dir, "data", "delhi_stations.json")

        self.stations_json_path = stations_json_path
        self.sigma_km = sigma_km
        self.epsilon_threshold = epsilon_threshold

        self.stations: List[Dict] = []
        self.station_ids: List[str] = []
        self.id_to_idx: Dict[str, int] = {}
        self.coords: np.ndarray = np.zeros((0, 2))  # (N, 2) [lat, lon]

        self.distance_matrix: np.ndarray = np.zeros((0, 0))  # (N, N) in km
        self.bearing_matrix: np.ndarray = np.zeros((0, 0))   # (N, N) in degrees [0, 360)
        self.base_adjacency: np.ndarray = np.zeros((0, 0))   # (N, N) static Gaussian

        self._load_stations()
        self._build_spatial_matrices()

    def _load_stations(self):
        """Loads 40 stations from JSON metadata."""
        if not os.path.exists(self.stations_json_path):
            raise FileNotFoundError(f"Station data not found at {self.stations_json_path}")

        with open(self.stations_json_path, "r", encoding="utf-8") as f:
            self.stations = json.load(f)

        self.station_ids = [s["id"] for s in self.stations]
        self.id_to_idx = {sid: idx for idx, sid in enumerate(self.station_ids)}
        self.coords = np.array([[s["latitude"], s["longitude"]] for s in self.stations], dtype=np.float32)

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes great-circle distance between two points in kilometers."""
        r = 6371.0  # Earth radius in km
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def _calculate_bearing(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates initial bearing (azimuth) from point 1 to point 2 in degrees [0, 360)."""
        if lat1 == lat2 and lon1 == lon2:
            return 0.0

        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = (
            math.cos(phi1) * math.sin(phi2)
            - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        )
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360.0) % 360.0

    def _build_spatial_matrices(self):
        """Constructs pairwise distance, bearing, and base Gaussian adjacency matrices."""
        n = len(self.stations)
        self.distance_matrix = np.zeros((n, n), dtype=np.float32)
        self.bearing_matrix = np.zeros((n, n), dtype=np.float32)
        self.base_adjacency = np.zeros((n, n), dtype=np.float32)

        for i in range(n):
            lat_i, lon_i = self.coords[i]
            for j in range(n):
                if i == j:
                    self.distance_matrix[i, j] = 0.0
                    self.bearing_matrix[i, j] = 0.0
                    self.base_adjacency[i, j] = 1.0  # Self-loop
                else:
                    lat_j, lon_j = self.coords[j]
                    dist = self._haversine_distance(lat_i, lon_i, lat_j, lon_j)
                    self.distance_matrix[i, j] = dist
                    self.bearing_matrix[i, j] = self._calculate_bearing(lat_i, lon_i, lat_j, lon_j)

                    # Thresholded Gaussian kernel
                    weight = math.exp(-(dist ** 2) / (2.0 * (self.sigma_km ** 2)))
                    if weight >= self.epsilon_threshold:
                        self.base_adjacency[i, j] = weight
                    else:
                        self.base_adjacency[i, j] = 0.0

    @property
    def num_nodes(self) -> int:
        return len(self.stations)

    def get_wind_aware_adjacency(
        self,
        wind_direction: float = 300.0,
        wind_speed: float = 3.0,
        beta: float = 0.8
    ) -> np.ndarray:
        """Modulates geographic adjacency with real-time atmospheric wind advection.
        
        When prevailing wind flows from station i towards station j, the edge weight
        A_ij is magnified due to physical advective mass transfer.
        """
        n = self.num_nodes
        adj = np.copy(self.base_adjacency)

        # Wind direction unit vector: wind blows TOWARDS (wind_dir + 180) % 360
        # In meteorology, wind direction is azimuth FROM which wind originates.
        # e.g., North-West wind (315°) blows towards South-East (135°).
        wind_vector_azimuth = (float(wind_direction) + 180.0) % 360.0
        ws_factor = min(1.0, max(0.1, float(wind_speed) / 5.0))

        for i in range(n):
            for j in range(n):
                if i != j and adj[i, j] > 0:
                    bearing_ij = self.bearing_matrix[i, j]
                    # Angular alignment between wind advection vector and station i->j vector
                    diff_rad = math.radians(wind_vector_azimuth - bearing_ij)
                    alignment = max(0.0, math.cos(diff_rad))

                    # Asymmetric modulation: Upwind -> Downwind edges boosted
                    adj[i, j] = adj[i, j] * (1.0 + beta * alignment * ws_factor)

        return adj

    def get_normalized_laplacian(self, adj: np.ndarray) -> np.ndarray:
        """Computes symmetric normalized graph Laplacian: D^{-1/2} (A + I) D^{-1/2}."""
        n = adj.shape[0]
        # Add self-loops if not already present
        adj_loop = adj + np.eye(n, dtype=np.float32)
        degrees = np.sum(adj_loop, axis=1)

        d_inv_sqrt = np.zeros_like(degrees, dtype=np.float32)
        mask = degrees > 0
        d_inv_sqrt[mask] = 1.0 / np.sqrt(degrees[mask])
        d_mat = np.diag(d_inv_sqrt)

        normalized = d_mat @ adj_loop @ d_mat
        return normalized.astype(np.float32)
