'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Station,
  ScenarioResponse,
  PresetScenario,
  BlendedForecastResponse
} from '@/lib/types';
import Header from '@/components/layout/Header';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  FlaskConical,
  Wind,
  CloudRain,
  Flame,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';

export default function ScenariosPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('anand_vihar');
  const [presets, setPresets] = useState<PresetScenario[]>([]);

  // Perturbation Slider States
  const [windSpeedDelta, setWindSpeedDelta] = useState<number>(0);
  const [rainfallMm, setRainfallMm] = useState<number>(0);
  const [fireDelta, setFireDelta] = useState<number>(0);
  const [scenarioName, setScenarioName] = useState<string>('Custom Perturbation');

  // Simulation & Blending Data
  const [scenarioData, setScenarioData] = useState<ScenarioResponse | null>(null);
  const [blendedData, setBlendedData] = useState<BlendedForecastResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'scenario' | 'blending'>('scenario');
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Initial Load: Stations & Presets
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [stRes, preRes] = await Promise.all([
          api.getStations(),
          api.getScenarioPresets()
        ]);
        setStations(stRes.stations || []);
        setPresets(preRes.presets || []);
      } catch (err) {
        console.error('Failed to load stations/presets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Trigger Scenario Simulation when parameters change
  useEffect(() => {
    async function runSimulation() {
      try {
        setSimulating(true);
        const [scenRes, blendRes] = await Promise.all([
          api.simulateScenario({
            station_id: selectedStationId,
            wind_speed_delta_pct: windSpeedDelta,
            rainfall_mm: rainfallMm,
            fire_activity_delta_pct: fireDelta,
            scenario_name: scenarioName
          }),
          api.getBlendedForecast(selectedStationId)
        ]);
        setScenarioData(scenRes);
        setBlendedData(blendRes);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setSimulating(false);
      }
    }

    const timer = setTimeout(() => {
      runSimulation();
    }, 150); // slight debounce for smooth slider response

    return () => clearTimeout(timer);
  }, [selectedStationId, windSpeedDelta, rainfallMm, fireDelta, scenarioName]);

  const applyPreset = (preset: PresetScenario) => {
    setScenarioName(preset.name);
    setWindSpeedDelta(preset.wind_speed_delta_pct);
    setRainfallMm(preset.rainfall_mm);
    setFireDelta(preset.fire_activity_delta_pct);
  };

  const resetToBaseline = () => {
    setScenarioName('Baseline Forecast');
    setWindSpeedDelta(0);
    setRainfallMm(0);
    setFireDelta(0);
  };

  if (loading && !scenarioData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header mode="DEMO" />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col gap-6 animate-pulse">
          <div className="h-6 bg-slate-900 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-64 bg-slate-900 rounded-lg"></div>
            <div className="h-64 bg-slate-900 rounded-lg md:col-span-2"></div>
          </div>
        </main>
      </div>
    );
  }

  const delta = scenarioData?.summary_delta;
  const isImproved = (delta?.net_change_pm25 ?? 0) < 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header mode="DEMO" />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full flex flex-col gap-6">
        {/* Title & Scope Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-slate-100">
                What-If Decision-Support & Policy Scenario Lab
              </h2>
              <span className="text-xs bg-sky-950/80 text-sky-400 border border-sky-800/80 px-2 py-0.5 rounded font-mono">
                Phase 4 Physics Coupling
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Controlled counterfactual atmospheric perturbations evaluating advective flushing, wet scavenging, and upwind biomass burning abatement.
            </p>
          </div>

          {/* Station Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Station:</span>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Policy Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Policy Presets:
          </span>
          {presets.map((p) => {
            const isActive =
              windSpeedDelta === p.wind_speed_delta_pct &&
              rainfallMm === p.rainfall_mm &&
              fireDelta === p.fire_activity_delta_pct;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`text-xs px-3 py-1 rounded-md border transition-all ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-xs'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                {p.name}
              </button>
            );
          })}
          <button
            onClick={resetToBaseline}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 ml-auto flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Baseline
          </button>
        </div>

        {/* Main Grid: Left Controls & Right Visual Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Interactive Perturbation Sliders */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  Perturbation Parameters
                </h3>
                {simulating && (
                  <span className="text-[10px] text-sky-400 animate-pulse font-mono">
                    Simulating...
                  </span>
                )}
              </div>

              {/* 1. Wind Speed Perturbation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-sky-400" />
                    Wind Speed
                  </span>
                  <span className={`font-mono font-bold ${windSpeedDelta > 0 ? 'text-sky-400' : windSpeedDelta < 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                    {windSpeedDelta > 0 ? `+${windSpeedDelta}%` : `${windSpeedDelta}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="150"
                  step="5"
                  value={windSpeedDelta}
                  onChange={(e) => {
                    setScenarioName('Custom Perturbation');
                    setWindSpeedDelta(Number(e.target.value));
                  }}
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-80% (Severe Stagnation)</span>
                  <span>0%</span>
                  <span>+150% (Gale Flushing)</span>
                </div>
              </div>

              {/* 2. Rainfall Scavenging Slider */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    Rainfall Washout
                  </span>
                  <span className={`font-mono font-bold ${rainfallMm > 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {rainfallMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={rainfallMm}
                  onChange={(e) => {
                    setScenarioName('Custom Perturbation');
                    setRainfallMm(Number(e.target.value));
                  }}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0 mm (Dry)</span>
                  <span>15 mm (Moderate)</span>
                  <span>50 mm (Heavy Washout)</span>
                </div>
              </div>

              {/* 3. Biomass Burning Activity Slider */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    Upwind Fire Activity
                  </span>
                  <span className={`font-mono font-bold ${fireDelta < 0 ? 'text-emerald-400' : fireDelta > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {fireDelta > 0 ? `+${fireDelta}%` : `${fireDelta}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="150"
                  step="5"
                  value={fireDelta}
                  onChange={(e) => {
                    setScenarioName('Custom Perturbation');
                    setFireDelta(Number(e.target.value));
                  }}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-100% (Zero Burning)</span>
                  <span>0% (Baseline)</span>
                  <span>+150% (Severe Smoke)</span>
                </div>
              </div>
            </div>

            {/* Delta Summary Pill */}
            {delta && (
              <div className={`p-3.5 rounded-lg border flex flex-col gap-2 ${
                isImproved ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-orange-950/20 border-orange-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Net 72h Mean Impact
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                    isImproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    {isImproved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {delta.air_quality_impact}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <div className="text-xs text-slate-400">
                    {delta.mean_baseline_pm25.toFixed(1)} <span className="text-[9px]">µg</span>
                    <ArrowRight className="inline w-3 h-3 mx-1 text-slate-500" />
                    <span className="text-slate-100 font-bold">{delta.mean_scenario_pm25.toFixed(1)} µg</span>
                  </div>
                  <div className={`text-sm font-bold ${isImproved ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {delta.net_change_pm25 > 0 ? `+${delta.net_change_pm25.toFixed(1)}` : delta.net_change_pm25.toFixed(1)} µg/m³
                    <span className="text-[10px] ml-1">({delta.net_change_pct > 0 ? `+${delta.net_change_pct.toFixed(0)}` : delta.net_change_pct.toFixed(0)}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right 2 Columns: Main Chart & Inspector */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            {/* Chart View Toggle Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {activeTab === 'scenario'
                    ? 'What-If Counterfactual Comparison (PM2.5)'
                    : 'Physics-AI Residual Correction & Blending'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTab === 'scenario'
                    ? 'Baseline operational forecast vs simulated counterfactual with 10th-90th percentile uncertainty ribbon'
                    : 'Numerical Eulerian WRF-Chem output blended with machine-learned boundary layer residual bias'}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-md self-start sm:self-center">
                <button
                  onClick={() => setActiveTab('scenario')}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    activeTab === 'scenario'
                      ? 'bg-slate-800 text-slate-100 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Scenario vs Baseline
                </button>
                <button
                  onClick={() => setActiveTab('blending')}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    activeTab === 'blending'
                      ? 'bg-slate-800 text-slate-100 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WRF-Chem Blending
                </button>
              </div>
            </div>

            {/* Recharts Chart Area */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'scenario' ? (
                  <ComposedChart data={scenarioData?.points || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="hour_offset"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) => `+${val}h`}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} unit=" µg" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val: any) => [`${val} µg/m³`, '']}
                      labelFormatter={(label) => `Forecast Horizon: +${label} Hours`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <ReferenceLine y={60} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'NAAQS Moderate (60)', fill: '#eab308', fontSize: 10 }} />
                    <ReferenceLine y={120} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'NAAQS Poor (120)', fill: '#f97316', fontSize: 10 }} />

                    {/* Uncertainty Ribbon */}
                    <Area
                      type="monotone"
                      dataKey="uncertainty_upper"
                      stroke="none"
                      fill="#38bdf8"
                      fillOpacity={0.12}
                      name="Uncertainty Range (10-90%)"
                    />
                    <Area
                      type="monotone"
                      dataKey="uncertainty_lower"
                      stroke="none"
                      fill="#0f172a"
                      fillOpacity={1.0}
                    />

                    {/* Baseline Line */}
                    <Line
                      type="monotone"
                      dataKey="baseline_pm25"
                      name="Baseline Coupled Forecast"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      dot={false}
                    />

                    {/* Scenario Line */}
                    <Line
                      type="monotone"
                      dataKey="scenario_pm25"
                      name="Scenario Simulation"
                      stroke={isImproved ? '#22c55e' : '#f97316'}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={blendedData?.points || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="hour_offset"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) => `+${val}h`}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} unit=" µg" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val: any) => [`${val} µg/m³`, '']}
                      labelFormatter={(label) => `Forecast Horizon: +${label} Hours`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <ReferenceLine y={60} stroke="#eab308" strokeDasharray="4 4" />

                    {/* Raw Numerical WRF-Chem */}
                    <Line
                      type="monotone"
                      dataKey="physics_pm25"
                      name="Raw WRF-Chem v4.4 (Numerical)"
                      stroke="#a855f7"
                      strokeDasharray="4 4"
                      strokeWidth={1.8}
                      dot={false}
                    />

                    {/* AI Residual Correction */}
                    <Line
                      type="monotone"
                      dataKey="ai_residual_pm25"
                      name="AI Boundary-Layer Correction"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                    />

                    {/* Blended Production */}
                    <Line
                      type="monotone"
                      dataKey="blended_pm25"
                      name="Blended Operational Forecast"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span>Station: {scenarioData?.station_name}</span>
              <span>Horizon: 72 Hours</span>
              <span>Model: WRF-Chem v4.4 + Physics-Guided Blending</span>
            </div>
          </div>
        </div>

        {/* Explanation & Physical Attribution Panel */}
        {scenarioData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* "What Changed and Why?" */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    What Changed and Why?
                  </h3>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-3">
                  <span className="text-xs font-semibold text-slate-200 block mb-1 font-mono">
                    {scenarioData.explanation.headline}
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {scenarioData.explanation.primary_mechanisms.map((mech, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{mech}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="text-slate-500 font-semibold">Physical Rationale:</span>{' '}
                  {scenarioData.explanation.physical_rationale}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-400">Scientific Disclaimer:</span>{' '}
                {scenarioData.disclaimer}
              </div>
            </div>

            {/* Explicit Assumptions & Provenance */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Explicit Physics Assumptions
                </h3>

                <ul className="space-y-2 text-xs text-slate-300">
                  {scenarioData.assumptions.map((asm, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2 rounded border border-slate-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">{asm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Provenance Tag */}
              {blendedData && (
                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono space-y-1">
                  <div>Source: {blendedData.provenance.physics_model}</div>
                  <div>Chemistry: {blendedData.provenance.chemistry_mechanism}</div>
                  <div>Corrector: {blendedData.provenance.ai_residual_corrector}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
