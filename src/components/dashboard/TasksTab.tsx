'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { createTask, updateTask, deleteTask as deleteTaskApi } from '@/lib/firebase/firestore';

interface TasksTabProps {
  date: string;
  tasks: Task[];
  onTasksChange: () => void;
}

export function TasksTab({ date, tasks, onTasksChange }: TasksTabProps) {
  const { user } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = useCallback(async () => {
    if (!user || !newTaskTitle.trim()) return;
    await createTask(user.uid, { title: newTaskTitle.trim(), date });
    setNewTaskTitle('');
    onTasksChange();
  }, [user, newTaskTitle, date, onTasksChange]);

  const handleToggleStatus = useCallback(async (task: Task) => {
    if (!user) return;
    await updateTask(user.uid, task.id, {
      status: task.status === 'todo' ? 'done' : 'todo',
    });
    onTasksChange();
  }, [user, onTasksChange]);

  const handleDelete = useCallback(async (taskId: string) => {
    if (!user) return;
    await deleteTaskApi(user.uid, taskId);
    onTasksChange();
  }, [user, onTasksChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleAddTask();
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        タスク ({tasks.length})
      </h2>

      {tasks.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          タスクはまだありません
        </p>
      )}

      <ul className="space-y-2">
        {tasks.map(task => (
          <li
            key={task.id}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group"
          >
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => handleToggleStatus(task)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span
              className={`flex-1 text-sm ${
                task.status === 'done'
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {task.title}
            </span>
            <button
              onClick={() => handleDelete(task.id)}
              aria-label="削除"
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Plus size={16} className="text-gray-400" />
        <input
          type="text"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="タスクを追加..."
          className="flex-1 text-sm border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
      </div>
    </div>
  );
}
