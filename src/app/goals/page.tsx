'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '@/lib/firebase/firestore';
import { calculateProgress } from '@/lib/utils/milestone';
import type { Goal, Milestone, GoalStatus, MilestoneStatus } from '@/lib/types';

export default function GoalsPage() {
  return (
    <ProtectedRoute>
      <GoalsContent />
    </ProtectedRoute>
  );
}

function GoalsContent() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestonesByGoal, setMilestonesByGoal] = useState<Record<string, Milestone[]>>({});
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Form state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalFormTitle, setGoalFormTitle] = useState('');
  const [goalFormCategory, setGoalFormCategory] = useState('');
  const [goalFormDescription, setGoalFormDescription] = useState('');

  const [showMilestoneForm, setShowMilestoneForm] = useState<string | null>(null);
  const [msFormTitle, setMsFormTitle] = useState('');
  const [msFormDate, setMsFormDate] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const g = await getGoals(user.uid, currentYear);
      setGoals(g);
      const msMap: Record<string, Milestone[]> = {};
      await Promise.all(
        g.map(async goal => {
          msMap[goal.id] = await getMilestones(user.uid, goal.id);
        })
      );
      setMilestonesByGoal(msMap);
    } finally {
      setLoading(false);
    }
  }, [user, currentYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleCreateGoal = async () => {
    if (!user || !goalFormTitle.trim()) return;
    await createGoal(user.uid, {
      title: goalFormTitle.trim(),
      year: currentYear,
      description: goalFormDescription.trim() || undefined,
      category: goalFormCategory.trim() || undefined,
    });
    setGoalFormTitle('');
    setGoalFormCategory('');
    setGoalFormDescription('');
    setShowGoalForm(false);
    loadData();
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    await deleteGoal(user.uid, goalId);
    loadData();
  };

  const handleGoalStatusChange = async (goalId: string, status: GoalStatus) => {
    if (!user) return;
    await updateGoal(user.uid, goalId, { status });
    loadData();
  };

  const handleCreateMilestone = async (goalId: string) => {
    if (!user || !msFormTitle.trim() || !msFormDate) return;
    await createMilestone(user.uid, {
      goalId,
      title: msFormTitle.trim(),
      targetDate: msFormDate,
    });
    setMsFormTitle('');
    setMsFormDate('');
    setShowMilestoneForm(null);
    loadData();
  };

  const handleMilestoneStatusChange = async (milestoneId: string, status: MilestoneStatus) => {
    if (!user) return;
    await updateMilestone(user.uid, milestoneId, { status });
    loadData();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!user) return;
    await deleteMilestone(user.uid, milestoneId);
    loadData();
  };

  const STATUS_LABELS: Record<GoalStatus, string> = {
    active: '進行中',
    achieved: '達成',
    abandoned: '中止',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">年間目標</h1>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
        >
          <Plus size={16} /> 追加
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Goal form */}
        {showGoalForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <input
              type="text"
              value={goalFormTitle}
              onChange={e => setGoalFormTitle(e.target.value)}
              placeholder="目標タイトル"
              aria-label="タイトル"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
              autoFocus
            />
            <input
              type="text"
              value={goalFormCategory}
              onChange={e => setGoalFormCategory(e.target.value)}
              placeholder="カテゴリ (例: キャリア, 健康)"
              aria-label="カテゴリ"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
            />
            <textarea
              value={goalFormDescription}
              onChange={e => setGoalFormDescription(e.target.value)}
              placeholder="説明 (任意)"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGoal}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : goals.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            {currentYear}年の目標はまだありません
          </p>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500">{currentYear}年</h2>
            {goals.map(goal => {
              const milestones = milestonesByGoal[goal.id] ?? [];
              const progress = calculateProgress(milestones);
              const isExpanded = expandedGoals.has(goal.id);

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Goal header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(goal.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {goal.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                          {goal.category}
                        </span>
                      )}
                      <span className="flex-1 font-medium text-sm">{goal.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        goal.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        goal.status === 'achieved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-700'
                      }`}>
                        {STATUS_LABELS[goal.status]}
                      </span>
                    </div>
                    {/* Progress bar */}
                    {milestones.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress.percentage} aria-valuemin={0} aria-valuemax={100}>
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{progress.completed}/{progress.total}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded: milestones */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2">
                      {milestones.map(ms => (
                        <div key={ms.id} className="flex items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={ms.status === 'completed'}
                            onChange={() => handleMilestoneStatusChange(
                              ms.id,
                              ms.status === 'completed' ? 'pending' : 'completed'
                            )}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className={`flex-1 text-sm ${ms.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                            {ms.title}
                          </span>
                          <span className="text-xs text-gray-400">
                            {ms.targetDate.slice(5).replace('-', '/')}
                          </span>
                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600"
                            aria-label="削除"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Add milestone form */}
                      {showMilestoneForm === goal.id ? (
                        <div className="space-y-2 pt-2">
                          <input
                            type="text"
                            value={msFormTitle}
                            onChange={e => setMsFormTitle(e.target.value)}
                            placeholder="マイルストーンのタイトル"
                            aria-label="タイトル"
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent"
                            autoFocus
                          />
                          <input
                            type="date"
                            value={msFormDate}
                            onChange={e => setMsFormDate(e.target.value)}
                            aria-label="期限"
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCreateMilestone(goal.id)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setShowMilestoneForm(null)}
                              className="px-3 py-1 text-xs text-gray-500"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowMilestoneForm(goal.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1"
                        >
                          <Plus size={12} /> マイルストーン追加
                        </button>
                      )}

                      {/* Goal actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <select
                          value={goal.status}
                          onChange={e => handleGoalStatusChange(goal.id, e.target.value as GoalStatus)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent"
                        >
                          <option value="active">進行中</option>
                          <option value="achieved">達成</option>
                          <option value="abandoned">中止</option>
                        </select>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-xs text-red-400 hover:text-red-600 ml-auto"
                        >
                          目標を削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
