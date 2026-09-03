'use client';

import React from 'react';
import { Observation } from '@/lib/types';
import { clsx } from 'clsx';

interface CurrentStatusProps {
  observation: Observation | null;
  loading?: boolean;
}

export default function CurrentStatus({ observation, loading }: CurrentStatusProps) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-center min-h-[80px]">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-slate-700 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-center min-h-[80px] text-slate-400 text-sm">
        Select a station on the map to view current status
      </div>
    );
  }

  const { station_name, aqi, aqi_category, aqi_color, pollutants, prominent_pollutant } = observation;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between min-h-[80px]">
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Current Station</span>
        <span className="text-lg font-semibold text-slate-100">{station_name}</span>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-400 mb-1">AQI</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: aqi_color || '#94a3b8' }}>
              {aqi ?? '--'}
            </span>
            {aqi_category && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${aqi_color}20`, color: aqi_color || '#94a3b8' }}>
                {aqi_category}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-400 mb-1">PM2.5</span>
          <span className="text-lg font-medium text-slate-200">
            {pollutants.pm25 ? `${pollutants.pm25} µg/m³` : '--'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-400 mb-1">Prominent Pollutant</span>
          <span className="text-lg font-medium text-slate-200">
            {prominent_pollutant || '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
