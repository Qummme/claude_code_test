import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarModal } from '@/components/calendar/CalendarModal';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CalendarModal', () => {
  const onClose = vi.fn();

  it('isOpen=false の場合何も表示しない', () => {
    const { container } = render(
      <CalendarModal selectedDate="2026-02-14" isOpen={false} onClose={onClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('isOpen=true の場合カレンダーを表示する', () => {
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('2026年 2月')).toBeInTheDocument();
  });

  it('曜日ヘッダーが表示される', () => {
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('土')).toBeInTheDocument();
  });

  it('月の日付が表示される', () => {
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('日付をクリックするとルーターの push が呼ばれる', async () => {
    const user = userEvent.setup();
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );

    await user.click(screen.getByText('10'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/2026-02-10');
    expect(onClose).toHaveBeenCalled();
  });

  it('「今日に戻る」ボタンが表示される', () => {
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );
    expect(screen.getByText('今日に戻る')).toBeInTheDocument();
  });

  it('前月ボタンで月が切り替わる', async () => {
    const user = userEvent.setup();
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );

    await user.click(screen.getByLabelText('前月'));
    expect(screen.getByText('2026年 1月')).toBeInTheDocument();
  });

  it('次月ボタンで月が切り替わる', async () => {
    const user = userEvent.setup();
    render(
      <CalendarModal selectedDate="2026-02-14" isOpen={true} onClose={onClose} />
    );

    await user.click(screen.getByLabelText('次月'));
    expect(screen.getByText('2026年 3月')).toBeInTheDocument();
  });
});
