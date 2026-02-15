import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/Header';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('Header', () => {
  const onCalendarOpen = vi.fn();

  it('日本語の日付を表示する', () => {
    render(<Header date="2026-02-14" onCalendarOpen={onCalendarOpen} />);
    expect(screen.getByText('2026年2月14日(土)')).toBeInTheDocument();
  });

  it('前日ボタンをクリックすると前日に遷移する', async () => {
    const user = userEvent.setup();
    render(<Header date="2026-02-14" onCalendarOpen={onCalendarOpen} />);

    await user.click(screen.getByLabelText('前日'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/2026-02-13');
  });

  it('翌日ボタンをクリックすると翌日に遷移する', async () => {
    const user = userEvent.setup();
    render(<Header date="2026-02-14" onCalendarOpen={onCalendarOpen} />);

    await user.click(screen.getByLabelText('翌日'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/2026-02-15');
  });

  it('カレンダーボタンをクリックすると onCalendarOpen が呼ばれる', async () => {
    const user = userEvent.setup();
    render(<Header date="2026-02-14" onCalendarOpen={onCalendarOpen} />);

    await user.click(screen.getByLabelText('カレンダー'));
    expect(onCalendarOpen).toHaveBeenCalled();
  });

  it('設定リンクが /settings を指す', () => {
    render(<Header date="2026-02-14" onCalendarOpen={onCalendarOpen} />);
    const settingsLink = screen.getByLabelText('設定');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });
});
