'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, redirect } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CalendarModal } from '@/components/calendar/CalendarModal';
import { TasksTab } from '@/components/dashboard/TasksTab';
import { HabitsTab } from '@/components/dashboard/HabitsTab';
import { ReflectionTab } from '@/components/dashboard/ReflectionTab';
import { ScheduleTab } from '@/components/dashboard/ScheduleTab';
import { MilestonesSummary } from '@/components/dashboard/MilestonesSummary';
import {
  getTasks,
  getHabits,
  getHabitLog,
  getReflection,
  getDailySchedule,
  getIdealSchedule,
  getActiveMilestonesForDashboard,
} from '@/lib/firebase/firestore';
import { isValidDateString, getToday } from '@/lib/utils/date';
import { calculateStreak } from '@/lib/utils/habit';
import type { Task, Habit, HabitLog, Reflection, DailySchedule, IdealScheduleBlock, Milestone } from '@/lib/types';

type TabId = 'tasks' | 'habits' | 'schedule' | 'reflection';

const TABS: { id: TabId; label: string }[] = [
  { id: 'tasks', label: 'タスク' },
  { id: 'habits', label: '習慣' },
  { id: 'schedule', label: 'スケジュール' },
  { id: 'reflection', label: '振り返り' },
];

export default function DashboardPage() {
  const params = useParams();
  const date = params.date as string;

  // 不正な日付は今日にリダイレクト
  if (!isValidDateString(date)) {
    redirect(`/dashboard/${getToday()}`);
  }

  return (
    <ProtectedRoute>
      <DashboardContent date={date} />
    </ProtectedRoute>
  );
}

function DashboardContent({ date }: { date: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLog, setHabitLog] = useState<HabitLog | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [idealSchedule, setIdealSchedule] = useState<IdealScheduleBlock[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [t, h, hl, r, ds, is, ms] = await Promise.all([
        getTasks(user.uid, date),
        getHabits(user.uid),
        getHabitLog(user.uid, date),
        getReflection(user.uid, date),
        getDailySchedule(user.uid, date),
        getIdealSchedule(user.uid),
        getActiveMilestonesForDashboard(user.uid),
      ]);
      setTasks(t);
      setHabits(h);
      setHabitLog(hl);
      setReflection(r);
      setDailySchedule(ds);
      setIdealSchedule(is);
      setMilestones(ms);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reloadTasks = useCallback(async () => {
    if (!user) return;
    setTasks(await getTasks(user.uid, date));
  }, [user, date]);

  const reloadHabitLog = useCallback(async () => {
    if (!user) return;
    setHabitLog(await getHabitLog(user.uid, date));
  }, [user, date]);

  const reloadReflection = useCallback(async () => {
    if (!user) return;
    setReflection(await getReflection(user.uid, date));
  }, [user, date]);

  const reloadSchedule = useCallback(async () => {
    if (!user) return;
    setDailySchedule(await getDailySchedule(user.uid, date));
  }, [user, date]);

  const today = getToday();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header date={date} onCalendarOpen={() => setCalendarOpen(true)} />

      <MilestonesSummary milestones={milestones} today={today} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <TasksTab date={date} tasks={tasks} onTasksChange={reloadTasks} />
            )}
            {activeTab === 'habits' && (
              <HabitsTab
                date={date}
                habits={habits}
                habitLog={habitLog}
                streaks={streaks}
                onHabitLogChange={reloadHabitLog}
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleTab
                date={date}
                dailySchedule={dailySchedule}
                idealSchedule={idealSchedule}
                onScheduleChange={reloadSchedule}
              />
            )}
            {activeTab === 'reflection' && (
              <ReflectionTab
                date={date}
                reflection={reflection}
                onReflectionChange={reloadReflection}
              />
            )}
          </>
        )}
      </div>

      <BottomNav />

      <CalendarModal
        selectedDate={date}
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
}
