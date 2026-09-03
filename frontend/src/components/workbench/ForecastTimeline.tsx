'use client';

import React, { useState } from 'react';
import { ForecastResponse, BlendedForecastResponse } from '@/lib/types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Layers, ShieldCheck } from 'lucide-react';

interface ForecastTimelineProps {
  forecast: ForecastResponse | null;
  blendedForecast: BlendedForecastResponse | null;
  loading?: boolean;
}

export default function ForecastTimeline({
  forecast,
  blendedForecast,
  loading
}: ForecastTimelineProps) {
  const [activeTab, setActiveTab] = useState<'pm25' | 'o3' | 'aqi'>('pm25');
  const [showUncertainty, setShowUncertainty] = useState(true);

  if (loading) {
    return (
      <div className="h-44 bg-[#0c111a] border-t border-white/[0.08] p-4 flex items-center justify-center animate-pulse text-xs text-slate-500 font-mono">
        Computing 72-hour coupled forecast trajectory...
      </div>
    );
  }

  // Use blended points if available, otherwise regular forecast points
  const points = blendedForecast?.points || forecast?.points || [];

  if (points.length === 0) {
    return (
      <div className="h-44 bg-[#0c111a] border-t border-white/[0.08] p-4 flex items-center justify-center text-xs text-slate-500 font-mono">
        Select a monitoring station to view 72-hour forecast timeline
      </div>
    );
  }

  const formatTimeTick = (offset: number) => {
    if (offset === 0) return 'Now';
    return `+${offset}h`;
  };

  return (
    <div className="bg-[#0c111a] border-t border-white/[0.08] px-4 py-3 flex flex-col justify-between shrink-0 select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold text-white tracking-tight">
              72-Hour Atmospheric Projection
            </span>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#06090e] border border-white/[0.08] p-0.5 rounded-md text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('pm25')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeTab === 'pm25'
                  ? 'bg-sky-500/20 text-sky-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PM2.5 (µg/m³)
            </button>
            <button
              onClick={() => setActiveTab('o3')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeTab === 'o3'
                  ? 'bg-sky-500/20 text-sky-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              O₃ (µg/m³)
            </button>
            <button
              onClick={() => setActiveTab('aqi')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeTab === 'aqi'
                  ? 'bg-sky-500/20 text-sky-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Indian NAQI
            </button>
          </div>
        </div>

        {/* Right Info Tags */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <button
            onClick={() => setShowUncertainty(!showUncertainty)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              showUncertainty
                ? 'bg-white/[0.04] text-slate-300 border-white/[0.1]'
                : 'text-slate-500 border-transparent hover:text-slate-400'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Uncertainty Ribbon (10-90%)</span>
          </button>
          <span className="text-slate-500">
            Model: {blendedForecast ? 'WRF-Chem + Residual Blended' : forecast?.model_version}
          </span>
        </div>
      </div>

      {/* Trajectory Chart */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points as any[]} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} vertical={false} />
            <XAxis
              dataKey="hour_offset"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={formatTimeTick}
              tickLine={false}
              ticks={[0, 6, 12, 18, 24, 36, 48, 60, 72]}
            />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#070b12', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
              formatter={(val: any, name: any) => [
                `${typeof val === 'number' ? val.toFixed(1) : val} ${activeTab === 'aqi' ? 'NAQI' : 'µg/m³'}`,
                activeTab.toUpperCase()
              ]}
              labelFormatter={(label) => `Forecast Horizon: +${label} Hours`}
            />

            {/* Reference Thresholds */}
            {activeTab === 'pm25' && (
              <>
                <ReferenceLine y={60} stroke="#eab308" strokeDasharray="3 3" />
                <ReferenceLine y={120} stroke="#f97316" strokeDasharray="3 3" />
                <ReferenceLine y={250} stroke="#ef4444" strokeDasharray="3 3" />
              </>
            )}

            {/* Uncertainty Area Ribbon if Blended Data */}
            {showUncertainty && blendedForecast && activeTab === 'pm25' && (
              <>
                <Area
                  type="monotone"
                  dataKey="uncertainty_upper_pm25"
                  stroke="none"
                  fill="#38bdf8"
                  fillOpacity={0.12}
                />
                <Area
                  type="monotone"
                  dataKey="uncertainty_lower_pm25"
                  stroke="none"
                  fill="#0c111a"
                  fillOpacity={1.0}
                />
              </>
            )}

            {/* Primary Trajectory Line */}
            <Line
              type="monotone"
              dataKey={
                activeTab === 'pm25'
                  ? (blendedForecast ? 'blended_pm25' : 'pm25_predicted')
                  : activeTab === 'o3'
                  ? 'physics_o3'
                  : (blendedForecast ? 'aqi' : 'aqi_predicted')
              }
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#38bdf8', stroke: '#06090e', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
