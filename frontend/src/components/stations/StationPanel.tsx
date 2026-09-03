'use client';

import React from 'react';
import { Observation, Station } from '@/lib/types';

interface StationPanelProps {
  observation: Observation | null;
  station: Station | null;
}

export default function StationPanel({ observation, station }: StationPanelProps) {
  if (!station) return null;

  const pollutants = observation?.pollutants;
  const meteo = observation?.meteorology;

  const DataItem = ({ label, value, unit = '' }: { label: string, value: number | string | null | undefined, unit?: string }) => (
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-slate-200">
        {value !== null && value !== undefined ? `${value} ${unit}` : '--'}
      </span>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-md font-semibold text-slate-100">{station.name}</h3>
        <p className="text-xs text-slate-400 mt-1">
          {station.city}, {station.state} • {station.operating_agency} • {station.zone_type}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°E
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-3">Pollutants</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
            <DataItem label="PM2.5" value={pollutants?.pm25} unit="µg/m³" />
            <DataItem label="PM10" value={pollutants?.pm10} unit="µg/m³" />
            <DataItem label="NO2" value={pollutants?.no2} unit="µg/m³" />
            <DataItem label="SO2" value={pollutants?.so2} unit="µg/m³" />
            <DataItem label="CO" value={pollutants?.co} unit="mg/m³" />
            <DataItem label="O3" value={pollutants?.o3} unit="µg/m³" />
            <DataItem label="NH3" value={pollutants?.nh3} unit="µg/m³" />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-3">Meteorology</h4>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <DataItem label="Temperature" value={meteo?.temperature} unit="°C" />
            <DataItem label="Humidity" value={meteo?.humidity} unit="%" />
            <DataItem label="Wind Speed" value={meteo?.wind_speed} unit="m/s" />
            <DataItem label="Wind Direction" value={meteo?.wind_direction} unit="°" />
          </div>
        </div>
      </div>
    </div>
  );
}
