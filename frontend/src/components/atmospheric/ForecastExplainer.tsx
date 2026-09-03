'use client';

import React from 'react';
import { ForecastExplanation } from '@/lib/types';
import { HelpCircle, ArrowUpRight, ArrowDownRight, Wind, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  explanation: ForecastExplanation | null;
  loading?: boolean;
}

export default function ForecastExplainer({ explanation, loading }: Props) {
  if (loading || !explanation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 animate-pulse h-64">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-3 bg-slate-800/60 rounded w-full mb-2"></div>
        <div className="h-3 bg-slate-800/60 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Why is Pollution Expected to Change?
              <span className="text-[11px] font-normal text-slate-400">
                — {explanation.station_name}
              </span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Physics-guided atmospheric attribution & coupled meteorological drivers
            </span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
          Dispersion: <span className="font-semibold text-slate-100">{explanation.dispersion_rating}</span>
        </span>
      </div>

      {/* Physical Summary Statement */}
      <div className="bg-slate-950/70 border border-slate-800/60 rounded p-3 text-xs text-slate-300 leading-relaxed">
        {explanation.summary}
      </div>

      {/* Primary and Secondary Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/30">
              Primary Driver
            </span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-normal mt-1">
            {explanation.primary_driver}
          </p>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/30">
              Secondary Driver
            </span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-normal mt-1">
            {explanation.secondary_driver}
          </p>
        </div>
      </div>

      {/* Feature Attribution Breakdown */}
      <div>
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          Atmospheric Factor Attribution Breakdown
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {explanation.drivers.map((d, i) => {
            const isTrapping = d.impact === 'trapping';
            const isClearing = d.impact === 'clearing';
            const isAdvection = d.impact === 'advection';

            return (
              <div
                key={i}
                className="bg-slate-950/40 border border-slate-800/60 rounded p-2.5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-slate-200">{d.factor}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                        isTrapping
                          ? 'text-rose-400 bg-rose-950/30'
                          : isClearing
                          ? 'text-emerald-400 bg-emerald-950/30'
                          : isAdvection
                          ? 'text-orange-400 bg-orange-950/30'
                          : 'text-slate-400 bg-slate-800/40'
                      }`}
                    >
                      {d.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {d.description}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-300 shrink-0">
                  {d.contribution_pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
