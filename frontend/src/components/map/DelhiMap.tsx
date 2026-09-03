'use client';

import React, { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station, Observation } from '@/lib/types';
import { clsx } from 'clsx';

interface StationWithObs extends Station {
  observation?: Observation;
}

interface DelhiMapProps {
  stations: StationWithObs[];
  onSelectStation: (stationId: string) => void;
  selectedStationId: string | null;
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

export default function DelhiMap({ stations, onSelectStation, selectedStationId }: DelhiMapProps) {
  const [popupInfo, setPopupInfo] = useState<StationWithObs | null>(null);

  const markers = useMemo(() => stations.map((station) => {
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
        }}
      >
        <div
          className={clsx(
            "flex items-center justify-center rounded-full text-[10px] font-bold text-white cursor-pointer transition-transform shadow-sm",
            isSelected ? "w-8 h-8 scale-110 ring-2 ring-white/50 z-10" : "w-6 h-6 hover:scale-110"
          )}
          style={{ backgroundColor: color }}
        >
          {aqi !== null ? aqi : '--'}
        </div>
      </Marker>
    );
  }), [stations, selectedStationId, onSelectStation]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
      <Map
        initialViewState={{
          longitude: 77.2090,
          latitude: 28.6139,
          zoom: 10
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        {markers}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            offset={15}
          >
            <div className="p-2">
              <div className="font-semibold text-sm mb-1">{popupInfo.name}</div>
              <div className="text-xs flex items-center gap-2">
                <span>AQI: {popupInfo.observation?.aqi ?? 'N/A'}</span>
                {popupInfo.observation?.aqi_category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${getAqiColor(popupInfo.observation.aqi)}40` }}>
                    {popupInfo.observation.aqi_category}
                  </span>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
