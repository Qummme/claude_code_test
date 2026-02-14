import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestonesSummary } from '@/components/dashboard/MilestonesSummary';
import type { Milestone } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

const ts = Timestamp.now();

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'ms-1',
    goalId: 'g-1',
    title: 'Test Milestone',
    targetDate: '2026-06-01',
    status: 'in_progress',
    order: 0,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

describe('MilestonesSummary', () => {
  it('マイルストーンが空なら何も表示しない', () => {
    const { container } = render(
      <MilestonesSummary milestones={[]} today="2026-02-14" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('進行中のマイルストーンを表示する', () => {
    const milestones = [
      makeMilestone({ id: 'ms-1', title: 'テキスト1-5章完了', targetDate: '2026-03-15' }),
      makeMilestone({ id: 'ms-2', title: '10km走破', targetDate: '2026-02-28' }),
    ];

    render(<MilestonesSummary milestones={milestones} today="2026-02-14" />);

    expect(screen.getByText('進行中のマイルストーン')).toBeInTheDocument();
    expect(screen.getByText('テキスト1-5章完了')).toBeInTheDocument();
    expect(screen.getByText('10km走破')).toBeInTheDocument();
  });

  it('最大5件まで表示する', () => {
    const milestones = Array.from({ length: 7 }, (_, i) =>
      makeMilestone({ id: `ms-${i}`, title: `MS ${i}` })
    );

    render(<MilestonesSummary milestones={milestones} today="2026-02-14" />);

    expect(screen.getByText('MS 0')).toBeInTheDocument();
    expect(screen.getByText('MS 4')).toBeInTheDocument();
    expect(screen.queryByText('MS 5')).not.toBeInTheDocument();
  });

  it('期限超過のマイルストーンを赤文字で表示する', () => {
    const milestones = [
      makeMilestone({ id: 'ms-overdue', title: '期限超過', targetDate: '2026-01-01', status: 'pending' }),
    ];

    render(<MilestonesSummary milestones={milestones} today="2026-02-14" />);

    const dateText = screen.getByText('01/01 期限');
    expect(dateText).toHaveClass('text-red-500');
  });

  it('期限内のマイルストーンはグレーで表示する', () => {
    const milestones = [
      makeMilestone({ id: 'ms-ok', title: '期限内', targetDate: '2026-06-01' }),
    ];

    render(<MilestonesSummary milestones={milestones} today="2026-02-14" />);

    const dateText = screen.getByText('06/01 期限');
    expect(dateText).toHaveClass('text-gray-400');
  });
});
