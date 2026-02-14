import { Timestamp } from 'firebase/firestore';

// ============================================
// Task (タスク管理)
// ============================================
export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
  status: 'todo' | 'done';
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskInput = Pick<Task, 'title' | 'date'> & Partial<Pick<Task, 'description'>>;

// ============================================
// Reflection (振り返り)
// ============================================
export interface ReflectionItem {
  id: string;
  text: string;
  order: number;
}

export interface Reflection {
  date: string; // "YYYY-MM-DD" (= document ID)
  items: ReflectionItem[];
  mood?: number; // 1-5
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Habit (習慣管理)
// ============================================
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  customDays?: number[]; // 0=Sunday ... 6=Saturday
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type HabitInput = Pick<Habit, 'title' | 'frequency'> &
  Partial<Pick<Habit, 'description' | 'customDays'>>;

export interface HabitLog {
  date: string; // "YYYY-MM-DD" (= document ID)
  completedHabitIds: string[];
  updatedAt: Timestamp;
}

// ============================================
// Goal (年間目標)
// ============================================
export type GoalStatus = 'active' | 'achieved' | 'abandoned';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  year: number;
  category?: string;
  status: GoalStatus;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type GoalInput = Pick<Goal, 'title' | 'year'> &
  Partial<Pick<Goal, 'description' | 'category'>>;

// ============================================
// Milestone (マイルストーン)
// ============================================
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetDate: string; // "YYYY-MM-DD"
  status: MilestoneStatus;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MilestoneInput = Pick<Milestone, 'goalId' | 'title' | 'targetDate'> &
  Partial<Pick<Milestone, 'description'>>;

// ============================================
// Ideal Schedule (理想スケジュールテンプレート)
// ============================================
export interface IdealScheduleBlock {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  title: string;
  category?: string;
  color?: string; // HEX
  order: number;
}

// ============================================
// Daily Schedule (日次スケジュール)
// ============================================
export type ScheduleBlockStatus = 'planned' | 'completed' | 'skipped';

export interface ScheduleBlock {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  title: string;
  category?: string;
  color?: string;
  status: ScheduleBlockStatus;
}

export interface DailySchedule {
  date: string; // "YYYY-MM-DD" (= document ID)
  blocks: ScheduleBlock[];
  copiedFromIdeal: boolean;
  updatedAt: Timestamp;
}

// ============================================
// Settings (設定)
// ============================================
export interface ScheduleCategory {
  name: string;
  color: string; // HEX
}

export interface UserSettings {
  displayName: string;
  timezone: string;
  dayStartTime: string; // "HH:MM"
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  goalCategories: string[];
  scheduleCategories: ScheduleCategory[];
}

// ============================================
// Utility types
// ============================================
export type DateString = string; // "YYYY-MM-DD"
export type TimeString = string; // "HH:MM"

export interface DashboardTab {
  id: 'tasks' | 'habits' | 'schedule' | 'reflection';
  label: string;
}
