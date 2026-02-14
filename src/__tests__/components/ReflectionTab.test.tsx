import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReflectionTab } from '@/components/dashboard/ReflectionTab';
import type { Reflection } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

vi.mock('@/lib/firebase/firestore', () => ({
  saveReflection: vi.fn().mockResolvedValue(undefined),
}));

const ts = Timestamp.now();

const mockReflection: Reflection = {
  date: '2026-02-14',
  items: [
    { id: 'r1', text: '午前中は集中できた', order: 0 },
    { id: 'r2', text: '会議が長引いた', order: 1 },
  ],
  mood: 4,
  createdAt: ts,
  updatedAt: ts,
};

describe('ReflectionTab', () => {
  const onReflectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('振り返り項目を表示する', () => {
    render(
      <ReflectionTab date="2026-02-14" reflection={mockReflection} onReflectionChange={onReflectionChange} />
    );

    expect(screen.getByDisplayValue('午前中は集中できた')).toBeInTheDocument();
    expect(screen.getByDisplayValue('会議が長引いた')).toBeInTheDocument();
  });

  it('気分ボタンが5つ表示される', () => {
    render(
      <ReflectionTab date="2026-02-14" reflection={mockReflection} onReflectionChange={onReflectionChange} />
    );

    expect(screen.getByLabelText('😢')).toBeInTheDocument();
    expect(screen.getByLabelText('😐')).toBeInTheDocument();
    expect(screen.getByLabelText('🙂')).toBeInTheDocument();
    expect(screen.getByLabelText('😊')).toBeInTheDocument();
    expect(screen.getByLabelText('🤩')).toBeInTheDocument();
  });

  it('選択中の気分が aria-pressed=true になっている', () => {
    render(
      <ReflectionTab date="2026-02-14" reflection={mockReflection} onReflectionChange={onReflectionChange} />
    );

    // mood=4 → 😊
    expect(screen.getByLabelText('😊')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('🙂')).toHaveAttribute('aria-pressed', 'false');
  });

  it('振り返りが null の場合は空の状態で表示する', () => {
    render(
      <ReflectionTab date="2026-02-14" reflection={null} onReflectionChange={onReflectionChange} />
    );

    expect(screen.getByText('今日の振り返り')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('項目を追加...')).toBeInTheDocument();
  });

  it('項目追加の入力欄にテキストを入力できる', async () => {
    const user = userEvent.setup();
    render(
      <ReflectionTab date="2026-02-14" reflection={null} onReflectionChange={onReflectionChange} />
    );

    const input = screen.getByPlaceholderText('項目を追加...');
    await user.type(input, 'テスト項目');
    expect(input).toHaveValue('テスト項目');
  });

  it('気分ボタンをクリックすると saveReflection が呼ばれる', async () => {
    const user = userEvent.setup();
    render(
      <ReflectionTab date="2026-02-14" reflection={null} onReflectionChange={onReflectionChange} />
    );

    await user.click(screen.getByLabelText('😊'));

    const { saveReflection } = await import('@/lib/firebase/firestore');
    expect(saveReflection).toHaveBeenCalledWith('test-user', '2026-02-14', {
      items: [],
      mood: 4,
    });
  });

  it('自動保存の注記が表示される', () => {
    render(
      <ReflectionTab date="2026-02-14" reflection={null} onReflectionChange={onReflectionChange} />
    );
    expect(screen.getByText(/自動保存されます/)).toBeInTheDocument();
  });
});
