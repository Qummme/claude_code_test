# 設計書

自己管理アプリ（Self Management App）のアーキテクチャ・データモデル・コンポーネント設計をまとめた文書です。
コードを変更する際は、本ドキュメントの該当箇所も併せて更新してください。

---

## 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [ディレクトリ構成](#ディレクトリ構成)
- [データモデル](#データモデル)
- [ルーティング・画面構成](#ルーティング画面構成)
- [コンポーネント設計](#コンポーネント設計)
- [データアクセス層](#データアクセス層)
- [認証フロー](#認証フロー)
- [状態管理パターン](#状態管理パターン)
- [ユーティリティ関数](#ユーティリティ関数)
- [テスト設計](#テスト設計)
- [実装思想・コーディング規約](#実装思想コーディング規約)

---

## アーキテクチャ概要

```
┌──────────────────────────────────────────────┐
│  Next.js App Router (pages)                  │
│  ┌──────────────────────────────────────────┐│
│  │  React Components                        ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   ││
│  │  │Tasks │ │Habits│ │Sched.│ │Reflec│   ││
│  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘   ││
│  │     └────────┴────────┴────────┘        ││
│  │              ↓ user.uid                  ││
│  │  ┌──────────────────────────────────┐    ││
│  │  │  Data Access Layer               │    ││
│  │  │  src/lib/firebase/firestore.ts   │    ││
│  │  │  src/lib/firebase/auth.ts        │    ││
│  │  └──────────┬───────────────────────┘    ││
│  └─────────────┼────────────────────────────┘│
│           ┌────┴────┐                        │
│      ┌────┴───┐ ┌───┴─────┐                 │
│      │Firebase │ │ Mock    │                 │
│      │(本番)   │ │(ローカル)│                 │
│      │Firestore│ │localStorage│              │
│      └────────┘ └─────────┘                  │
└──────────────────────────────────────────────┘
```

### 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| 言語 | TypeScript (strict) |
| アイコン | Lucide React |
| フォーム | React Hook Form |
| D&D | @dnd-kit |
| 日付操作 | date-fns |
| 認証・DB | Firebase Auth, Firestore |
| ローカル開発 | Mock層 (localStorage) |
| テスト | Vitest, Testing Library, Playwright |

---

## ディレクトリ構成

```
src/
├── app/                          # ページ（Next.js App Router）
│   ├── layout.tsx               # ルートレイアウト（AuthProvider）
│   ├── globals.css              # グローバルCSS
│   ├── page.tsx                 # / → /dashboard リダイレクト
│   ├── login/page.tsx           # ログイン
│   ├── dashboard/
│   │   ├── page.tsx             # → /dashboard/{today} リダイレクト
│   │   └── [date]/page.tsx      # 日次ダッシュボード（4タブ）
│   ├── goals/page.tsx           # 年間目標
│   ├── schedule/page.tsx        # 理想のスケジュール
│   └── settings/page.tsx        # 設定
│
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx     # 認証コンテキスト
│   │   └── ProtectedRoute.tsx   # 認証ガード
│   ├── layout/
│   │   ├── BottomNav.tsx        # 下部ナビゲーション
│   │   └── Header.tsx           # ダッシュボードヘッダー
│   ├── dashboard/
│   │   ├── TasksTab.tsx         # タスク管理タブ
│   │   ├── HabitsTab.tsx        # 習慣トラッキングタブ
│   │   ├── ScheduleTab.tsx      # スケジュールタブ
│   │   ├── ReflectionTab.tsx    # 振り返りタブ
│   │   └── MilestonesSummary.tsx # マイルストーン表示
│   └── calendar/
│       └── CalendarModal.tsx    # カレンダー日付選択
│
├── lib/
│   ├── types/
│   │   └── index.ts             # 全型定義
│   ├── firebase/
│   │   ├── config.ts            # Firebase初期化
│   │   ├── auth.ts              # 認証関数（mock切替あり）
│   │   └── firestore.ts         # CRUD関数（mock切替あり）
│   ├── mock/
│   │   ├── auth.ts              # モック認証
│   │   └── firestore.ts         # モックFirestore（localStorage）
│   └── utils/
│       ├── date.ts              # 日付ユーティリティ
│       ├── habit.ts             # 習慣ロジック
│       └── milestone.ts         # マイルストーン計算
│
└── __tests__/
    ├── setup.ts                 # テストセットアップ
    ├── lib/                     # ユーティリティテスト
    │   ├── date.test.ts
    │   ├── habit.test.ts
    │   └── milestone.test.ts
    └── components/              # コンポーネントテスト
        ├── TasksTab.test.tsx
        ├── HabitsTab.test.tsx
        ├── Header.test.tsx
        └── ...
```

### 新規ファイル追加時のルール

| 種類 | 配置先 | 命名 |
|------|--------|------|
| ページ | `src/app/{route}/page.tsx` | page.tsx (Next.js規約) |
| コンポーネント | `src/components/{category}/` | PascalCase.tsx |
| ユーティリティ | `src/lib/utils/` | camelCase.ts |
| 型定義 | `src/lib/types/index.ts` に追記 | — |
| テスト | `src/__tests__/{lib,components}/` | 対象ファイル名.test.{ts,tsx} |

---

## データモデル

全型定義は `src/lib/types/index.ts` に集約。

### Task (タスク)

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;           // "YYYY-MM-DD"
  status: 'todo' | 'done';
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
type TaskInput = Pick<Task, 'title' | 'date'> & Partial<Pick<Task, 'description'>>;
```

Firestore: `users/{userId}/tasks/{taskId}`

### Habit (習慣)

```typescript
type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  customDays?: number[];   // 0=日 ... 6=土
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
type HabitInput = Pick<Habit, 'title' | 'frequency'> &
  Partial<Pick<Habit, 'description' | 'customDays'>>;
```

Firestore: `users/{userId}/habits/{habitId}`

### HabitLog (習慣ログ)

```typescript
interface HabitLog {
  date: string;                    // "YYYY-MM-DD" (= document ID)
  completedHabitIds: string[];
  updatedAt: Timestamp;
}
```

Firestore: `users/{userId}/habitLogs/{date}`

### Reflection (振り返り)

```typescript
interface ReflectionItem {
  id: string;
  text: string;
  order: number;
}

interface Reflection {
  date: string;             // "YYYY-MM-DD" (= document ID)
  items: ReflectionItem[];
  mood?: number;            // 1-5
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Firestore: `users/{userId}/reflections/{date}`

### Goal (年間目標)

```typescript
type GoalStatus = 'active' | 'achieved' | 'abandoned';

interface Goal {
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
type GoalInput = Pick<Goal, 'title' | 'year'> &
  Partial<Pick<Goal, 'description' | 'category'>>;
```

Firestore: `users/{userId}/goals/{goalId}`

### Milestone (マイルストーン)

```typescript
type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetDate: string;       // "YYYY-MM-DD"
  status: MilestoneStatus;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
type MilestoneInput = Pick<Milestone, 'goalId' | 'title' | 'targetDate'> &
  Partial<Pick<Milestone, 'description'>>;
```

Firestore: `users/{userId}/milestones/{milestoneId}`

### IdealScheduleBlock (理想スケジュール)

```typescript
interface IdealScheduleBlock {
  id: string;
  startTime: string;   // "HH:MM"
  endTime: string;      // "HH:MM"
  title: string;
  category?: string;
  color?: string;       // HEX
  order: number;
}
```

Firestore: `users/{userId}/idealSchedule/{blockId}`

### DailySchedule / ScheduleBlock (日次スケジュール)

```typescript
type ScheduleBlockStatus = 'planned' | 'completed' | 'skipped';

interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  category?: string;
  color?: string;
  status: ScheduleBlockStatus;
}

interface DailySchedule {
  date: string;               // "YYYY-MM-DD" (= document ID)
  blocks: ScheduleBlock[];
  copiedFromIdeal: boolean;
  updatedAt: Timestamp;
}
```

Firestore: `users/{userId}/dailySchedules/{date}`

### UserSettings (設定)

```typescript
interface UserSettings {
  displayName: string;
  timezone: string;
  dayStartTime: string;           // "HH:MM"
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  goalCategories: string[];
  scheduleCategories: ScheduleCategory[];
}
```

Firestore: `users/{userId}/settings/general`

### Firestoreコレクション構造

```
users/{userId}/
├── tasks/{taskId}
├── habits/{habitId}
├── habitLogs/{date}
├── reflections/{date}
├── goals/{goalId}
├── milestones/{milestoneId}
├── idealSchedule/{blockId}
├── dailySchedules/{date}
└── settings/general
```

---

## ルーティング・画面構成

### ルート一覧

| パス | ファイル | 認証 | 説明 |
|------|----------|------|------|
| `/` | `app/page.tsx` | 不要 | `/dashboard` にリダイレクト |
| `/login` | `app/login/page.tsx` | 不要 | Googleログイン画面 |
| `/dashboard` | `app/dashboard/page.tsx` | 必要 | `/dashboard/{today}` にリダイレクト |
| `/dashboard/[date]` | `app/dashboard/[date]/page.tsx` | 必要 | 日次ダッシュボード（4タブ） |
| `/goals` | `app/goals/page.tsx` | 必要 | 年間目標・マイルストーン |
| `/schedule` | `app/schedule/page.tsx` | 必要 | 理想のスケジュールテンプレート |
| `/settings` | `app/settings/page.tsx` | 必要 | アカウント・データ管理 |

### 下部ナビゲーション（BottomNav）

| アイコン | ラベル | リンク先 |
|----------|--------|----------|
| Home | ダッシュボード | `/dashboard` |
| Target | 目標 | `/goals` |
| Calendar | スケジュール | `/schedule` |
| Settings | 設定 | `/settings` |

### ダッシュボード 4タブ構成

| タブID | ラベル | コンポーネント | 主な機能 |
|--------|--------|----------------|----------|
| `tasks` | タスク | TasksTab | 日次ToDoの追加・完了・削除 |
| `habits` | 習慣 | HabitsTab | 習慣のチェック・達成率表示 |
| `schedule` | スケジュール | ScheduleTab | 日次スケジュール管理 |
| `reflection` | 振り返り | ReflectionTab | テキスト記録・気分5段階 |

---

## コンポーネント設計

### ページコンポーネントパターン

全ページは **Wrapper + Content** の2層構造:

```tsx
// 公開: ルートパラメータ検証 + ProtectedRoute ラッピング
export default function XxxPage() {
  return (
    <ProtectedRoute>
      <XxxContent />
    </ProtectedRoute>
  );
}

// 非公開: 実際のUI・ロジック
function XxxContent() {
  const { user } = useAuth();
  // ...
}
```

- デフォルトエクスポートはルートパラメータの検証とProtectedRouteのラッピングのみ
- Content コンポーネントは非エクスポート（ファイル内プライベート）
- `useAuth()` は Content 側で呼ぶ（ProtectedRoute の内側で確実にユーザーが存在するため）

### タブコンポーネントのpropsパターン

```tsx
interface TabProps {
  date: string;              // 表示日付
  data: DataType;            // 親から渡されるデータ
  onDataChange: () => void;  // データ更新後のリロードコールバック
}
```

- タブ自身はデータを fetch しない（親のダッシュボードが一括取得）
- 書き込み操作後に `onDataChange()` を呼び、親にリロードを委譲

### レイアウト構成

```
┌─────────────────────────┐
│  Header (sticky top)    │  ← 日付ナビ, カレンダー
├─────────────────────────┤
│  MilestonesSummary      │  ← 直近マイルストーン
├─────────────────────────┤
│  Tab Bar                │  ← 4タブ切替
├─────────────────────────┤
│                         │
│  Tab Content (p-4)      │  ← アクティブタブの内容
│                         │
├─────────────────────────┤
│  BottomNav (fixed)      │  ← 4セクションナビ
└─────────────────────────┘
```

---

## データアクセス層

### 構成

```
src/lib/firebase/
├── config.ts       # Firebase初期化, auth/db エクスポート
├── auth.ts         # signInWithGoogle, signOut, onAuthChange
└── firestore.ts    # 全CRUD関数 (28関数)

src/lib/mock/
├── auth.ts         # モック認証 (自動ログイン)
└── firestore.ts    # localStorage CRUD
```

### Mock自動切替

`auth.ts` / `firestore.ts` 内の `useMock()` で自動判定:

```typescript
function useMock(): boolean {
  return !db && typeof window !== 'undefined';
}
```

| 条件 | 動作 |
|------|------|
| Firebase環境変数あり | `db !== null` → Firebase使用 |
| Firebase環境変数なし + ブラウザ | `db === null && window存在` → モック使用 |
| Firebase環境変数なし + SSR/ビルド | `db === null && window未定義` → エラー/no-op |

### Firestore関数一覧

| コレクション | 関数 | 説明 |
|-------------|------|------|
| tasks | `getTasks(userId, date)` | 日付でフィルタ, order昇順 |
| | `createTask(userId, input)` | 新規作成, ID返却 |
| | `updateTask(userId, taskId, data)` | 部分更新 |
| | `deleteTask(userId, taskId)` | 削除 |
| reflections | `getReflection(userId, date)` | 日付で取得 |
| | `saveReflection(userId, date, data)` | 作成/マージ更新 |
| habits | `getHabits(userId)` | 全取得, order昇順 |
| | `createHabit(userId, input)` | 新規作成 |
| | `updateHabit(userId, habitId, data)` | 部分更新 |
| | `deleteHabit(userId, habitId)` | 削除 |
| habitLogs | `getHabitLog(userId, date)` | 日付で取得 |
| | `saveHabitLog(userId, date, ids)` | 完了ID配列を保存 |
| goals | `getGoals(userId, year?)` | 年でフィルタ可, order昇順 |
| | `createGoal(userId, input)` | 新規作成 |
| | `updateGoal(userId, goalId, data)` | 部分更新 |
| | `deleteGoal(userId, goalId)` | 削除 |
| milestones | `getMilestones(userId, goalId?)` | goalIdでフィルタ可 |
| | `getActiveMilestonesForDashboard(userId)` | pending/in_progress, targetDate昇順 |
| | `createMilestone(userId, input)` | 新規作成 |
| | `updateMilestone(userId, msId, data)` | 部分更新 |
| | `deleteMilestone(userId, msId)` | 削除 |
| idealSchedule | `getIdealSchedule(userId)` | 全取得, order昇順 |
| | `saveIdealScheduleBlock(userId, block)` | ブロック保存 |
| | `deleteIdealScheduleBlock(userId, id)` | 削除 |
| dailySchedules | `getDailySchedule(userId, date)` | 日付で取得 |
| | `saveDailySchedule(userId, date, data)` | 保存 |
| settings | `getSettings(userId)` | 取得 |
| | `saveSettings(userId, data)` | マージ保存 |

---

## 認証フロー

```
起動
 ├─ Firebase設定あり → onAuthStateChanged で監視
 │   ├─ ログイン済み → user セット, /dashboard へ
 │   └─ 未ログイン → /login へリダイレクト
 │       └─ Googleログインボタン → signInWithPopup → /dashboard へ
 │
 └─ Firebase設定なし (モック) → 自動ログイン
     └─ モックユーザー (uid: dev-user-001) で即座にログイン状態
```

### 認証コンテキスト

```
AuthProvider (layout.tsx)
  └─ AuthContext { user: User | null, loading: boolean }
       ├─ ProtectedRoute: loading中はスピナー, user無しは/loginへ
       └─ useAuth(): 各コンポーネントから user.uid を取得
```

---

## 状態管理パターン

### データ取得パターン

```tsx
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);

const loadData = useCallback(async () => {
  if (!user) return;
  setLoading(true);
  try {
    const result = await fetchFunction(user.uid, ...params);
    setData(result);
  } finally {
    setLoading(false);
  }
}, [user, ...params]);

useEffect(() => { loadData(); }, [loadData]);
```

- `Promise.all()` で複数データを並列取得
- `try/finally` で loading を確実にリセット（catch は不使用）
- `if (!user) return` でガード

### リロードコールバックパターン

```tsx
// 親 (ダッシュボード)
const reloadTasks = useCallback(async () => {
  if (!user) return;
  setTasks(await getTasks(user.uid, date));
}, [user, date]);

// 子 (TasksTab)
<TasksTab tasks={tasks} onTasksChange={reloadTasks} />

// 子の内部
await createTask(user.uid, input);
onTasksChange();  // 親にリロードを委譲
```

### フォーム状態パターン

```tsx
const [showForm, setShowForm] = useState(false);
const [formTitle, setFormTitle] = useState('');
// ... 各フィールド

const handleSubmit = async () => {
  if (!user || !formTitle.trim()) return;  // バリデーション
  await createXxx(user.uid, { title: formTitle.trim() });
  setFormTitle('');                          // フォームリセット
  setShowForm(false);                       // フォーム閉じる
  loadData();                               // リロード
};
```

---

## ユーティリティ関数

### date.ts

| 関数 | 説明 |
|------|------|
| `getToday()` | 今日を "YYYY-MM-DD" で返す |
| `formatDate(date)` | Date → "YYYY-MM-DD" |
| `parseDate(str)` | "YYYY-MM-DD" → Date |
| `addDays(str, n)` | n日後の日付文字列 |
| `isValidDateString(str)` | "YYYY-MM-DD" バリデーション |
| `isValidTimeString(str)` | "HH:MM" バリデーション |
| `getDayOfWeek(str)` | 曜日番号 (0=日 ~ 6=土) |
| `formatDisplayDate(str)` | 表示用フォーマット ("2月14日 (金)") |
| `getMonthDays(year, month)` | 月のカレンダー配列 |

### habit.ts

| 関数 | 説明 |
|------|------|
| `isHabitApplicable(habit, date)` | その日にその習慣が該当するか |
| `getCompletionRate(habits, log, date)` | 達成率 (%) |
| `calculateStreak(habitId, logs, today)` | 連続達成日数 |

### milestone.ts

| 関数 | 説明 |
|------|------|
| `calculateProgress(milestones)` | 進捗 {completed, total, percentage} |
| `getActiveMilestones(milestones)` | 未完了のみ, targetDate昇順 |
| `isOverdue(milestone, today)` | 期限超過判定 |

---

## テスト設計

### テスト構成

| 種別 | ツール | 対象 | 配置 |
|------|--------|------|------|
| ユニット | Vitest | ユーティリティ関数 | `src/__tests__/lib/` |
| コンポーネント | Vitest + Testing Library | UIコンポーネント | `src/__tests__/components/` |
| E2E | Playwright | 画面遷移・統合 | 別途 |

### テスト方針

- **ユーティリティ**: 全関数・全分岐を網羅。純粋関数のため境界値テスト重視
- **コンポーネント**: ユーザー操作ベース。「表示されるか」「クリックで何が起きるか」を検証
- **モック対象**: `useAuth`, `@/lib/firebase/firestore` の関数群

### テストファイル命名

```
対象: src/lib/utils/date.ts
テスト: src/__tests__/lib/date.test.ts

対象: src/components/dashboard/TasksTab.tsx
テスト: src/__tests__/components/TasksTab.test.tsx
```

### モックパターン

```tsx
// Hook のモック
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

// Firestore関数のモック
vi.mock('@/lib/firebase/firestore', () => ({
  createTask: vi.fn().mockResolvedValue('new-task-id'),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));
```

### テストデータファクトリ

```tsx
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
```

- `make{Type}` 命名
- `overrides: Partial<Type>` でデフォルト値を上書き可能

### テスト記述スタイル

```tsx
describe('date utils', () => {
  describe('formatDate', () => {
    it('Date を "YYYY-MM-DD" 形式に変換する', () => {
      expect(formatDate(new Date(2026, 1, 14))).toBe('2026-02-14');
    });
  });
});
```

- `describe` でモジュール → 関数の階層
- `it` の説明は日本語
- AAA パターン（Arrange / Act / Assert）

---

## 実装思想・コーディング規約

### 基本方針

1. **テストファースト**: 新機能・バグ修正はテストを先に書く。テストが通ることを確認してから実装完了とする
2. **シンプルさ優先**: 過度な抽象化を避ける。3回以上繰り返さない限りヘルパー化しない
3. **型安全**: `any` を使わない。Input型は `Pick` + `Partial` で最小限のフィールドのみ公開
4. **純粋関数**: ビジネスロジックは `src/lib/utils/` に純粋関数として切り出し、テスト容易性を確保

### ファイル命名

| 種類 | 命名規則 | 例 |
|------|----------|-----|
| コンポーネント | PascalCase | `TasksTab.tsx`, `BottomNav.tsx` |
| ユーティリティ | camelCase | `date.ts`, `habit.ts` |
| テスト | 対象名.test.{ts,tsx} | `date.test.ts`, `TasksTab.test.tsx` |
| ページ | `page.tsx` (Next.js規約) | `app/goals/page.tsx` |

### インポート順序

```tsx
'use client';

// 1. 外部ライブラリ (React, Next.js, etc.)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. 内部コンポーネント
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';

// 3. データアクセス関数
import { getTasks, createTask } from '@/lib/firebase/firestore';

// 4. ユーティリティ
import { formatDate } from '@/lib/utils/date';

// 5. 型（type import）
import type { Task } from '@/lib/types';
```

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `TasksTab`, `ProtectedRoute` |
| 関数 | camelCase | `getTasks`, `formatDate` |
| イベントハンドラ | `handle` + 動詞 | `handleAddTask`, `handleDelete` |
| データ取得 | `load` / `reload` + 名詞 | `loadData`, `reloadTasks` |
| コールバックprops | `on` + 名詞 + `Change` | `onTasksChange`, `onHabitLogChange` |
| 真偽値 | `is` / `show` / `has` 接頭辞 | `isActive`, `showForm`, `hasError` |
| 状態 | `[noun, setNoun]` | `[tasks, setTasks]` |
| テストデータ | `make` + 型名 | `makeHabit()`, `makeHabitLog()` |

### Tailwind CSS 規約

**ダークモード**: light と dark を必ずペアで指定

```tsx
className="bg-white dark:bg-gray-900"
className="text-gray-700 dark:text-gray-300"
```

**共通パーツの定番クラス:**

| パーツ | クラス |
|--------|--------|
| ページコンテナ | `min-h-screen bg-gray-50 dark:bg-gray-950 pb-20` |
| カード | `bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700` |
| テキスト入力 | `text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent` |
| プライマリボタン | `px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700` |
| ヘッダー | `sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40` |
| ローディング | `animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600` |

### エラーハンドリング

- **データ取得**: `try/finally` で loading をリセット。catch は不使用（エラーはバブルアップ）
- **フォーム送信**: 関数先頭で `if (!user || !input.trim()) return` でガード
- **ルートパラメータ**: `isValidDateString()` で検証し、不正値は `redirect()` で安全な状態へ

### やらないこと

- `any` 型の使用
- コンポーネント内にビジネスロジックを直接記述（utils に切り出す）
- 不要な抽象化（1回しか使わないヘルパー関数）
- catch ブロックでのエラー握りつぶし
- CSS-in-JS や styled-components（Tailwind で統一）
