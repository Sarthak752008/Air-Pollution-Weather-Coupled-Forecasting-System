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
