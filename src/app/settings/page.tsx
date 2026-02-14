'use client';

import { useState, useCallback } from 'react';
import { LogOut, Download } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { BottomNav } from '@/components/layout/BottomNav';
import { signOut } from '@/lib/firebase/auth';
import {
  getTasks,
  getHabits,
  getGoals,
  getMilestones,
  getIdealSchedule,
} from '@/lib/firebase/firestore';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleExport = useCallback(async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [goals, habits, idealSchedule] = await Promise.all([
        getGoals(user.uid),
        getHabits(user.uid),
        getIdealSchedule(user.uid),
      ]);
      const milestones = await getMilestones(user.uid);

      const data = {
        exportedAt: new Date().toISOString(),
        goals,
        milestones,
        habits,
        idealSchedule,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `self-management-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-4">
        <h1 className="text-lg font-bold">設定</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Account */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">アカウント</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
          >
            <LogOut size={16} /> ログアウト
          </button>
        </section>

        {/* Data */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">データ</h2>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'エクスポート中...' : 'データエクスポート (JSON)'}
          </button>
        </section>

        {/* About */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">バージョン</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">1.0.0</p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
