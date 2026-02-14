import type { Habit, HabitLog } from '@/lib/types';
import { getDayOfWeek } from './date';

/**
 * 指定日に対して、その習慣が該当するか（実行すべきか）を判定
 */
export function isHabitApplicable(habit: Habit, dateString: string): boolean {
  if (!habit.isActive) return false;

  const dayOfWeek = getDayOfWeek(dateString);

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return habit.customDays?.includes(dayOfWeek) ?? false;
    default:
      return false;
  }
}

/**
 * 指定日にその習慣が完了しているかを判定
 */
export function isHabitCompleted(habitId: string, habitLog: HabitLog | null): boolean {
  if (!habitLog) return false;
  return habitLog.completedHabitIds.includes(habitId);
}

/**
 * 連続達成日数（ストリーク）を計算する
 * habitLogs は日付降順（最新が先頭）でソート済みと仮定
 */
export function calculateStreak(
  habitId: string,
  habitLogs: HabitLog[],
  todayString: string
): number {
  let streak = 0;
  const sortedLogs = [...habitLogs].sort((a, b) => b.date.localeCompare(a.date));

  // 今日から遡って連続している日数をカウント
  let currentDate = todayString;

  for (const log of sortedLogs) {
    if (log.date > currentDate) continue;
    if (log.date < currentDate) break; // 日付が飛んでいたらストリーク終了

    if (log.completedHabitIds.includes(habitId)) {
      streak++;
      // 前日に移動
      const [y, m, d] = currentDate.split('-').map(Number);
      const prevDate = new Date(y, m - 1, d - 1);
      currentDate = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 習慣の達成率を計算（該当日のうち完了した割合）
 */
export function calculateCompletionRate(
  habits: Habit[],
  habitLog: HabitLog | null,
  dateString: string
): { completed: number; total: number } {
  const applicableHabits = habits.filter(h => isHabitApplicable(h, dateString));
  const completed = applicableHabits.filter(h => isHabitCompleted(h.id, habitLog)).length;
  return { completed, total: applicableHabits.length };
}
