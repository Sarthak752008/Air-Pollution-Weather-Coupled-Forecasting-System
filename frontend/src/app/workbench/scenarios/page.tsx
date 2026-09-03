'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Station } from '@/lib/types';
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader';
import WorkbenchSidebar from '@/components/workbench/WorkbenchSidebar';
import WorkbenchWhatIf from '@/components/workbench/WorkbenchWhatIf';
import { useRouter } from 'next/navigation';

export default function ScenariosSubpage() {
  const [stations, setStations] = useState<Station[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.getStations().then((res) => setStations(res.stations || [])).catch(() => {});
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#06090e] text-slate-100 flex flex-col font-sans select-none">
      <WorkbenchHeader mode="DEMO" />
      <div className="flex-1 flex overflow-hidden">
        <WorkbenchSidebar
          currentView="what-if"
          onSelectView={(v) => {
            if (v === 'overview') router.push('/workbench');
            else if (v === 'evaluation') router.push('/workbench/evaluation');
            else router.push('/workbench');
          }}
          collapsed={false}
          onToggleCollapse={() => {}}
        />
        <WorkbenchWhatIf stations={stations} selectedStationId="anand_vihar" />
      </div>
    </div>
  );
}
