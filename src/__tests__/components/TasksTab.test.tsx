import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TasksTab } from '@/components/dashboard/TasksTab';
import type { Task } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase and Auth
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

vi.mock('@/lib/firebase/firestore', () => ({
  createTask: vi.fn().mockResolvedValue('new-task-id'),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));

const ts = Timestamp.now();

const mockTasks: Task[] = [
  { id: 't1', title: '買い物に行く', date: '2026-02-14', status: 'todo', order: 0, createdAt: ts, updatedAt: ts },
  { id: 't2', title: 'PR をレビュー', date: '2026-02-14', status: 'done', order: 1, createdAt: ts, updatedAt: ts },
  { id: 't3', title: '歯医者に電話', date: '2026-02-14', status: 'todo', order: 2, createdAt: ts, updatedAt: ts },
];

describe('TasksTab', () => {
  const onTasksChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タスク一覧を表示する', () => {
    render(<TasksTab date="2026-02-14" tasks={mockTasks} onTasksChange={onTasksChange} />);

    expect(screen.getByText('買い物に行く')).toBeInTheDocument();
    expect(screen.getByText('PR をレビュー')).toBeInTheDocument();
    expect(screen.getByText('歯医者に電話')).toBeInTheDocument();
  });

  it('タスク数を表示する', () => {
    render(<TasksTab date="2026-02-14" tasks={mockTasks} onTasksChange={onTasksChange} />);
    expect(screen.getByText('タスク (3)')).toBeInTheDocument();
  });

  it('完了済みタスクのチェックボックスがチェック状態になっている', () => {
    render(<TasksTab date="2026-02-14" tasks={mockTasks} onTasksChange={onTasksChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked(); // t1: todo
    expect(checkboxes[1]).toBeChecked();     // t2: done
    expect(checkboxes[2]).not.toBeChecked(); // t3: todo
  });

  it('完了済みタスクに打ち消し線が適用される', () => {
    render(<TasksTab date="2026-02-14" tasks={mockTasks} onTasksChange={onTasksChange} />);

    const doneTask = screen.getByText('PR をレビュー');
    expect(doneTask).toHaveClass('line-through');
  });

  it('タスクが0件の場合に空メッセージを表示する', () => {
    render(<TasksTab date="2026-02-14" tasks={[]} onTasksChange={onTasksChange} />);
    expect(screen.getByText('タスクはまだありません')).toBeInTheDocument();
  });

  it('入力欄にテキストを入力できる', async () => {
    const user = userEvent.setup();
    render(<TasksTab date="2026-02-14" tasks={[]} onTasksChange={onTasksChange} />);

    const input = screen.getByPlaceholderText('タスクを追加...');
    await user.type(input, 'テストタスク');
    expect(input).toHaveValue('テストタスク');
  });

  it('チェックボックスをクリックすると onTasksChange が呼ばれる', async () => {
    const user = userEvent.setup();
    render(<TasksTab date="2026-02-14" tasks={mockTasks} onTasksChange={onTasksChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    const { updateTask } = await import('@/lib/firebase/firestore');
    expect(updateTask).toHaveBeenCalledWith('test-user', 't1', { status: 'done' });
    expect(onTasksChange).toHaveBeenCalled();
  });

  it('削除ボタンをクリックすると onTasksChange が呼ばれる', async () => {
    const user = userEvent.setup();
    render(<TasksTab date="2026-02-14" tasks={mockTasks} onTasksChange={onTasksChange} />);

    const deleteButtons = screen.getAllByLabelText('削除');
    await user.click(deleteButtons[0]);

    const { deleteTask } = await import('@/lib/firebase/firestore');
    expect(deleteTask).toHaveBeenCalledWith('test-user', 't1');
    expect(onTasksChange).toHaveBeenCalled();
  });
});
