import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '@/components/layout/BottomNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/2026-02-14',
}));

describe('BottomNav', () => {
  it('4つのナビゲーションリンクを表示する', () => {
    render(<BottomNav />);
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('目標')).toBeInTheDocument();
    expect(screen.getByText('スケジュール')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('現在のパスに対応するリンクがアクティブ状態になる', () => {
    render(<BottomNav />);
    const dashboardLink = screen.getByText('ダッシュボード').closest('a');
    expect(dashboardLink).toHaveClass('text-blue-600');
  });

  it('各リンクが正しい href を持つ', () => {
    render(<BottomNav />);
    expect(screen.getByText('ダッシュボード').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('目標').closest('a')).toHaveAttribute('href', '/goals');
    expect(screen.getByText('スケジュール').closest('a')).toHaveAttribute('href', '/schedule');
    expect(screen.getByText('設定').closest('a')).toHaveAttribute('href', '/settings');
  });
});
