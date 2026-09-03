'use client';

import React, { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station, Observation, ActiveFirePoint, TransportCorridor } from '@/lib/types';
import { clsx } from 'clsx';
import { Flame, Wind, Compass, AlertCircle, Layers, Eye, EyeOff } from 'lucide-react';

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
  className?: string;
  activeMetric?: 'aqi' | 'pm25' | 'o3';
}

const getAqiColor = (aqi: number | null): string => {
  if (aqi === null) return '#64748b'; // slate-500
  if (aqi <= 50) return '#10b981'; // emerald
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
  className = '',
  activeMetric = 'aqi'
}: DelhiMapProps) {
  const [hoveredStation, setHoveredStation] = useState<StationWithObs | null>(null);
  const [firePopup, setFirePopup] = useState<ActiveFirePoint | null>(null);

  // Layer Toggles
  const [showFires, setShowFires] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showInversion, setShowInversion] = useState(false);

  // Station Markers
  const stationMarkers = useMemo(() => stations.map((station) => {
    const obs = station.observation;
    const aqi = obs?.aqi ?? null;
    const pm25 = obs?.pollutants.pm25 ?? null;
    const o3 = obs?.pollutants.o3 ?? null;

    let displayValue: string | number = '--';
    if (activeMetric === 'aqi') displayValue = aqi !== null ? aqi : '--';
    else if (activeMetric === 'pm25') displayValue = pm25 !== null ? Math.round(pm25) : '--';
    else if (activeMetric === 'o3') displayValue = o3 !== null ? Math.round(o3) : '--';

    const color = getAqiColor(aqi);
    const isSelected = station.id === selectedStationId;
    const isSevere = aqi !== null && aqi > 300;

    return (
      <Marker
        key={station.id}
        longitude={station.longitude}
        latitude={station.latitude}
        anchor="center"
        onClick={(e: any) => {
          e.originalEvent.stopPropagation();
          onSelectStation(station.id);
          setFirePopup(null);
        }}
      >
        <div
          onMouseEnter={() => setHoveredStation(station)}
          onMouseLeave={() => setHoveredStation(null)}
          className={clsx(
            "relative flex items-center justify-center rounded-full text-[10px] font-bold text-white cursor-pointer transition-all duration-200 shadow-md font-mono",
            isSelected
              ? "w-8 h-8 scale-115 ring-2 ring-white z-20 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              : "w-6 h-6 hover:scale-115 hover:z-10"
          )}
          style={{ backgroundColor: color }}
        >
          {isSevere && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-35" style={{ backgroundColor: color }} />
          )}
          {displayValue}
        </div>
      </Marker>
    );
  }), [stations, selectedStationId, onSelectStation, activeMetric]);

  // Active Fire Markers
  const fireMarkers = useMemo(() => {
    if (!showFires) return null;
    return activeFires.slice(0, 40).map((fire) => (
      <Marker
        key={fire.id}
        longitude={fire.longitude}
        latitude={fire.latitude}
        anchor="center"
        onClick={(e: any) => {
          e.originalEvent.stopPropagation();
          setFirePopup(fire);
        }}
      >
        <div
          className="cursor-pointer group flex items-center justify-center p-1 rounded-full bg-orange-600/30 border border-orange-500/80 hover:scale-125 transition-transform"
          title={`Active Fire: ${fire.frp} MW`}
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute opacity-60" />
          <div className="w-2 h-2 rounded-full bg-orange-500 relative" />
        </div>
      </Marker>
    ));
  }, [activeFires, showFires]);

  // Regional Wind Streamline Vectors
  const windMarkers = useMemo(() => {
    if (!showWind) return null;
    const gridPoints = [
      { id: 'w1', lat: 28.88, lon: 76.92 },
      { id: 'w2', lat: 28.72, lon: 77.38 },
      { id: 'w3', lat: 28.45, lon: 77.02 },
      { id: 'w4', lat: 28.42, lon: 77.32 },
      { id: 'w5', lat: 28.62, lon: 77.21 },
      { id: 'w6', lat: 29.15, lon: 76.68 },
    ];

    return gridPoints.map((pt) => (
      <Marker key={pt.id} longitude={pt.lon} latitude={pt.lat} anchor="center">
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full bg-[#070b12]/80 border border-white/10 text-sky-400 pointer-events-none shadow-xs backdrop-blur-xs"
          style={{ transform: `rotate(${windDirection}deg)` }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19V5m0 0l-4 4m4-4l4 4" />
          </svg>
        </div>
      </Marker>
    ));
  }, [showWind, windDirection]);

  // Transport Corridors GeoJSON
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
    <div className={`relative w-full h-full bg-[#06090e] overflow-hidden ${className}`}>
      {/* Top Left Floating Layer Controls Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-[#070b12]/90 border border-white/[0.1] p-1.5 rounded-lg shadow-xl backdrop-blur-md text-xs">
        <button
          onClick={() => setShowWind(!showWind)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showWind
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-sky-400" />
          <span>Wind {windSpeedMs.toFixed(1)} m/s ({windDirection.toFixed(0)}°)</span>
        </button>

        <button
          onClick={() => setShowFires(!showFires)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showFires
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Fires ({activeFires.length})</span>
        </button>

        <button
          onClick={() => setShowCorridors(!showCorridors)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showCorridors
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Corridors</span>
        </button>

        <button
          onClick={() => setShowInversion(!showInversion)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            showInversion
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Inversion {inversionRiskScore.toFixed(0)}/100</span>
        </button>
      </div>

      {/* Bottom Right Floating Compact Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-[#070b12]/90 border border-white/[0.08] px-3 py-2 rounded-lg shadow-xl backdrop-blur-md text-[10px] font-mono text-slate-300 flex items-center gap-3">
        <span className="text-slate-500 uppercase tracking-wider">NAQI:</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> 0-50</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#84cc16]" /> 51-100</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#eab308]" /> 101-200</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f97316]" /> 201-300</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> 301-400</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> 401+</span>
        </div>
      </div>

      {/* Main Map Canvas */}
      <Map
        initialViewState={{
          longitude: 77.2090,
          latitude: 28.6139,
          zoom: 9.8
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Transport Corridors GeoJSON */}
        {corridorGeoJson && (
          <Source id="transport-corridors-src" type="geojson" data={corridorGeoJson}>
            <Layer
              id="transport-corridors-line"
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 2,
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

        {/* Hover Tooltip */}
        {hoveredStation && (
          <Popup
            anchor="bottom"
            longitude={hoveredStation.longitude}
            latitude={hoveredStation.latitude}
            closeButton={false}
            closeOnClick={false}
            offset={14}
          >
            <div className="p-2 text-xs">
              <div className="font-bold text-white mb-0.5">{hoveredStation.name}</div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-300">AQI: <strong className="text-white">{hoveredStation.observation?.aqi ?? '--'}</strong></span>
                <span className="text-slate-400">PM2.5: <strong className="text-sky-300">{hoveredStation.observation?.pollutants.pm25?.toFixed(1) ?? '--'}</strong></span>
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
            <div className="p-2 text-xs">
              <div className="font-bold text-orange-400 flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5" />
                NASA FIRMS Thermal Anomaly
              </div>
              <div className="space-y-0.5 text-[11px] font-mono text-slate-300">
                <div>FRP: <strong className="text-orange-300">{firePopup.frp} MW</strong></div>
                <div>Brightness: {firePopup.brightness} K</div>
                <div>Acquired: {firePopup.acq_date} {firePopup.acq_time} UTC</div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
