'use client';

import React from 'react';
import { FileText, Share2, Layers, Cpu, ShieldCheck, Flame, Compass } from 'lucide-react';

export default function WorkbenchResearchDocs() {
  const DOCS = [
    {
      title: 'Dynamic Wind-Modulated Station Graph',
      formula: 'A_ij(t) = exp(-d_ij² / 2σ²) · max(0, cos(θ_ij - φ_wind(t)))',
      explanation:
        'Constructs dynamic spatial adjacency between all 40 CAAQMS monitoring stations in Delhi NCR. Haversine distance is modulated by the directional alignment with prevailing 10m wind velocity vectors from IMD Open-Meteo.',
      icon: Share2,
      accent: '#38bdf8',
    },
    {
      title: 'Atmospheric Dispersion & Inversion Indices',
      formula: 'VI = WS · PBLH  |  SI = (1 - WS/WS_max) · (1 - PBLH/PBLH_max) · 100',
      explanation:
        'Ventilation Index (VI) measures atmospheric dilution volume. Inversion Risk Score (IRS) and Stagnation Index (SI) quantify the severity of surface thermal capping and nocturnal particulate trapping.',
      icon: Layers,
      accent: '#f59e0b',
    },
    {
      title: 'Spatio-Temporal GNN-Transformer',
      formula: 'H^(l+1) = MultiHeadAttention(GCN(H^(l), A_dyn), H^(l))',
      explanation:
        'Hybrid deep architecture combining spatial Graph Convolutional Networks (GCN) over the wind-modulated station graph with Multi-Head Temporal Self-Attention over a 72-hour lookback window.',
      icon: Cpu,
      accent: '#a855f7',
    },
    {
      title: 'Physics-AI Residual Correction Blending',
      formula: 'y_blended(t) = y_WRF(t) + ε̂_AI(t, PBLH, WS, T, hour)',
      explanation:
        'Couples numerical Eulerian chemistry transport (WRF-Chem v4.4 RADM2-MADE/SORGAM NetCDF) with machine-learned residual bias correction, overcoming nocturnal inversion under-prediction while preserving physical provenance.',
      icon: ShieldCheck,
      accent: '#10b981',
    },
    {
      title: 'Aerosol Precipitation Scavenging (What-If Engine)',
      formula: 'C(t) = C_0 · exp(-Λ · t)  |  Λ = 1.2 × 10⁻⁴ · R^0.7 s⁻¹',
      explanation:
        'Semi-empirical aerosol wet deposition formulation used in counterfactual scenario simulations. Accurately simulates below-cloud droplet impaction and particulate washout during rainfall episodes.',
      icon: Compass,
      accent: '#60a5fa',
    },
    {
      title: 'Regional Biomass Burning Advection',
      formula: 'WTI = FRP_norm · cos(θ_fire - φ_wind) · exp(-transit_hours / τ)',
      explanation:
        'Quantifies transboundary agricultural residue burning transport from Punjab and Haryana into Delhi NCR using NASA FIRMS active thermal anomalies and wind corridor vectorization.',
      icon: Flame,
      accent: '#f97316',
    },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#06090e]">
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white">
            Research Architecture & Formulations
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.08]">
            SIH26082 Specification
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Theoretical derivations and mathematical formulations governing the AeroSense forecasting platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOCS.map((doc, idx) => {
          const Icon = doc.icon;
          return (
            <div
              key={idx}
              className="bg-[#0c111a] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 space-y-3 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${doc.accent}15`, color: doc.accent }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">{doc.title}</h3>
              </div>

              <div className="p-2.5 rounded-lg bg-[#06090e] border border-white/[0.06] font-mono text-[11px] text-sky-300 overflow-x-auto">
                {doc.formula}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {doc.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
