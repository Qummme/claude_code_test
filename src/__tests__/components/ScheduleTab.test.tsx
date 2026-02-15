import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleTab } from '@/components/dashboard/ScheduleTab';
import type { DailySchedule, IdealScheduleBlock, ScheduleBlock } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

vi.mock('@/lib/firebase/firestore', () => ({
  saveDailySchedule: vi.fn().mockResolvedValue(undefined),
}));

const ts = Timestamp.now();

const mockBlocks: ScheduleBlock[] = [
  { id: 'b1', startTime: '06:00', endTime: '07:00', title: '朝の運動', category: '運動', status: 'completed' },
  { id: 'b2', startTime: '08:00', endTime: '12:00', title: '集中作業', category: '仕事', status: 'planned' },
  { id: 'b3', startTime: '12:00', endTime: '13:00', title: '昼休み', status: 'skipped' },
];

const mockDailySchedule: DailySchedule = {
  date: '2026-02-14',
  blocks: mockBlocks,
  copiedFromIdeal: false,
  updatedAt: ts,
};

const mockIdealSchedule: IdealScheduleBlock[] = [
  { id: 'i1', startTime: '06:00', endTime: '07:00', title: '朝の運動', order: 0 },
  { id: 'i2', startTime: '08:00', endTime: '12:00', title: '集中作業', order: 1 },
];

describe('ScheduleTab', () => {
  const onScheduleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('スケジュールブロック一覧を表示する', () => {
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={mockDailySchedule}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    expect(screen.getByText('朝の運動')).toBeInTheDocument();
    expect(screen.getByText('集中作業')).toBeInTheDocument();
    expect(screen.getByText('昼休み')).toBeInTheDocument();
  });

  it('各ブロックの時間帯を表示する', () => {
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={mockDailySchedule}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    expect(screen.getByText('06:00 - 07:00')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 12:00')).toBeInTheDocument();
  });

  it('ステータスラベルを正しく表示する', () => {
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={mockDailySchedule}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    expect(screen.getByText('完了')).toBeInTheDocument();
    expect(screen.getByText('予定')).toBeInTheDocument();
    expect(screen.getByText('スキップ')).toBeInTheDocument();
  });

  it('スケジュールが空の場合に空メッセージを表示する', () => {
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={null}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    expect(screen.getByText('スケジュールはまだありません')).toBeInTheDocument();
  });

  it('テンプレートからコピーボタンが表示される', () => {
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={null}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    expect(screen.getByText('テンプレートからコピー')).toBeInTheDocument();
  });

  it('テンプレートが空の場合コピーボタンが無効化される', () => {
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={null}
        idealSchedule={[]}
        onScheduleChange={onScheduleChange}
      />
    );

    const button = screen.getByText('テンプレートからコピー').closest('button');
    expect(button).toBeDisabled();
  });

  it('テンプレートからコピーをクリックすると saveDailySchedule が呼ばれる', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={null}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    await user.click(screen.getByText('テンプレートからコピー'));

    const { saveDailySchedule } = await import('@/lib/firebase/firestore');
    expect(saveDailySchedule).toHaveBeenCalledWith(
      'test-user',
      '2026-02-14',
      expect.objectContaining({ copiedFromIdeal: true })
    );
    expect(onScheduleChange).toHaveBeenCalled();
  });

  it('ステータスボタンをクリックするとステータスが切り替わる', async () => {
    const user = userEvent.setup();
    render(
      <ScheduleTab
        date="2026-02-14"
        dailySchedule={mockDailySchedule}
        idealSchedule={mockIdealSchedule}
        onScheduleChange={onScheduleChange}
      />
    );

    // 「予定」(b2) をクリックすると「完了」に切り替わるべき
    await user.click(screen.getByText('予定'));

    const { saveDailySchedule } = await import('@/lib/firebase/firestore');
    expect(saveDailySchedule).toHaveBeenCalled();

    const call = (saveDailySchedule as ReturnType<typeof vi.fn>).mock.calls[0];
    const savedBlocks = call[2].blocks;
    const b2 = savedBlocks.find((b: ScheduleBlock) => b.id === 'b2');
    expect(b2.status).toBe('completed'); // planned → completed
  });
});
