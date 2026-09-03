'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  EvaluationBenchmarkResponse,
  ModelEvaluationSummary,
  HorizonMetric
} from '@/lib/types';
import Header from '@/components/layout/Header';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  CheckCircle2,
  Award,
  Clock,
  Layers,
  AlertTriangle,
  Flame,
  Check,
  Zap,
  Info
} from 'lucide-react';

export default function EvaluationPage() {
  const [benchmark, setBenchmark] = useState<EvaluationBenchmarkResponse | null>(null);
  const [horizonData, setHorizonData] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('gnn_transformer_proposed');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchEvaluationData = async () => {
    try {
      setLoading(true);
      const [compRes, horRes] = await Promise.all([
        api.getModelComparison(),
        api.getHorizonEvaluation()
      ]);

      setBenchmark(compRes);
      setHorizonData(horRes.horizon_data);
      setSelectedModelId(compRes.selected_model_id || 'gnn_transformer_proposed');
    } catch (err) {
      console.error('Failed to load evaluation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluationData();
  }, []);

  const handleSelectModel = async (modelId: string) => {
    try {
      setSwitching(true);
      const res = await api.selectActiveModel(modelId);
      if (res.success) {
        setSelectedModelId(res.selected_model_id);
        setNotification(`Active forecasting engine switched to ${res.model_name}`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error('Failed to switch model:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (loading || !benchmark) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header mode="DEMO" />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col gap-6 animate-pulse">
          <div className="h-6 bg-slate-900 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-slate-900 rounded-lg border border-slate-800"></div>
            ))}
          </div>
          <div className="h-80 bg-slate-900 rounded-lg border border-slate-800"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header mode="DEMO" />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full flex flex-col gap-6">
        {/* Title & Methodology Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-100">
                Atmospheric Model Evaluation & Benchmark
              </h2>
              <span className="text-xs bg-sky-950/80 text-sky-400 border border-sky-800/80 px-2 py-0.5 rounded font-mono">
                Phase 3 Research Benchmark
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rigorous comparative evaluation using strictly chronological train/validation/test splits (no lookahead bias).
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-400 flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Dataset Chronology</span>
              <span className="font-mono text-slate-200">70% Train • 15% Val • 15% Test</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase text-slate-500 block">Airshed Network</span>
              <span className="font-mono text-slate-200">40 CAAQMS Stations</span>
            </div>
          </div>
        </div>

        {notification && (
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {notification}
          </div>
        )}

        {/* 1. Model Comparison Scorecards */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Comparative Architecture Performance (Overall PM2.5 Test Set)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benchmark.models.map((m) => {
              const isProposed = m.model_id === 'gnn_transformer_proposed';
              const isSelected = m.model_id === selectedModelId;

              return (
                <div
                  key={m.model_id}
                  className={`relative rounded-lg p-5 flex flex-col justify-between border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 ring-1 ring-sky-500/40'
                      : isProposed
                      ? 'bg-slate-900/80 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                        {m.model_id.includes('xgboost')
                          ? 'Baseline A'
                          : m.model_id.includes('gru')
                          ? 'Baseline B'
                          : 'Proposed Model'}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-100 mt-0.5">
                        {m.model_name.split(':')[1] || m.model_name}
                      </h4>
                    </div>

                    {isProposed && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                        <Award className="w-3 h-3 text-amber-400" />
                        Best Accuracy
                      </span>
                    )}
                  </div>

                  {/* Architecture & Parameter Description */}
                  <div className="text-[11px] text-slate-400 mb-4 space-y-1">
                    <div><span className="text-slate-500">Architecture:</span> {m.architecture}</div>
                    <div><span className="text-slate-500">Parameters:</span> <span className="font-mono">{m.parameters}</span></div>
                    <div><span className="text-slate-500">Version:</span> <span className="font-mono">v{m.version}</span></div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 mb-4">
                    <div className="text-center">
                      <span className="text-[10px] uppercase text-slate-500 block">MAE</span>
                      <span className="text-base font-bold font-mono text-slate-100">
                        {m.metrics_overall.mae.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">µg/m³</span>
                    </div>
                    <div className="text-center border-x border-slate-800">
                      <span className="text-[10px] uppercase text-slate-500 block">RMSE</span>
                      <span className="text-base font-bold font-mono text-slate-100">
                        {m.metrics_overall.rmse.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">µg/m³</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase text-slate-500 block">Peak F1</span>
                      <span className="text-base font-bold font-mono text-slate-100">
                        {m.peak_event_detection.f1_score.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block">&gt;250 µg</span>
                    </div>
                  </div>

                  {/* Selection Button */}
                  <button
                    onClick={() => handleSelectModel(m.model_id)}
                    disabled={switching}
                    className={`w-full py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                        Active Operational Engine
                      </>
                    ) : (
                      'Deploy for Live Forecasts'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Horizon Performance Breakdown Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">
                  Horizon Error Degradation Curve (MAE)
                </h4>
                <p className="text-xs text-slate-400">
                  Evaluation error trajectory across 6h, 12h, 24h, 48h, and 72h horizons
                </p>
              </div>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={horizonData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="horizon_hours"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `+${val}h`}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} unit=" µg" domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(value: any) => [`${value} µg/m³`, '']}
                    labelFormatter={(label) => `Forecast Horizon: +${label} Hours`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="xgboost_baseline_mae"
                    name="XGBoost (Baseline A)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lstm_gru_baseline_mae"
                    name="GRU (Baseline B)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gnn_transformer_proposed_mae"
                    name="GNN-Transformer (Proposed)"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-500 pt-2 text-center">
              The wind-aware GNN-Transformer maintains significantly lower error across extended 48h and 72h horizons.
            </div>
          </div>

          {/* 3. Peak Episode Event Detection Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Peak Pollution Episode Detection
                </h4>
                <p className="text-xs text-slate-400">
                  Binary classification metrics for severe pollution events (PM2.5 &gt; 250 µg/m³)
                </p>
              </div>
              <span className="text-[11px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                Threshold: 250 µg/m³
              </span>
            </div>

            <div className="overflow-x-auto my-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3">Architecture</th>
                    <th className="py-2 px-2 text-right">Precision</th>
                    <th className="py-2 px-2 text-right">Recall</th>
                    <th className="py-2 px-2 text-right">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {benchmark.models.map((m) => {
                    const isProposed = m.model_id === 'gnn_transformer_proposed';
                    const peak = m.peak_event_detection;

                    return (
                      <tr key={m.model_id} className={isProposed ? 'bg-emerald-950/20 text-emerald-300' : 'text-slate-300'}>
                        <td className="py-3 px-3 font-sans font-medium">
                          {m.model_name.split(':')[0]}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {(peak.precision * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 text-right">
                          {(peak.recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-slate-100">
                          {peak.f1_score.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300 font-semibold text-[11px]">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Physical Advection Advantage:
              </div>
              <p className="text-[11px] leading-relaxed">
                By modeling directional advection vectors over the spatial station graph, the GNN-Transformer anticipates multi-station severe smoke accumulation before local sensors detect concentration spikes.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Multi-Target Performance Breakdown */}
        <section className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h4 className="text-sm font-semibold text-slate-100 mb-1">
            Multi-Pollutant Forecast Accuracy (Test Set)
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Coupled prediction error across PM2.5, Ozone (O3), and composite Indian NAQI
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {benchmark.models.map((m) => (
              <div key={m.model_id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                <span className="font-semibold text-slate-200 block border-b border-slate-800 pb-1">
                  {m.model_name.split(':')[0]}
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">PM2.5 MAE</span>
                    <span className="font-bold text-slate-100">{m.metrics_by_target.pm25.mae}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">O3 MAE</span>
                    <span className="font-bold text-slate-100">{m.metrics_by_target.o3.mae}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">AQI MAE</span>
                    <span className="font-bold text-slate-100">{m.metrics_by_target.aqi.mae}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
