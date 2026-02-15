import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitsTab } from '@/components/dashboard/HabitsTab';
import type { Habit, HabitLog } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

vi.mock('@/lib/firebase/firestore', () => ({
  saveHabitLog: vi.fn().mockResolvedValue(undefined),
}));

const ts = Timestamp.now();

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    title: '読書30分',
    frequency: 'daily',
    isActive: true,
    order: 0,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

// 2026-02-16 = 月曜日
const MONDAY = '2026-02-16';
// 2026-02-14 = 土曜日
const SATURDAY = '2026-02-14';

describe('HabitsTab', () => {
  const onHabitLogChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('該当する習慣の一覧を表示する', () => {
    const habits = [
      makeHabit({ id: 'h1', title: '読書30分' }),
      makeHabit({ id: 'h2', title: '運動' }),
    ];

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={null} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.getByText('読書30分')).toBeInTheDocument();
    expect(screen.getByText('運動')).toBeInTheDocument();
  });

  it('達成数/合計数を表示する', () => {
    const habits = [
      makeHabit({ id: 'h1' }),
      makeHabit({ id: 'h2', title: '運動' }),
    ];
    const log: HabitLog = { date: MONDAY, completedHabitIds: ['h1'], updatedAt: ts };

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={log} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.getByText('習慣 (1/2 達成)')).toBeInTheDocument();
  });

  it('完了した習慣のチェックボックスがチェック状態になっている', () => {
    const habits = [
      makeHabit({ id: 'h1', title: '読書30分' }),
      makeHabit({ id: 'h2', title: '運動' }),
    ];
    const log: HabitLog = { date: MONDAY, completedHabitIds: ['h1'], updatedAt: ts };

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={log} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked(); // h1: 完了
    expect(checkboxes[1]).not.toBeChecked(); // h2: 未完了
  });

  it('ストリークが0より大きい場合に表示する', () => {
    const habits = [makeHabit({ id: 'h1', title: '読書30分' })];

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={null} streaks={{ h1: 12 }} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.getByText('12日')).toBeInTheDocument();
  });

  it('ストリークが0の場合は表示しない', () => {
    const habits = [makeHabit({ id: 'h1', title: '読書30分' })];

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={null} streaks={{ h1: 0 }} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.queryByText(/日$/)).not.toBeInTheDocument();
  });

  it('weekdays の習慣は土曜日に「今日は対象外」に表示される', () => {
    const habits = [
      makeHabit({ id: 'h1', title: '仕事用タスク', frequency: 'weekdays' }),
      makeHabit({ id: 'h2', title: '毎日の習慣', frequency: 'daily' }),
    ];

    render(
      <HabitsTab date={SATURDAY} habits={habits} habitLog={null} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.getByText('毎日の習慣')).toBeInTheDocument();
    expect(screen.getByText('今日は対象外')).toBeInTheDocument();
    expect(screen.getByText('仕事用タスク')).toBeInTheDocument();
  });

  it('該当する習慣が0件の場合に空メッセージを表示する', () => {
    const habits = [
      makeHabit({ id: 'h1', title: '平日のみ', frequency: 'weekdays' }),
    ];

    render(
      <HabitsTab date={SATURDAY} habits={habits} habitLog={null} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.getByText('今日該当する習慣はありません')).toBeInTheDocument();
  });

  it('チェックボックスをクリックすると saveHabitLog が呼ばれる', async () => {
    const user = userEvent.setup();
    const habits = [makeHabit({ id: 'h1', title: '読書30分' })];

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={null} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    await user.click(screen.getByRole('checkbox'));

    const { saveHabitLog } = await import('@/lib/firebase/firestore');
    expect(saveHabitLog).toHaveBeenCalledWith('test-user', MONDAY, ['h1']);
    expect(onHabitLogChange).toHaveBeenCalled();
  });

  it('完了済み習慣のチェックを外すと ID が除去される', async () => {
    const user = userEvent.setup();
    const habits = [makeHabit({ id: 'h1', title: '読書30分' })];
    const log: HabitLog = { date: MONDAY, completedHabitIds: ['h1'], updatedAt: ts };

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={log} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    await user.click(screen.getByRole('checkbox'));

    const { saveHabitLog } = await import('@/lib/firebase/firestore');
    expect(saveHabitLog).toHaveBeenCalledWith('test-user', MONDAY, []); // h1 が除去される
  });

  it('非アクティブな習慣は表示されない', () => {
    const habits = [
      makeHabit({ id: 'h1', title: '一時停止中', isActive: false }),
    ];

    render(
      <HabitsTab date={MONDAY} habits={habits} habitLog={null} streaks={{}} onHabitLogChange={onHabitLogChange} />
    );

    expect(screen.queryByText('一時停止中')).not.toBeInTheDocument();
  });
});
