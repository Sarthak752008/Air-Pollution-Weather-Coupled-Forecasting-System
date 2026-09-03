'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import {
  Station,
  Observation,
  ForecastResponse,
  HealthResponse,
  AtmosphericRegime,
  DerivedIndices,
  ActiveFirePoint,
  TransportCorridor,
  ForecastExplanation
} from '@/lib/types';

import Header from '@/components/layout/Header';
import CurrentStatus from '@/components/status/CurrentStatus';
import StationPanel from '@/components/stations/StationPanel';
import AtmosphericRegimeCard from '@/components/atmospheric/AtmosphericRegimeCard';
import DerivedIndicesGrid from '@/components/atmospheric/DerivedIndicesGrid';
import ForecastExplainer from '@/components/atmospheric/ForecastExplainer';

// Dynamically import map and chart to avoid SSR issues
const DelhiMap = dynamic(() => import('@/components/map/DelhiMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-slate-900 border border-slate-800 rounded-lg animate-pulse flex items-center justify-center text-slate-500 text-sm">
      Loading interactive Delhi NCR map...
    </div>
  ),
});

const ForecastChart = dynamic(() => import('@/components/charts/ForecastChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-slate-900 border border-slate-800 rounded-lg animate-pulse flex items-center justify-center text-slate-500 text-sm">
      Loading 72-hour forecast projection...
    </div>
  ),
});

export default function Dashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [observations, setObservations] = useState<Record<string, Observation>>({});
  const [selectedStationId, setSelectedStationId] = useState<string | null>('anand_vihar');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Phase 2 State
  const [regime, setRegime] = useState<AtmosphericRegime | null>(null);
  const [indices, setIndices] = useState<DerivedIndices | null>(null);
  const [activeFires, setActiveFires] = useState<ActiveFirePoint[]>([]);
  const [transportCorridors, setTransportCorridors] = useState<TransportCorridor[]>([]);
  const [dominantWindDir, setDominantWindDir] = useState<number>(300);
  const [windSpeed, setWindSpeed] = useState<number>(3.2);
  const [explanation, setExplanation] = useState<ForecastExplanation | null>(null);

  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingAtmospheric, setLoadingAtmospheric] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoadingStations(true);
      setLoadingAtmospheric(true);

      const [
        stationsRes,
        obsRes,
        healthRes,
        regimeRes,
        indicesRes,
        firesRes,
        transportRes
      ] = await Promise.all([
        api.getStations(),
        api.getObservations(),
        api.getHealth().catch(() => null),
        api.getAtmosphericRegime().catch(() => null),
        api.getDerivedIndices().catch(() => null),
        api.getActiveFires().catch(() => null),
        api.getTransportCorridors().catch(() => null),
      ]);

      setStations(stationsRes.stations);

      const obsMap: Record<string, Observation> = {};
      obsRes.observations.forEach((obs) => {
        obsMap[obs.station_id] = obs;
      });
      setObservations(obsMap);
      setLastUpdated(obsRes.last_updated);

      if (healthRes) setHealth(healthRes);
      if (regimeRes) setRegime(regimeRes);
      if (indicesRes) setIndices(indicesRes);
      if (firesRes) setActiveFires(firesRes.fires || []);
      if (transportRes) {
        setTransportCorridors(transportRes.corridors || []);
        setDominantWindDir(transportRes.dominant_wind_direction || 300);
        setWindSpeed(transportRes.wind_speed_ms || 3.2);
      }

      setError(null);

      // Default station forecast & explainer
      fetchStationDetails('anand_vihar');
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError('Failed to load dashboard data. The backend server may be starting up or unreachable.');
    } finally {
      setLoadingStations(false);
      setLoadingAtmospheric(false);
    }
  };

  const fetchObservations = async () => {
    try {
      const res = await api.getObservations();
      const obsMap: Record<string, Observation> = {};
      res.observations.forEach((obs) => {
        obsMap[obs.station_id] = obs;
      });
      setObservations(obsMap);
      setLastUpdated(res.last_updated);
    } catch (err) {
      console.error('Failed to refresh observations:', err);
    }
  };

  const fetchStationDetails = async (stationId: string) => {
    try {
      setLoadingForecast(true);
      const [fcRes, expRes] = await Promise.all([
        api.getForecast(stationId).catch(() => null),
        api.getForecastExplanation(stationId).catch(() => null),
      ]);
      setForecast(fcRes);
      setExplanation(expRes);
    } catch (err) {
      console.error('Failed to fetch station details:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Auto-refresh observations every 5 minutes
    const interval = setInterval(fetchObservations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    fetchStationDetails(stationId);
  };

  const stationsWithObs = useMemo(() => {
    return stations.map((station) => ({
      ...station,
      observation: observations[station.id],
    }));
  }, [stations, observations]);

  const selectedObservation = selectedStationId ? observations[selectedStationId] || null : null;
  const selectedStation = stations.find((s) => s.id === selectedStationId) || null;
  const mode = health?.mode || 'DEMO';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header mode={mode} lastUpdated={lastUpdated} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 flex flex-col gap-5">
        {error && (
          <div className="bg-rose-950/60 border border-rose-900/60 text-rose-300 p-3.5 rounded-lg text-xs">
            {error}
          </div>
        )}

        {/* 1. Atmospheric Regime Intelligence Card */}
        <section>
          <AtmosphericRegimeCard regime={regime} loading={loadingAtmospheric} />
        </section>

        {/* 2. Interactive Map with Layer Controls */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Delhi NCR & Regional Transport Map
              </h2>
              <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-800">
                40 CAAQMS Stations • NASA FIRMS Hotspots
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Click any station pin to update forecast and feature drivers
            </span>
          </div>

          <DelhiMap
            stations={stationsWithObs}
            onSelectStation={handleSelectStation}
            selectedStationId={selectedStationId}
            activeFires={activeFires}
            transportCorridors={transportCorridors}
            windDirection={dominantWindDir}
            windSpeedMs={windSpeed}
            inversionRiskScore={indices?.inversion_risk_score ?? 45}
          />
        </section>

        {/* 3. Current Selected Station Status & Derived Indices Grid */}
        <section className="flex flex-col gap-3">
          <CurrentStatus observation={selectedObservation} loading={loadingStations} />
          <DerivedIndicesGrid indices={indices} loading={loadingAtmospheric} />
        </section>

        {/* 4. Forecast Dynamics & Explainability Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: 72-Hour PM2.5 Forecast Chart */}
          <div className="flex flex-col gap-2">
            <ForecastChart forecast={forecast} loading={loadingForecast} />
          </div>

          {/* Right: "Why is Pollution Expected to Change?" Explainer */}
          <div className="flex flex-col gap-2">
            <ForecastExplainer explanation={explanation} loading={loadingForecast} />
          </div>
        </section>

        {/* 5. Comprehensive Station Pollutant & Meteorology Breakdown */}
        <section>
          <StationPanel observation={selectedObservation} station={selectedStation} />
        </section>
      </main>
    </div>
  );
}
