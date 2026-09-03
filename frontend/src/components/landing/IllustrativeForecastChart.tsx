'use client';

import React from 'react';
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

const ILLUSTRATIVE_POINTS = [
  { horizon: 'Now', hour: 0, pm25: 185, lower: 165, upper: 205, aqi: 245 },
  { horizon: '+6h', hour: 6, pm25: 240, lower: 215, upper: 265, aqi: 290 },
  { horizon: '+12h', hour: 12, pm25: 275, lower: 240, upper: 310, aqi: 318 },
  { horizon: '+18h', hour: 18, pm25: 210, lower: 180, upper: 240, aqi: 260 },
  { horizon: '+24h', hour: 24, pm25: 160, lower: 130, upper: 190, aqi: 210 },
  { horizon: '+36h', hour: 36, pm25: 230, lower: 195, upper: 265, aqi: 280 },
  { horizon: '+48h', hour: 48, pm25: 285, lower: 240, upper: 330, aqi: 325 },
  { horizon: '+60h', hour: 60, pm25: 205, lower: 160, upper: 250, aqi: 255 },
  { horizon: '+72h', hour: 72, pm25: 155, lower: 115, upper: 195, aqi: 205 },
];

export default function IllustrativeForecastChart() {
  return (
    <div className="bg-[#0c111a] border border-white/[0.08] rounded-xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              72-Hour Coupled Trajectory Projection
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Illustrative Forecast
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Physics-AI Blended PM2.5 trajectory with 10th–90th percentile boundary-layer uncertainty ribbon
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400" />
            <span>Blended Mean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 bg-sky-500/20 rounded-xs" />
            <span>90% Confidence</span>
          </div>
        </div>
      </div>

      <div className="h-64 md:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={ILLUSTRATIVE_POINTS} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="horizon"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              unit=" µg"
              tickLine={false}
              domain={[100, 360]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#06090e', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              formatter={(val: any, name: any) => [
                `${val} µg/m³`,
                name === 'pm25' ? 'PM2.5 Projection' : name
              ]}
              labelFormatter={(label) => `Horizon: ${label}`}
            />
            <ReferenceLine
              y={250}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: 'Severe Threshold (250)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={120}
              stroke="#f97316"
              strokeDasharray="4 4"
              label={{ value: 'Poor (120)', fill: '#f97316', fontSize: 10, position: 'insideBottomRight' }}
            />

            {/* Uncertainty Band */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#38bdf8"
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#0c111a"
              fillOpacity={1.0}
            />

            {/* Mean Trajectory Line */}
            <Line
              type="monotone"
              dataKey="pm25"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#38bdf8', stroke: '#06090e', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-white/[0.06] mt-2 gap-2">
        <span>Model: Spatio-Temporal GNN-Transformer coupled with WRF-Chem v4.4 Residual Blending</span>
        <span className="italic">*Static illustrative scenario showing nocturnal inversion peak at +12h & +48h</span>
      </div>
    </div>
  );
}
