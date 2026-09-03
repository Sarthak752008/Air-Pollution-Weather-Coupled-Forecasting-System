export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  operating_agency: string;
  zone_type: string;
  is_active: boolean;
}

export interface PollutantData {
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  nh3: number | null;
}

export interface MeteoData {
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
}

export interface Observation {
  station_id: string;
  station_name: string;
  timestamp: string;
  pollutants: PollutantData;
  meteorology: MeteoData;
  aqi: number | null;
  aqi_category: string | null;
  aqi_color: string | null;
  prominent_pollutant: string | null;
  source: string;
  mode: string;
}

export interface ForecastPoint {
  hour_offset: number;
  timestamp: string;
  pm25_predicted: number;
  aqi_predicted: number | null;
  aqi_category: string | null;
}

export interface ForecastResponse {
  station_id: string;
  station_name: string;
  created_at: string;
  model_version: string;
  mode: string;
  horizon_hours: number;
  points: ForecastPoint[];
}

export interface ProviderStatus {
  name: string;
  status: 'connected' | 'error' | 'not_configured';
  last_check: string | null;
  message: string | null;
}

export interface HealthResponse {
  status: string;
  mode: string;
  version: string;
  uptime_seconds: number;
  providers: ProviderStatus[];
}

export interface DataFreshness {
  mode: string;
  last_observation_time: string | null;
  last_forecast_time: string | null;
  observation_count: number;
  station_count: number;
}

// ── Phase 2 Atmospheric Intelligence Types ──

export interface AtmosphericRegime {
  regime: string;
  confidence: number;
  explanation: string;
  severity_level: 'low' | 'moderate' | 'high' | 'severe';
  timestamp: string;
  mode: string;
}

export interface DerivedIndices {
  ventilation_index: number;
  ventilation_category: string;
  stagnation_index: number;
  inversion_risk_score: number;
  wind_transport_indicator: number;
  timestamp: string;
  mode: string;
}

export interface ActiveFirePoint {
  id: string;
  latitude: number;
  longitude: number;
  frp: number;
  brightness: number;
  confidence: string;
  acq_date: string;
  acq_time: string;
  satellite: string;
  source: string;
}

export interface ActiveFiresResponse {
  fires: ActiveFirePoint[];
  count: number;
  total_frp: number;
  mode: string;
  last_updated: string;
}

export interface TransportCorridor {
  id: string;
  origin_cluster: string;
  destination: string;
  bearing_degrees: number;
  wind_speed_kmh: number;
  estimated_transit_hours: number;
  transport_risk: 'low' | 'moderate' | 'elevated' | 'severe';
  coordinates: [number, number][];
}

export interface TransportResponse {
  corridors: TransportCorridor[];
  dominant_wind_direction: number;
  wind_speed_ms: number;
  disclaimer: string;
  mode: string;
}

export interface DriverAttribution {
  factor: string;
  impact: 'trapping' | 'clearing' | 'advection' | 'emission';
  contribution_pct: number;
  description: string;
}

export interface ForecastExplanation {
  station_id: string;
  station_name: string;
  summary: string;
  regime: string;
  primary_driver: string;
  secondary_driver: string;
  dispersion_rating: string;
  drivers: DriverAttribution[];
  mode: string;
}
