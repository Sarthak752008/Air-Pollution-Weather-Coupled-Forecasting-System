'use client';

import React, { useEffect, useRef } from 'react';

interface StationPoint {
  name: string;
  x: number; // percentage 0-100
  y: number;
  aqi: number;
}

const SAMPLE_STATIONS: StationPoint[] = [
  { name: 'Anand Vihar', x: 74, y: 46, aqi: 312 },
  { name: 'Punjabi Bagh', x: 38, y: 38, aqi: 245 },
  { name: 'Mandir Marg', x: 50, y: 48, aqi: 210 },
  { name: 'Lodhi Road', x: 58, y: 62, aqi: 185 },
  { name: 'Dwarka Sec 8', x: 26, y: 65, aqi: 230 },
  { name: 'Jahangirpuri', x: 44, y: 22, aqi: 285 },
  { name: 'Noida Sec 62', x: 86, y: 52, aqi: 265 },
  { name: 'Gurugram Sec 51', x: 32, y: 88, aqi: 215 },
];

export default function AtmosphericCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle streamlines for wind flow (NW to SE advection)
    const particleCount = 55;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 15 + Math.random() * 25,
      speed: 0.6 + Math.random() * 0.8,
      opacity: 0.12 + Math.random() * 0.25,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Regional Delhi NCR Airshed Gradient Field
      const centerX = width * 0.52;
      const centerY = height * 0.48;
      const grad = ctx.createRadialGradient(
        centerX,
        centerY,
        width * 0.05,
        centerX,
        centerY,
        width * 0.48
      );
      // Soft atmospheric aerosol density tint (warm amber to slate fade)
      grad.addColorStop(0, 'rgba(234, 179, 8, 0.12)');
      grad.addColorStop(0.4, 'rgba(249, 115, 22, 0.06)');
      grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.02)');
      grad.addColorStop(1, 'rgba(6, 9, 14, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stylized Delhi NCR Boundary Polygon
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      const ncrPath = [
        [0.35, 0.15],
        [0.60, 0.12],
        [0.82, 0.32],
        [0.90, 0.55],
        [0.85, 0.78],
        [0.65, 0.90],
        [0.38, 0.92],
        [0.18, 0.72],
        [0.15, 0.45],
        [0.25, 0.25],
      ];

      ctx.beginPath();
      ncrPath.forEach(([px, py], i) => {
        const x = px * width;
        const y = py * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // 3. Directional Wind Streamlines (North-West to South-East)
      const angle = Math.PI * 0.28; // ~50 degrees (NW to SE)
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      particles.forEach((p) => {
        p.x += p.speed * cosAngle;
        p.y += p.speed * sinAngle;

        // Wrap around canvas edges
        if (p.x > width + 40) p.x = -40;
        if (p.y > height + 40) p.y = -40;

        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.length * cosAngle, p.y - p.length * sinAngle);
        ctx.stroke();
        ctx.restore();
      });

      // 4. Monitoring Station Nodes
      SAMPLE_STATIONS.forEach((st, idx) => {
        const sx = (st.x / 100) * width;
        const sy = (st.y / 100) * height;

        // Pulse ring for severe station
        if (st.aqi > 300) {
          const pulseRadius = 6 + Math.sin(time * 2 + idx) * 3;
          ctx.beginPath();
          ctx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Inner solid node
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle =
          st.aqi > 300
            ? '#ef4444'
            : st.aqi > 200
            ? '#f97316'
            : st.aqi > 100
            ? '#eab308'
            : '#10b981';
        ctx.fill();

        // Label
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.75)';
        ctx.fillText(st.name, sx + 6, sy + 3);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[460px] rounded-xl border border-white/[0.08] bg-[#0c111a] overflow-hidden shadow-2xl flex flex-col justify-between p-4">
      {/* Top telemetry status bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
            Delhi NCR Airshed • Real-Time Coupled Stream
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">
          Grid: 0.1° (~10km) • WRF-Chem + CPCB
        </div>
      </div>

      {/* Main Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Bottom Timeline & Horizon Indicator */}
      <div className="z-10 bg-[#06090e]/80 backdrop-blur-sm border border-white/[0.06] rounded-lg p-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Prevailing Wind:</span>
          <span className="text-sky-400 font-bold">NW 300° (3.2 m/s)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Projection:</span>
          <div className="flex gap-1.5 text-slate-400">
            <span className="text-slate-200 font-semibold">T+0h</span>
            <span>→</span>
            <span>+12h</span>
            <span>→</span>
            <span>+24h</span>
            <span>→</span>
            <span>+48h</span>
            <span>→</span>
            <span className="text-sky-400 font-semibold">+72h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
