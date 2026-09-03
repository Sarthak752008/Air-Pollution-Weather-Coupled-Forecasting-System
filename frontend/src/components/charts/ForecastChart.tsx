'use client';

import React, { useEffect, useState } from 'react';
import { ForecastResponse } from '@/lib/types';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface ForecastChartProps {
  forecast: ForecastResponse | null;
  loading?: boolean;
}

export default function ForecastChart({ forecast, loading }: ForecastChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full h-[350px] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading forecast data...</div>
      </div>
    );
  }

  if (!forecast || !forecast.points || forecast.points.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full h-[350px] flex items-center justify-center text-slate-500">
        Select a station to view forecast
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.toLocaleString('en-US', { month: 'short', day: 'numeric' })} ${date.getHours()}:00`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.timestamp);
      
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-slate-200 mb-2">
            {date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex flex-col gap-1">
            <p className="text-sky-400">PM2.5 Predicted: <span className="font-bold">{data.pm25_predicted.toFixed(1)} µg/m³</span></p>
            {data.aqi_predicted && (
              <p className="text-slate-300">AQI: <span className="font-bold">{Math.round(data.aqi_predicted)}</span> ({data.aqi_category || 'N/A'})</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isMounted) {
    return <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full h-[350px]" />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">72-Hour PM2.5 Forecast</h2>
          <p className="text-xs text-slate-400 mt-1">
            Model: {forecast.model_version} • Mode: {forecast.mode}
          </p>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecast.points}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              minTickGap={30}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={60} stroke="#eab308" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Mod (60)', fill: '#eab308', fontSize: 10 }} />
            <ReferenceLine y={120} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Poor (120)', fill: '#f97316', fontSize: 10 }} />
            
            <Line 
              type="monotone" 
              dataKey="pm25_predicted" 
              stroke="#38bdf8" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
