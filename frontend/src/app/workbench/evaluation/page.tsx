'use client';

import React from 'react';
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader';
import WorkbenchSidebar from '@/components/workbench/WorkbenchSidebar';
import WorkbenchEvaluation from '@/components/workbench/WorkbenchEvaluation';
import { useRouter } from 'next/navigation';

export default function EvaluationSubpage() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#06090e] text-slate-100 flex flex-col font-sans select-none">
      <WorkbenchHeader mode="DEMO" />
      <div className="flex-1 flex overflow-hidden">
        <WorkbenchSidebar
          currentView="evaluation"
          onSelectView={(v) => {
            if (v === 'overview') router.push('/workbench');
            else if (v === 'what-if') router.push('/workbench/scenarios');
            else router.push('/workbench');
          }}
          collapsed={false}
          onToggleCollapse={() => {}}
        />
        <WorkbenchEvaluation />
      </div>
    </div>
  );
}
