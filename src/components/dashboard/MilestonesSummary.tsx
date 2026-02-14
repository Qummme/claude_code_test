'use client';

import { Target } from 'lucide-react';
import type { Milestone } from '@/lib/types';
import { isOverdue } from '@/lib/utils/milestone';

interface MilestonesSummaryProps {
  milestones: Milestone[];
  today: string;
}

export function MilestonesSummary({ milestones, today }: MilestonesSummaryProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950 border-b border-blue-100 dark:border-blue-900">
      <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-2">
        <Target size={14} />
        進行中のマイルストーン
      </h2>
      <ul className="space-y-1">
        {milestones.slice(0, 5).map(ms => (
          <li key={ms.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span>•</span>
            <span className="flex-1 truncate">{ms.title}</span>
            <span className={`text-xs shrink-0 ${
              isOverdue(ms, today)
                ? 'text-red-500'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {ms.targetDate.slice(5).replace('-', '/')} 期限
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
