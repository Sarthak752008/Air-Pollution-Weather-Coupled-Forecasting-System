'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ModeIndicatorProps {
  mode: string;
}

export default function ModeIndicator({ mode }: ModeIndicatorProps) {
  const isLive = mode.toUpperCase() === 'LIVE';

  return (
    <div className={clsx(
      "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border",
      isLive ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400" : "bg-amber-950/30 border-amber-900/50 text-amber-400"
    )}>
      <span className={clsx(
        "h-1.5 w-1.5 rounded-full",
        isLive ? "bg-emerald-500" : "bg-amber-500"
      )} />
      {isLive ? 'LIVE' : (
        <span className="flex items-center gap-1">
          DEMO
          <span className="text-[10px] text-amber-500/70 ml-1">(Sample data)</span>
        </span>
      )}
    </div>
  );
}
