'use client';

import React, { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station, Observation, ActiveFirePoint, TransportCorridor } from '@/lib/types';
import { clsx } from 'clsx';
import { Flame, Wind, Compass, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface StationWithObs extends Station {
  observation?: Observation;
}

interface DelhiMapProps {
  stations: StationWithObs[];
  onSelectStation: (stationId: string) => void;
  selectedStationId: string | null;
  activeFires?: ActiveFirePoint[];
  transportCorridors?: TransportCorridor[];
  windDirection?: number;
  windSpeedMs?: number;
  inversionRiskScore?: number;
}

const getAqiColor = (aqi: number | null): string => {
  if (aqi === null) return '#64748b'; // slate-500
  if (aqi <= 50) return '#22c55e'; // emerald
  if (aqi <= 100) return '#84cc16'; // lime
  if (aqi <= 200) return '#eab308'; // yellow
  if (aqi <= 300) return '#f97316'; // orange
  if (aqi <= 400) return '#ef4444'; // red
  return '#7c3aed'; // violet
};

export default function DelhiMap({
  stations,
  onSelectStation,
  selectedStationId,
  activeFires = [],
  transportCorridors = [],
  windDirection = 300,
  windSpeedMs = 3.2,
  inversionRiskScore = 45,
}: DelhiMapProps) {
  const [popupInfo, setPopupInfo] = useState<StationWithObs | null>(null);
  const [firePopup, setFirePopup] = useState<ActiveFirePoint | null>(null);

  // Layer Toggles
  const [showFires, setShowFires] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showInversion, setShowInversion] = useState(true);

  // Station Markers
  const stationMarkers = useMemo(() => stations.map((station) => {
    const aqi = station.observation?.aqi ?? null;
    const color = getAqiColor(aqi);
    const isSelected = station.id === selectedStationId;

    return (
      <Marker
        key={station.id}
        longitude={station.longitude}
        latitude={station.latitude}
        anchor="center"
        onClick={(e: any) => {
          e.originalEvent.stopPropagation();
          onSelectStation(station.id);
          setPopupInfo(station);
          setFirePopup(null);
        }}
      >
        <div
          className={clsx(
            "flex items-center justify-center rounded-full text-[10px] font-bold text-white cursor-pointer transition-transform shadow-md",
            isSelected ? "w-8 h-8 scale-110 ring-2 ring-white/60 z-20" : "w-6 h-6 hover:scale-110"
          )}
          style={{ backgroundColor: color }}
        >
          {aqi !== null ? aqi : '--'}
        </div>
      </Marker>
    );
  }), [stations, selectedStationId, onSelectStation]);

  // Active Fire Markers
  const fireMarkers = useMemo(() => {
    if (!showFires) return null;
    return activeFires.slice(0, 45).map((fire) => (
      <Marker
        key={fire.id}
        longitude={fire.longitude}
        latitude={fire.latitude}
        anchor="center"
        onClick={(e: any) => {
          e.originalEvent.stopPropagation();
          setFirePopup(fire);
          setPopupInfo(null);
        }}
      >
        <div
          className="cursor-pointer group flex items-center justify-center p-1 rounded-full bg-orange-600/30 border border-orange-500/80 hover:scale-125 transition-transform shadow-lg"
          title={`Active Fire: ${fire.frp} MW`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute opacity-75" />
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 relative" />
        </div>
      </Marker>
    ));
  }, [activeFires, showFires]);

  // Regional Wind Direction Indicators (grid sample points)
  const windMarkers = useMemo(() => {
    if (!showWind) return null;
    const gridPoints = [
      { id: 'w1', lat: 28.9, lon: 76.9 },
      { id: 'w2', lat: 28.7, lon: 77.4 },
      { id: 'w3', lat: 28.4, lon: 77.0 },
      { id: 'w4', lat: 28.4, lon: 77.3 },
      { id: 'w5', lat: 28.6, lon: 77.2 },
      { id: 'w6', lat: 29.2, lon: 76.6 },
    ];

    return gridPoints.map((pt) => (
      <Marker key={pt.id} longitude={pt.lon} latitude={pt.lat} anchor="center">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/60 border border-slate-700/50 text-sky-400 pointer-events-none shadow-sm backdrop-blur-xs"
          style={{ transform: `rotate(${windDirection}deg)` }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-4 4m4-4l4 4" />
          </svg>
        </div>
      </Marker>
    ));
  }, [showWind, windDirection]);

  // GeoJSON Line data for Transport Corridors
  const corridorGeoJson = useMemo(() => {
    if (!showCorridors || transportCorridors.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: transportCorridors.map((c) => ({
        type: 'Feature' as const,
        properties: {
          id: c.id,
          risk: c.transport_risk,
          speed: c.wind_speed_kmh,
          hours: c.estimated_transit_hours
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: c.coordinates
        }
      }))
    };
  }, [showCorridors, transportCorridors]);

  return (
    <div className="w-full h-[520px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative">
      {/* Map Layer Controls Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg shadow-xl backdrop-blur-sm">
        <button
          onClick={() => setShowFires(!showFires)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            showFires
              ? 'bg-orange-950/80 text-orange-300 border border-orange-800/80'
              : 'bg-slate-950/60 text-slate-500 border border-transparent hover:text-slate-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          Active Fires {activeFires.length > 0 && `(${activeFires.length})`}
        </button>

        <button
          onClick={() => setShowWind(!showWind)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            showWind
              ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80'
              : 'bg-slate-950/60 text-slate-500 border border-transparent hover:text-slate-400'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-sky-400" />
          Wind ({windSpeedMs.toFixed(1)} m/s, {windDirection.toFixed(0)}°)
        </button>

        <button
          onClick={() => setShowCorridors(!showCorridors)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            showCorridors
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
              : 'bg-slate-950/60 text-slate-500 border border-transparent hover:text-slate-400'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          Transport Corridors
        </button>

        <button
          onClick={() => setShowInversion(!showInversion)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            showInversion
              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
              : 'bg-slate-950/60 text-slate-500 border border-transparent hover:text-slate-400'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Inversion Risk ({inversionRiskScore.toFixed(0)}/100)
        </button>
      </div>

      {/* Transport Disclaimer Banner */}
      <div className="absolute bottom-2 left-3 right-12 z-10 pointer-events-none">
        <span className="text-[10px] text-slate-400 bg-slate-950/80 border border-slate-800/90 px-2 py-0.5 rounded shadow">
          ⚠️ Estimated transport trajectory based on prevailing wind advection; not an exact chemical source apportionment.
        </span>
      </div>

      <Map
        initialViewState={{
          longitude: 77.2090,
          latitude: 28.6139,
          zoom: 9.6
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Transport Corridors Layer */}
        {corridorGeoJson && (
          <Source id="transport-corridors-src" type="geojson" data={corridorGeoJson}>
            <Layer
              id="transport-corridors-line"
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 2.2,
                'line-opacity': 0.75,
                'line-dasharray': [3, 2]
              }}
            />
          </Source>
        )}

        {/* Markers */}
        {windMarkers}
        {fireMarkers}
        {stationMarkers}

        {/* Station Popup */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            offset={15}
          >
            <div className="p-2.5">
              <div className="font-semibold text-sm mb-1 text-slate-100">{popupInfo.name}</div>
              <div className="text-xs flex items-center gap-2 mb-1">
                <span className="text-slate-300">AQI: <strong className="text-slate-100">{popupInfo.observation?.aqi ?? 'N/A'}</strong></span>
                {popupInfo.observation?.aqi_category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700" style={{ backgroundColor: `${getAqiColor(popupInfo.observation.aqi)}30` }}>
                    {popupInfo.observation.aqi_category}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                PM2.5: <span className="font-mono text-slate-200">{popupInfo.observation?.pollutants.pm25 ?? '--'} µg/m³</span>
              </div>
            </div>
          </Popup>
        )}

        {/* Fire Popup */}
        {firePopup && (
          <Popup
            anchor="bottom"
            longitude={firePopup.longitude}
            latitude={firePopup.latitude}
            onClose={() => setFirePopup(null)}
            closeOnClick={false}
            offset={12}
          >
            <div className="p-2">
              <div className="font-semibold text-xs text-orange-400 flex items-center gap-1 mb-1">
                <Flame className="w-3 h-3" />
                NASA FIRMS Active Fire
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>FRP: <strong className="font-mono text-orange-300">{firePopup.frp} MW</strong></div>
                <div>Brightness: <span className="font-mono text-slate-300">{firePopup.brightness} K</span></div>
                <div>Confidence: <span className="capitalize text-slate-300">{firePopup.confidence}</span></div>
                <div className="text-[10px] text-slate-500 pt-0.5">{firePopup.acq_date} {firePopup.acq_time} UTC ({firePopup.source})</div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
