import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
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
// Helper: ユーザーのサブコレクション参照
// ============================================

function userCollection(userId: string, collectionName: string) {
  return collection(db, 'users', userId, collectionName);
}

function userDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, 'users', userId, collectionName, docId);
}

// ============================================
// Tasks (タスク)
// ============================================

export async function getTasks(userId: string, date: string): Promise<Task[]> {
  const q = query(
    userCollection(userId, 'tasks'),
    where('date', '==', date),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Task);
}

export async function createTask(userId: string, input: TaskInput): Promise<string> {
  const colRef = userCollection(userId, 'tasks');
  const docRef = doc(colRef);
  await setDoc(docRef, {
    ...input,
    status: 'todo',
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'order'>>
): Promise<void> {
  await updateDoc(userDoc(userId, 'tasks', taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'tasks', taskId));
}

// ============================================
// Reflections (振り返り)
// ============================================

export async function getReflection(userId: string, date: string): Promise<Reflection | null> {
  const snapshot = await getDoc(userDoc(userId, 'reflections', date));
  if (!snapshot.exists()) return null;
  return { date, ...snapshot.data() } as Reflection;
}

export async function saveReflection(
  userId: string,
  date: string,
  data: Pick<Reflection, 'items' | 'mood'>
): Promise<void> {
  await setDoc(
    userDoc(userId, 'reflections', date),
    {
      date,
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ============================================
// Habits (習慣)
// ============================================

export async function getHabits(userId: string): Promise<Habit[]> {
  const q = query(userCollection(userId, 'habits'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Habit);
}

export async function createHabit(userId: string, input: HabitInput): Promise<string> {
  const colRef = userCollection(userId, 'habits');
  const docRef = doc(colRef);
  await setDoc(docRef, {
    ...input,
    isActive: true,
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateHabit(
  userId: string,
  habitId: string,
  data: Partial<Pick<Habit, 'title' | 'description' | 'frequency' | 'customDays' | 'isActive' | 'order'>>
): Promise<void> {
  await updateDoc(userDoc(userId, 'habits', habitId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'habits', habitId));
}

// ============================================
// Habit Logs (習慣ログ)
// ============================================

export async function getHabitLog(userId: string, date: string): Promise<HabitLog | null> {
  const snapshot = await getDoc(userDoc(userId, 'habitLogs', date));
  if (!snapshot.exists()) return null;
  return { date, ...snapshot.data() } as HabitLog;
}

export async function saveHabitLog(
  userId: string,
  date: string,
  completedHabitIds: string[]
): Promise<void> {
  await setDoc(userDoc(userId, 'habitLogs', date), {
    date,
    completedHabitIds,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// Goals (年間目標)
// ============================================

export async function getGoals(userId: string, year?: number): Promise<Goal[]> {
  const constraints: QueryConstraint[] = [orderBy('order', 'asc')];
  if (year !== undefined) {
    constraints.unshift(where('year', '==', year));
  }
  const q = query(userCollection(userId, 'goals'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Goal);
}

export async function createGoal(userId: string, input: GoalInput): Promise<string> {
  const colRef = userCollection(userId, 'goals');
  const docRef = doc(colRef);
  await setDoc(docRef, {
    ...input,
    status: 'active',
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  data: Partial<Pick<Goal, 'title' | 'description' | 'category' | 'status' | 'order'>>
): Promise<void> {
  await updateDoc(userDoc(userId, 'goals', goalId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'goals', goalId));
}

// ============================================
// Milestones (マイルストーン)
// ============================================

export async function getMilestones(userId: string, goalId?: string): Promise<Milestone[]> {
  const constraints: QueryConstraint[] = [orderBy('order', 'asc')];
  if (goalId !== undefined) {
    constraints.unshift(where('goalId', '==', goalId));
  }
  const q = query(userCollection(userId, 'milestones'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Milestone);
}

export async function getActiveMilestonesForDashboard(userId: string): Promise<Milestone[]> {
  const q = query(
    userCollection(userId, 'milestones'),
    where('status', 'in', ['pending', 'in_progress']),
    orderBy('targetDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Milestone);
}

export async function createMilestone(userId: string, input: MilestoneInput): Promise<string> {
  const colRef = userCollection(userId, 'milestones');
  const docRef = doc(colRef);
  await setDoc(docRef, {
    ...input,
    status: 'pending',
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMilestone(
  userId: string,
  milestoneId: string,
  data: Partial<Pick<Milestone, 'title' | 'description' | 'targetDate' | 'status' | 'order'>>
): Promise<void> {
  await updateDoc(userDoc(userId, 'milestones', milestoneId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMilestone(userId: string, milestoneId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'milestones', milestoneId));
}

// ============================================
// Ideal Schedule (理想スケジュール)
// ============================================

export async function getIdealSchedule(userId: string): Promise<IdealScheduleBlock[]> {
  const q = query(userCollection(userId, 'idealSchedule'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as IdealScheduleBlock);
}

export async function saveIdealScheduleBlock(
  userId: string,
  block: IdealScheduleBlock
): Promise<void> {
  await setDoc(userDoc(userId, 'idealSchedule', block.id), block);
}

export async function deleteIdealScheduleBlock(userId: string, blockId: string): Promise<void> {
  await deleteDoc(userDoc(userId, 'idealSchedule', blockId));
}

// ============================================
// Daily Schedules (日次スケジュール)
// ============================================

export async function getDailySchedule(userId: string, date: string): Promise<DailySchedule | null> {
  const snapshot = await getDoc(userDoc(userId, 'dailySchedules', date));
  if (!snapshot.exists()) return null;
  return { date, ...snapshot.data() } as DailySchedule;
}

export async function saveDailySchedule(
  userId: string,
  date: string,
  data: Pick<DailySchedule, 'blocks' | 'copiedFromIdeal'>
): Promise<void> {
  await setDoc(userDoc(userId, 'dailySchedules', date), {
    date,
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// Settings (設定)
// ============================================

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const snapshot = await getDoc(userDoc(userId, 'settings', 'general'));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserSettings;
}

export async function saveSettings(userId: string, data: Partial<UserSettings>): Promise<void> {
  await setDoc(userDoc(userId, 'settings', 'general'), data, { merge: true });
}
