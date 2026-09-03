import {
  Station,
  Observation,
  ForecastResponse,
  HealthResponse,
  DataFreshness,
  AtmosphericRegime,
  DerivedIndices,
  ActiveFiresResponse,
  TransportResponse,
  ForecastExplanation
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getStations: () => fetchAPI<{ stations: Station[]; count: number }>('/api/v1/stations'),
  getObservations: (stationId?: string) => {
    const params = stationId ? `?station_id=${stationId}` : '';
    return fetchAPI<{ observations: Observation[]; mode: string; last_updated: string | null }>(`/api/v1/observations/current${params}`);
  },
  getForecast: (stationId: string) => fetchAPI<ForecastResponse>(`/api/v1/forecast/${stationId}`),
  getHealth: () => fetchAPI<HealthResponse>('/api/v1/health'),
  getDataFreshness: () => fetchAPI<DataFreshness>('/api/v1/data-freshness'),
  
  // Phase 2 Atmospheric Intelligence & Fire APIs
  getAtmosphericRegime: () => fetchAPI<AtmosphericRegime>('/api/v1/atmospheric/regime'),
  getDerivedIndices: () => fetchAPI<DerivedIndices>('/api/v1/atmospheric/indices'),
  getActiveFires: () => fetchAPI<ActiveFiresResponse>('/api/v1/fires/active'),
  getTransportCorridors: () => fetchAPI<TransportResponse>('/api/v1/transport/corridors'),
  getForecastExplanation: (stationId: string) => fetchAPI<ForecastExplanation>(`/api/v1/forecast/explain/${stationId}`),
};
