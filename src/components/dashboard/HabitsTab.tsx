'use client';

import { useCallback } from 'react';
import { Flame } from 'lucide-react';
import type { Habit, HabitLog } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { saveHabitLog } from '@/lib/firebase/firestore';
import { isHabitApplicable, isHabitCompleted, calculateCompletionRate } from '@/lib/utils/habit';

interface HabitsTabProps {
  date: string;
  habits: Habit[];
  habitLog: HabitLog | null;
  streaks: Record<string, number>;
  onHabitLogChange: () => void;
}

export function HabitsTab({ date, habits, habitLog, streaks, onHabitLogChange }: HabitsTabProps) {
  const { user } = useAuth();
  const { completed, total } = calculateCompletionRate(habits, habitLog, date);

  const handleToggle = useCallback(async (habitId: string) => {
    if (!user) return;
    const currentIds = habitLog?.completedHabitIds ?? [];
    const newIds = currentIds.includes(habitId)
      ? currentIds.filter(id => id !== habitId)
      : [...currentIds, habitId];
    await saveHabitLog(user.uid, date, newIds);
    onHabitLogChange();
  }, [user, date, habitLog, onHabitLogChange]);

  const applicableHabits = habits.filter(h => isHabitApplicable(h, date));
  const nonApplicableHabits = habits.filter(h => h.isActive && !isHabitApplicable(h, date));

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        習慣 ({completed}/{total} 達成)
      </h2>

      {applicableHabits.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          今日該当する習慣はありません
        </p>
      )}

      <ul className="space-y-2">
        {applicableHabits.map(habit => {
          const done = isHabitCompleted(habit.id, habitLog);
          const streak = streaks[habit.id] ?? 0;

          return (
            <li
              key={habit.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => handleToggle(habit.id)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span
                className={`flex-1 text-sm ${
                  done
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {habit.title}
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame size={14} />
                  {streak}日
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {nonApplicableHabits.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs text-gray-400 mb-2">今日は対象外</h3>
          <ul className="space-y-1">
            {nonApplicableHabits.map(habit => (
              <li key={habit.id} className="text-sm text-gray-300 dark:text-gray-600 pl-2">
                {habit.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
