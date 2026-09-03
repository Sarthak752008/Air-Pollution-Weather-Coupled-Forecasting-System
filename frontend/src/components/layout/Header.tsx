'use client';

import React from 'react';
import ModeIndicator from '../status/ModeIndicator';
import DataFreshnessStatus from '../status/DataFreshness';

export default function Header({ mode = 'LIVE', lastUpdated }: { mode?: string, lastUpdated?: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold tracking-tight">AeroSense</h1>
        <span className="text-xs text-slate-400">Delhi NCR Air Quality Forecast</span>
      </div>
      <div className="flex items-center gap-4">
        <ModeIndicator mode={mode} />
        <DataFreshnessStatus lastUpdated={lastUpdated || null} />
      </div>
    </header>
  );
}
