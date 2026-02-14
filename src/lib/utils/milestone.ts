import type { Milestone } from '@/lib/types';

/**
 * マイルストーンの進捗率を計算
 */
export function calculateProgress(milestones: Milestone[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = milestones.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };

  const completed = milestones.filter(m => m.status === 'completed').length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

/**
 * アクティブなマイルストーン（未完了で進行中または未着手）をフィルタ
 */
export function getActiveMilestones(milestones: Milestone[]): Milestone[] {
  return milestones
    .filter(m => m.status !== 'completed')
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
}

/**
 * マイルストーンが期限超過かどうかを判定
 */
export function isOverdue(milestone: Milestone, todayString: string): boolean {
  return milestone.status !== 'completed' && milestone.targetDate < todayString;
}
