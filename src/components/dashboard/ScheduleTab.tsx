'use client';

import { useCallback } from 'react';
import { Copy, Plus } from 'lucide-react';
import type { DailySchedule, ScheduleBlock, IdealScheduleBlock, ScheduleBlockStatus } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { saveDailySchedule } from '@/lib/firebase/firestore';

interface ScheduleTabProps {
  date: string;
  dailySchedule: DailySchedule | null;
  idealSchedule: IdealScheduleBlock[];
  onScheduleChange: () => void;
}

const STATUS_LABELS: Record<ScheduleBlockStatus, string> = {
  planned: '予定',
  completed: '完了',
  skipped: 'スキップ',
};

const STATUS_COLORS: Record<ScheduleBlockStatus, string> = {
  planned: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  skipped: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
};

export function ScheduleTab({ date, dailySchedule, idealSchedule, onScheduleChange }: ScheduleTabProps) {
  const { user } = useAuth();
  const blocks = dailySchedule?.blocks ?? [];

  const handleCopyFromTemplate = useCallback(async () => {
    if (!user || idealSchedule.length === 0) return;
    const newBlocks: ScheduleBlock[] = idealSchedule.map(block => ({
      id: crypto.randomUUID(),
      startTime: block.startTime,
      endTime: block.endTime,
      title: block.title,
      category: block.category,
      color: block.color,
      status: 'planned',
    }));
    await saveDailySchedule(user.uid, date, { blocks: newBlocks, copiedFromIdeal: true });
    onScheduleChange();
  }, [user, date, idealSchedule, onScheduleChange]);

  const handleToggleStatus = useCallback(async (blockId: string) => {
    if (!user) return;
    const statusOrder: ScheduleBlockStatus[] = ['planned', 'completed', 'skipped'];
    const newBlocks = blocks.map(b => {
      if (b.id !== blockId) return b;
      const currentIndex = statusOrder.indexOf(b.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      return { ...b, status: nextStatus };
    });
    await saveDailySchedule(user.uid, date, {
      blocks: newBlocks,
      copiedFromIdeal: dailySchedule?.copiedFromIdeal ?? false,
    });
    onScheduleChange();
  }, [user, date, blocks, dailySchedule, onScheduleChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          今日のスケジュール
        </h2>
        <button
          onClick={handleCopyFromTemplate}
          disabled={idealSchedule.length === 0}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy size={14} />
          テンプレートからコピー
        </button>
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          スケジュールはまだありません
        </p>
      )}

      <div className="space-y-2">
        {blocks.map(block => (
          <div
            key={block.id}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            style={block.color ? { borderLeftColor: block.color, borderLeftWidth: 4 } : undefined}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">
              {block.startTime} - {block.endTime}
            </div>
            <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
              {block.title}
            </span>
            <button
              onClick={() => handleToggleStatus(block.id)}
              className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[block.status]}`}
            >
              {STATUS_LABELS[block.status]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
