'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Wind, CloudRain, Flame, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

export default function WhatIfInteractivePreview() {
  const [windPct, setWindPct] = useState<number>(30);
  const [rainMm, setRainMm] = useState<number>(0);
  const [firePct, setFirePct] = useState<number>(-50);

  // Baseline PM2.5 (Anand Vihar typical winter baseline)
  const baselinePm25 = 215.0;

  // Counterfactual response calculation
  const alphaWind = 0.42;
  const dilution = windPct >= 0 ? 1 / (1 + alphaWind * (windPct / 100)) : 1 + Math.abs(windPct / 100) * 0.65;
  const scavenging = rainMm > 0 ? 1 - Math.exp(-0.065 * Math.pow(rainMm, 0.7)) : 0;
  const smoke = baselinePm25 * 0.28;
  const local = baselinePm25 - smoke;
  const perturbedSmoke = smoke * (1 + firePct / 100);

  const scenarioPm25 = Math.max(15, (local + perturbedSmoke) * dilution * (1 - scavenging));
  const deltaPm25 = scenarioPm25 - baselinePm25;
  const deltaPct = (deltaPm25 / baselinePm25) * 100;
  const isImproved = deltaPm25 < 0;

  return (
    <div className="bg-[#0c111a] border border-white/[0.08] rounded-xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4 mb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
            Interactive Decision Support Preview
          </span>
          <h3 className="text-base font-bold text-white mt-1">
            Simulate Atmospheric Counterfactuals
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Station: Anand Vihar (CAAQMS Baseline)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Sliders */}
        <div className="space-y-5">
          {/* Wind Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                Wind Speed Delta
              </span>
              <span className={`font-mono font-bold ${windPct > 0 ? 'text-sky-400' : windPct < 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {windPct > 0 ? `+${windPct}%` : `${windPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-60"
              max="100"
              step="5"
              value={windPct}
              onChange={(e) => setWindPct(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>-60% (Stagnation)</span>
              <span>0%</span>
              <span>+100% (Ventilation)</span>
            </div>
          </div>

          {/* Rainfall */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                Precipitation Washout
              </span>
              <span className={`font-mono font-bold ${rainMm > 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                {rainMm} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="2"
              value={rainMm}
              onChange={(e) => setRainMm(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 mm (Dry)</span>
              <span>20 mm (Moderate)</span>
              <span>40 mm (Washout)</span>
            </div>
          </div>

          {/* Fire Activity */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Upwind Agricultural Fires
              </span>
              <span className={`font-mono font-bold ${firePct < 0 ? 'text-emerald-400' : firePct > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {firePct > 0 ? `+${firePct}%` : `${firePct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="10"
              value={firePct}
              onChange={(e) => setFirePct(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>-100% (Zero Burning Policy)</span>
              <span>0%</span>
              <span>+100% (Smoke Surge)</span>
            </div>
          </div>
        </div>

        {/* Counterfactual Response Card */}
        <div className="bg-[#06090e] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Simulated Forecast Impact
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                isImproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isImproved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {isImproved ? 'Dispersion & Clearing' : 'Pollution Accumulation'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Baseline PM2.5
              </span>
              <span className="text-xl font-bold font-mono text-slate-300">
                {baselinePm25.toFixed(0)} <span className="text-xs text-slate-500">µg/m³</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Scenario PM2.5
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  isImproved ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {scenarioPm25.toFixed(0)} <span className="text-xs text-slate-500">µg/m³</span>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">
              Net Predicted Shift
            </span>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-base font-bold font-mono ${
                  isImproved ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {deltaPm25 > 0 ? `+${deltaPm25.toFixed(1)}` : deltaPm25.toFixed(1)} µg/m³
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  isImproved ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {deltaPct > 0 ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}
              </span>
            </div>
          </div>

          <Link
            href="/workbench"
            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors"
          >
            <span>Run Full 72h Simulator in Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
