'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Database,
  Share2,
  Layers,
  Cpu,
  ShieldCheck,
  Compass,
  SlidersHorizontal
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STAGES = [
  {
    step: '01',
    title: 'Multi-Source Data Ingestion',
    subtitle: 'CPCB CAAQMS + IMD Weather + NASA FIRMS Satellites',
    description:
      'Continuous hourly ingestion from 40 Delhi NCR ground stations, numerical boundary-layer meteorology, and regional active thermal hotspots.',
    icon: Database,
    accent: '#38bdf8',
  },
  {
    step: '02',
    title: 'Wind-Aware Graph Construction',
    subtitle: 'Dynamic Advection-Modulated Laplacian',
    description:
      'Stations are linked in a spatial graph where edge weights modulate dynamically with wind bearing, modeling physical pollutant transport corridors.',
    icon: Share2,
    accent: '#60a5fa',
  },
  {
    step: '03',
    title: 'Atmospheric Regime Detection',
    subtitle: 'Dispersion, Inversion & Stagnation Indexing',
    description:
      'Classifies ambient stability into physical states (Strong Inversion, Stagnation, High Ventilation, Rain Washout, or Regional Transport).',
    icon: Layers,
    accent: '#f59e0b',
  },
  {
    step: '04',
    title: 'Spatio-Temporal AI Forecasting',
    subtitle: 'Graph Convolution + Multi-Head Temporal Attention',
    description:
      'Deep hybrid network captures both immediate neighborhood spatial dependencies and 72-hour multi-horizon temporal trend evolutions.',
    icon: Cpu,
    accent: '#a855f7',
  },
  {
    step: '05',
    title: 'WRF-Chem Physics Residual Blending',
    subtitle: 'Eulerian Chemistry + Machine-Learned Boundary Layer Correction',
    description:
      'Combines numerical atmospheric chemistry transport with AI bias correction, eliminating nocturnal inversion under-prediction while storing complete provenance.',
    icon: ShieldCheck,
    accent: '#10b981',
  },
  {
    step: '06',
    title: 'Physical Explainability & Attribution',
    subtitle: 'Ranked Physical Drivers',
    description:
      'Decomposes pollution changes into quantifiable atmospheric drivers: boundary layer compression, advective flushing, or upstream smoke advection.',
    icon: Compass,
    accent: '#38bdf8',
  },
  {
    step: '07',
    title: 'What-If Decision Support Lab',
    subtitle: 'Counterfactual Policy Perturbations',
    description:
      'Simulates the atmospheric impact of wind speed shifts, precipitation washout, or agricultural biomass burning abatement with uncertainty bounds.',
    icon: SlidersHorizontal,
    accent: '#f43f5e',
  },
];

export default function PipelineFlow() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.pipeline-step');
      items.forEach((item, index) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative max-w-4xl mx-auto py-8">
      {/* Central Connecting Vertical Line */}
      <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-sky-500/40 via-purple-500/30 to-emerald-500/40 transform md:-translate-x-1/2" />

      <div className="space-y-10">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isEven = idx % 2 === 0;

          return (
            <div
              key={stage.step}
              className={`pipeline-step relative flex items-start gap-6 md:gap-0 ${
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              {/* Content Card */}
              <div className="w-full md:w-[45%] pl-12 md:pl-0">
                <div className="bg-[#0c111a] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                      Stage {stage.step}
                    </span>
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: stage.accent }}
                    >
                      {stage.subtitle}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Central Node Circle */}
              <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                <div
                  className="w-10 h-10 rounded-full bg-[#06090e] border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  style={{ borderColor: stage.accent }}
                >
                  <Icon className="w-4 h-4" style={{ color: stage.accent }} />
                </div>
              </div>

              {/* Spacer on the opposite side on desktop */}
              <div className="hidden md:block w-[45%]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
