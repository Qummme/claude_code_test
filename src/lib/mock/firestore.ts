/**
 * localStorage ベースのモック Firestore
 * Firebase未設定時のローカル開発用
 */
import type {
  Task,
  TaskInput,
  Reflection,
  Habit,
  HabitInput,
  HabitLog,
  Goal,
  GoalInput,
  Milestone,
  MilestoneInput,
  IdealScheduleBlock,
  DailySchedule,
  UserSettings,
} from '@/lib/types';

// ============================================
// localStorage ヘルパー
// ============================================

function getStore<T = Record<string, unknown>>(userId: string, col: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(`mock:${userId}:${col}`) || '{}');
  } catch {
    return {};
  }
}

function setStore<T>(userId: string, col: string, data: Record<string, T>): void {
  localStorage.setItem(`mock:${userId}:${col}`, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mockTimestamp() {
  return { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date() };
}

// ============================================
// Tasks (タスク)
// ============================================

export async function getTasks(userId: string, date: string): Promise<Task[]> {
  const store = getStore<Task>(userId, 'tasks');
  return Object.values(store)
    .filter(t => t.date === date)
    .sort((a, b) => a.order - b.order);
}

export async function createTask(userId: string, input: TaskInput): Promise<string> {
  const store = getStore<Task>(userId, 'tasks');
  const id = generateId();
  const ts = mockTimestamp();
  store[id] = {
    id,
    ...input,
    status: 'todo',
    order: Date.now(),
    createdAt: ts,
    updatedAt: ts,
  } as unknown as Task;
  setStore(userId, 'tasks', store);
  return id;
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'order'>>
): Promise<void> {
  const store = getStore<Task>(userId, 'tasks');
  if (store[taskId]) {
    store[taskId] = { ...store[taskId], ...data, updatedAt: mockTimestamp() } as unknown as Task;
    setStore(userId, 'tasks', store);
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const store = getStore<Task>(userId, 'tasks');
  delete store[taskId];
  setStore(userId, 'tasks', store);
}

// ============================================
// Reflections (振り返り)
// ============================================

export async function getReflection(userId: string, date: string): Promise<Reflection | null> {
  const store = getStore<Reflection>(userId, 'reflections');
  return store[date] ?? null;
}

export async function saveReflection(
  userId: string,
  date: string,
  data: Pick<Reflection, 'items' | 'mood'>
): Promise<void> {
  const store = getStore<Reflection>(userId, 'reflections');
  store[date] = {
    ...(store[date] ?? {}),
    date,
    ...data,
    updatedAt: mockTimestamp(),
  } as unknown as Reflection;
  setStore(userId, 'reflections', store);
}

// ============================================
// Habits (習慣)
// ============================================

export async function getHabits(userId: string): Promise<Habit[]> {
  const store = getStore<Habit>(userId, 'habits');
  return Object.values(store).sort((a, b) => a.order - b.order);
}

export async function createHabit(userId: string, input: HabitInput): Promise<string> {
  const store = getStore<Habit>(userId, 'habits');
  const id = generateId();
  const ts = mockTimestamp();
  store[id] = {
    id,
    ...input,
    isActive: true,
    order: Date.now(),
    createdAt: ts,
    updatedAt: ts,
  } as unknown as Habit;
  setStore(userId, 'habits', store);
  return id;
}

export async function updateHabit(
  userId: string,
  habitId: string,
  data: Partial<Pick<Habit, 'title' | 'description' | 'frequency' | 'customDays' | 'isActive' | 'order'>>
): Promise<void> {
  const store = getStore<Habit>(userId, 'habits');
  if (store[habitId]) {
    store[habitId] = { ...store[habitId], ...data, updatedAt: mockTimestamp() } as unknown as Habit;
    setStore(userId, 'habits', store);
  }
}

export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  const store = getStore<Habit>(userId, 'habits');
  delete store[habitId];
  setStore(userId, 'habits', store);
}

// ============================================
// Habit Logs (習慣ログ)
// ============================================

export async function getHabitLog(userId: string, date: string): Promise<HabitLog | null> {
  const store = getStore<HabitLog>(userId, 'habitLogs');
  return store[date] ?? null;
}

export async function saveHabitLog(
  userId: string,
  date: string,
  completedHabitIds: string[]
): Promise<void> {
  const store = getStore<HabitLog>(userId, 'habitLogs');
  store[date] = {
    date,
    completedHabitIds,
    updatedAt: mockTimestamp(),
  } as unknown as HabitLog;
  setStore(userId, 'habitLogs', store);
}

// ============================================
// Goals (年間目標)
// ============================================

export async function getGoals(userId: string, year?: number): Promise<Goal[]> {
  const store = getStore<Goal>(userId, 'goals');
  let results = Object.values(store);
  if (year !== undefined) {
    results = results.filter(g => g.year === year);
  }
  return results.sort((a, b) => a.order - b.order);
}

export async function createGoal(userId: string, input: GoalInput): Promise<string> {
  const store = getStore<Goal>(userId, 'goals');
  const id = generateId();
  const ts = mockTimestamp();
  store[id] = {
    id,
    ...input,
    status: 'active',
    order: Date.now(),
    createdAt: ts,
    updatedAt: ts,
  } as unknown as Goal;
  setStore(userId, 'goals', store);
  return id;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  data: Partial<Pick<Goal, 'title' | 'description' | 'category' | 'status' | 'order'>>
): Promise<void> {
  const store = getStore<Goal>(userId, 'goals');
  if (store[goalId]) {
    store[goalId] = { ...store[goalId], ...data, updatedAt: mockTimestamp() } as unknown as Goal;
    setStore(userId, 'goals', store);
  }
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const store = getStore<Goal>(userId, 'goals');
  delete store[goalId];
  setStore(userId, 'goals', store);
}

// ============================================
// Milestones (マイルストーン)
// ============================================

export async function getMilestones(userId: string, goalId?: string): Promise<Milestone[]> {
  const store = getStore<Milestone>(userId, 'milestones');
  let results = Object.values(store);
  if (goalId !== undefined) {
    results = results.filter(m => m.goalId === goalId);
  }
  return results.sort((a, b) => a.order - b.order);
}

export async function getActiveMilestonesForDashboard(userId: string): Promise<Milestone[]> {
  const store = getStore<Milestone>(userId, 'milestones');
  return Object.values(store)
    .filter(m => m.status === 'pending' || m.status === 'in_progress')
    .sort((a, b) => (a.targetDate > b.targetDate ? 1 : -1));
}

export async function createMilestone(userId: string, input: MilestoneInput): Promise<string> {
  const store = getStore<Milestone>(userId, 'milestones');
  const id = generateId();
  const ts = mockTimestamp();
  store[id] = {
    id,
    ...input,
    status: 'pending',
    order: Date.now(),
    createdAt: ts,
    updatedAt: ts,
  } as unknown as Milestone;
  setStore(userId, 'milestones', store);
  return id;
}

export async function updateMilestone(
  userId: string,
  milestoneId: string,
  data: Partial<Pick<Milestone, 'title' | 'description' | 'targetDate' | 'status' | 'order'>>
): Promise<void> {
  const store = getStore<Milestone>(userId, 'milestones');
  if (store[milestoneId]) {
    store[milestoneId] = { ...store[milestoneId], ...data, updatedAt: mockTimestamp() } as unknown as Milestone;
    setStore(userId, 'milestones', store);
  }
}

export async function deleteMilestone(userId: string, milestoneId: string): Promise<void> {
  const store = getStore<Milestone>(userId, 'milestones');
  delete store[milestoneId];
  setStore(userId, 'milestones', store);
}

// ============================================
// Ideal Schedule (理想スケジュール)
// ============================================

export async function getIdealSchedule(userId: string): Promise<IdealScheduleBlock[]> {
  const store = getStore<IdealScheduleBlock>(userId, 'idealSchedule');
  return Object.values(store).sort((a, b) => a.order - b.order);
}

export async function saveIdealScheduleBlock(
  userId: string,
  block: IdealScheduleBlock
): Promise<void> {
  const store = getStore<IdealScheduleBlock>(userId, 'idealSchedule');
  store[block.id] = block;
  setStore(userId, 'idealSchedule', store);
}

export async function deleteIdealScheduleBlock(userId: string, blockId: string): Promise<void> {
  const store = getStore<IdealScheduleBlock>(userId, 'idealSchedule');
  delete store[blockId];
  setStore(userId, 'idealSchedule', store);
}

// ============================================
// Daily Schedules (日次スケジュール)
// ============================================

export async function getDailySchedule(userId: string, date: string): Promise<DailySchedule | null> {
  const store = getStore<DailySchedule>(userId, 'dailySchedules');
  return store[date] ?? null;
}

export async function saveDailySchedule(
  userId: string,
  date: string,
  data: Pick<DailySchedule, 'blocks' | 'copiedFromIdeal'>
): Promise<void> {
  const store = getStore<DailySchedule>(userId, 'dailySchedules');
  store[date] = {
    date,
    ...data,
    updatedAt: mockTimestamp(),
  } as unknown as DailySchedule;
  setStore(userId, 'dailySchedules', store);
}

// ============================================
// Settings (設定)
// ============================================

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const store = getStore<UserSettings>(userId, 'settings');
  return store['general'] ?? null;
}

export async function saveSettings(userId: string, data: Partial<UserSettings>): Promise<void> {
  const store = getStore<UserSettings>(userId, 'settings');
  store['general'] = { ...(store['general'] ?? {}), ...data } as UserSettings;
  setStore(userId, 'settings', store);
}
