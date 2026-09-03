'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Station, Observation, ForecastResponse, HealthResponse } from '@/lib/types';

import Header from '@/components/layout/Header';
import CurrentStatus from '@/components/status/CurrentStatus';
import StationPanel from '@/components/stations/StationPanel';

// Dynamically import map and chart to avoid SSR issues
const DelhiMap = dynamic(() => import('@/components/map/DelhiMap'), { ssr: false, loading: () => <div className="w-full h-[500px] bg-slate-900 border border-slate-800 rounded-lg animate-pulse" /> });
const ForecastChart = dynamic(() => import('@/components/charts/ForecastChart'), { ssr: false, loading: () => <div className="w-full h-[350px] bg-slate-900 border border-slate-800 rounded-lg animate-pulse" /> });

export default function Dashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [observations, setObservations] = useState<Record<string, Observation>>({});
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoadingStations(true);
      const [stationsRes, obsRes, healthRes] = await Promise.all([
        api.getStations(),
        api.getObservations(),
        api.getHealth().catch(() => null)
      ]);

      setStations(stationsRes.stations);
      
      const obsMap: Record<string, Observation> = {};
      obsRes.observations.forEach(obs => {
        obsMap[obs.station_id] = obs;
      });
      setObservations(obsMap);
      setLastUpdated(obsRes.last_updated);
      
      if (healthRes) {
        setHealth(healthRes);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError('Failed to load dashboard data. The backend might be unreachable.');
    } finally {
      setLoadingStations(false);
    }
  };

  const fetchObservations = async () => {
    try {
      const res = await api.getObservations();
      const obsMap: Record<string, Observation> = {};
      res.observations.forEach(obs => {
        obsMap[obs.station_id] = obs;
      });
      setObservations(obsMap);
      setLastUpdated(res.last_updated);
    } catch (err) {
      console.error('Failed to refresh observations:', err);
    }
  };

  const fetchForecast = async (stationId: string) => {
    try {
      setLoadingForecast(true);
      const res = await api.getForecast(stationId);
      setForecast(res);
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
      setForecast(null);
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
    fetchForecast(stationId);
  };

  const stationsWithObs = useMemo(() => {
    return stations.map(station => ({
      ...station,
      observation: observations[station.id]
    }));
  }, [stations, observations]);

  const selectedObservation = selectedStationId ? observations[selectedStationId] || null : null;
  const selectedStation = stations.find(s => s.id === selectedStationId) || null;
  const mode = health?.mode || 'LIVE';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header mode={mode} lastUpdated={lastUpdated} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Map Section */}
        <section>
          {loadingStations ? (
            <div className="w-full h-[500px] bg-slate-900 border border-slate-800 rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-slate-500">Loading map data...</span>
            </div>
          ) : (
            <DelhiMap 
              stations={stationsWithObs} 
              onSelectStation={handleSelectStation}
              selectedStationId={selectedStationId}
            />
          )}
        </section>

        {/* Current Status Bar */}
        <section>
          <CurrentStatus 
            observation={selectedObservation} 
            loading={loadingStations}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Section */}
          <section className="lg:col-span-1">
            <ForecastChart 
              forecast={forecast} 
              loading={loadingForecast}
            />
          </section>

          {/* Station Details Section */}
          <section className="lg:col-span-1">
            <StationPanel 
              observation={selectedObservation} 
              station={selectedStation} 
            />
          </section>
        </div>
      </main>
    </div>
  );
}
