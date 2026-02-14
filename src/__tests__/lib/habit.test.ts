import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Habit, HabitLog } from '@/lib/types';
import {
  isHabitApplicable,
  isHabitCompleted,
  calculateStreak,
  calculateCompletionRate,
} from '@/lib/utils/habit';

const ts = Timestamp.now();

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    title: 'Test Habit',
    frequency: 'daily',
    isActive: true,
    order: 0,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function makeHabitLog(date: string, completedIds: string[]): HabitLog {
  return {
    date,
    completedHabitIds: completedIds,
    updatedAt: ts,
  };
}

describe('habit utils', () => {
  describe('isHabitApplicable', () => {
    it('daily の習慣はどの曜日でも該当する', () => {
      const habit = makeHabit({ frequency: 'daily' });
      expect(isHabitApplicable(habit, '2026-02-16')).toBe(true); // 月曜
      expect(isHabitApplicable(habit, '2026-02-14')).toBe(true); // 土曜
      expect(isHabitApplicable(habit, '2026-02-15')).toBe(true); // 日曜
    });

    it('weekdays の習慣は平日のみ該当する', () => {
      const habit = makeHabit({ frequency: 'weekdays' });
      expect(isHabitApplicable(habit, '2026-02-16')).toBe(true);  // 月曜
      expect(isHabitApplicable(habit, '2026-02-20')).toBe(true);  // 金曜
      expect(isHabitApplicable(habit, '2026-02-14')).toBe(false); // 土曜
      expect(isHabitApplicable(habit, '2026-02-15')).toBe(false); // 日曜
    });

    it('weekends の習慣は週末のみ該当する', () => {
      const habit = makeHabit({ frequency: 'weekends' });
      expect(isHabitApplicable(habit, '2026-02-14')).toBe(true);  // 土曜
      expect(isHabitApplicable(habit, '2026-02-15')).toBe(true);  // 日曜
      expect(isHabitApplicable(habit, '2026-02-16')).toBe(false); // 月曜
    });

    it('custom の習慣は指定曜日のみ該当する', () => {
      const habit = makeHabit({ frequency: 'custom', customDays: [1, 3, 5] }); // 月水金
      expect(isHabitApplicable(habit, '2026-02-16')).toBe(true);  // 月曜
      expect(isHabitApplicable(habit, '2026-02-18')).toBe(true);  // 水曜
      expect(isHabitApplicable(habit, '2026-02-20')).toBe(true);  // 金曜
      expect(isHabitApplicable(habit, '2026-02-17')).toBe(false); // 火曜
    });

    it('非アクティブな習慣は該当しない', () => {
      const habit = makeHabit({ isActive: false });
      expect(isHabitApplicable(habit, '2026-02-14')).toBe(false);
    });

    it('custom で customDays が未設定の場合は該当しない', () => {
      const habit = makeHabit({ frequency: 'custom' }); // customDays なし
      expect(isHabitApplicable(habit, '2026-02-14')).toBe(false);
    });
  });

  describe('isHabitCompleted', () => {
    it('完了した習慣を判定する', () => {
      const log = makeHabitLog('2026-02-14', ['habit-1', 'habit-2']);
      expect(isHabitCompleted('habit-1', log)).toBe(true);
      expect(isHabitCompleted('habit-3', log)).toBe(false);
    });

    it('ログが null の場合は未完了', () => {
      expect(isHabitCompleted('habit-1', null)).toBe(false);
    });
  });

  describe('calculateStreak', () => {
    it('連続達成日数を計算する', () => {
      const logs = [
        makeHabitLog('2026-02-14', ['habit-1']),
        makeHabitLog('2026-02-13', ['habit-1']),
        makeHabitLog('2026-02-12', ['habit-1']),
      ];
      expect(calculateStreak('habit-1', logs, '2026-02-14')).toBe(3);
    });

    it('途切れた場合はそこまでのストリークを返す', () => {
      const logs = [
        makeHabitLog('2026-02-14', ['habit-1']),
        makeHabitLog('2026-02-13', []), // 未完了
        makeHabitLog('2026-02-12', ['habit-1']),
      ];
      expect(calculateStreak('habit-1', logs, '2026-02-14')).toBe(1);
    });

    it('今日未完了ならストリーク0', () => {
      const logs = [
        makeHabitLog('2026-02-14', []), // 今日は未完了
        makeHabitLog('2026-02-13', ['habit-1']),
      ];
      expect(calculateStreak('habit-1', logs, '2026-02-14')).toBe(0);
    });

    it('ログが空の場合はストリーク0', () => {
      expect(calculateStreak('habit-1', [], '2026-02-14')).toBe(0);
    });
  });

  describe('calculateCompletionRate', () => {
    it('達成率を正しく計算する', () => {
      const habits = [
        makeHabit({ id: 'h1', frequency: 'daily' }),
        makeHabit({ id: 'h2', frequency: 'daily' }),
        makeHabit({ id: 'h3', frequency: 'weekdays' }),
      ];
      // 土曜日: daily の h1, h2 のみ該当, h3 (weekdays) は非該当
      const log = makeHabitLog('2026-02-14', ['h1']);
      const result = calculateCompletionRate(habits, log, '2026-02-14');
      expect(result).toEqual({ completed: 1, total: 2 });
    });

    it('ログが null の場合は完了数0', () => {
      const habits = [makeHabit({ id: 'h1' })];
      const result = calculateCompletionRate(habits, null, '2026-02-14');
      expect(result).toEqual({ completed: 0, total: 1 });
    });

    it('該当する習慣がない場合は total 0', () => {
      const habits = [makeHabit({ id: 'h1', frequency: 'weekdays' })];
      // 土曜日: weekdays は非該当
      const result = calculateCompletionRate(habits, null, '2026-02-14');
      expect(result).toEqual({ completed: 0, total: 0 });
    });
  });
});
