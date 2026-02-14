import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Milestone } from '@/lib/types';
import {
  calculateProgress,
  getActiveMilestones,
  isOverdue,
} from '@/lib/utils/milestone';

const ts = Timestamp.now();

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'ms-1',
    goalId: 'goal-1',
    title: 'Test Milestone',
    targetDate: '2026-06-01',
    status: 'pending',
    order: 0,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

describe('milestone utils', () => {
  describe('calculateProgress', () => {
    it('進捗率を正しく計算する', () => {
      const milestones = [
        makeMilestone({ id: 'ms-1', status: 'completed' }),
        makeMilestone({ id: 'ms-2', status: 'in_progress' }),
        makeMilestone({ id: 'ms-3', status: 'pending' }),
        makeMilestone({ id: 'ms-4', status: 'completed' }),
      ];
      const result = calculateProgress(milestones);
      expect(result).toEqual({ completed: 2, total: 4, percentage: 50 });
    });

    it('全完了で 100% を返す', () => {
      const milestones = [
        makeMilestone({ status: 'completed' }),
        makeMilestone({ status: 'completed' }),
      ];
      expect(calculateProgress(milestones).percentage).toBe(100);
    });

    it('空配列で 0% を返す', () => {
      expect(calculateProgress([])).toEqual({ completed: 0, total: 0, percentage: 0 });
    });

    it('端数を四捨五入する', () => {
      const milestones = [
        makeMilestone({ status: 'completed' }),
        makeMilestone({ status: 'pending' }),
        makeMilestone({ status: 'pending' }),
      ];
      // 1/3 = 33.33...% → 33%
      expect(calculateProgress(milestones).percentage).toBe(33);
    });
  });

  describe('getActiveMilestones', () => {
    it('未完了のマイルストーンのみ返す', () => {
      const milestones = [
        makeMilestone({ id: 'ms-1', status: 'completed', targetDate: '2026-01-01' }),
        makeMilestone({ id: 'ms-2', status: 'in_progress', targetDate: '2026-03-01' }),
        makeMilestone({ id: 'ms-3', status: 'pending', targetDate: '2026-02-01' }),
      ];
      const active = getActiveMilestones(milestones);
      expect(active).toHaveLength(2);
      expect(active[0].id).toBe('ms-3'); // 期限が早い方が先
      expect(active[1].id).toBe('ms-2');
    });

    it('全て完了の場合は空配列を返す', () => {
      const milestones = [
        makeMilestone({ status: 'completed' }),
      ];
      expect(getActiveMilestones(milestones)).toHaveLength(0);
    });
  });

  describe('isOverdue', () => {
    it('期限超過を正しく判定する', () => {
      const ms = makeMilestone({ targetDate: '2026-02-01', status: 'pending' });
      expect(isOverdue(ms, '2026-02-14')).toBe(true);
    });

    it('期限内は超過でない', () => {
      const ms = makeMilestone({ targetDate: '2026-06-01', status: 'pending' });
      expect(isOverdue(ms, '2026-02-14')).toBe(false);
    });

    it('完了済みは超過でない', () => {
      const ms = makeMilestone({ targetDate: '2026-01-01', status: 'completed' });
      expect(isOverdue(ms, '2026-02-14')).toBe(false);
    });
  });
});
