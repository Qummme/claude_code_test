'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  getIdealSchedule,
  saveIdealScheduleBlock,
  deleteIdealScheduleBlock,
} from '@/lib/firebase/firestore';
import type { IdealScheduleBlock } from '@/lib/types';

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleContent />
    </ProtectedRoute>
  );
}

function ScheduleContent() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<IdealScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setBlocks(await getIdealSchedule(user.uid));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setFormTitle('');
    setFormStart('');
    setFormEnd('');
    setFormCategory('');
    setFormColor('#3B82F6');
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!user || !formTitle.trim() || !formStart || !formEnd) return;
    const block: IdealScheduleBlock = {
      id: editingId ?? crypto.randomUUID(),
      startTime: formStart,
      endTime: formEnd,
      title: formTitle.trim(),
      category: formCategory.trim() || undefined,
      color: formColor,
      order: editingId
        ? (blocks.find(b => b.id === editingId)?.order ?? Date.now())
        : Date.now(),
    };
    await saveIdealScheduleBlock(user.uid, block);
    resetForm();
    loadData();
  };

  const handleEdit = (block: IdealScheduleBlock) => {
    setEditingId(block.id);
    setFormTitle(block.title);
    setFormStart(block.startTime);
    setFormEnd(block.endTime);
    setFormCategory(block.category ?? '');
    setFormColor(block.color ?? '#3B82F6');
    setShowForm(true);
  };

  const handleDelete = async (blockId: string) => {
    if (!user) return;
    await deleteIdealScheduleBlock(user.uid, blockId);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-4">
        <h1 className="text-lg font-bold">理想の1日</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="ブロックタイトル"
              aria-label="タイトル"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
              autoFocus
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">開始</label>
                <input
                  type="time"
                  value={formStart}
                  onChange={e => setFormStart(e.target.value)}
                  aria-label="開始"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">終了</label>
                <input
                  type="time"
                  value={formEnd}
                  onChange={e => setFormEnd(e.target.value)}
                  aria-label="終了"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                placeholder="カテゴリ (任意)"
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent"
              />
              <input
                type="color"
                value={formColor}
                onChange={e => setFormColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                title="色を選択"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Block list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : blocks.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            理想のスケジュールはまだありません
          </p>
        ) : (
          <div className="space-y-2">
            {blocks.map(block => (
              <div
                key={block.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group cursor-pointer"
                style={block.color ? { borderLeftColor: block.color, borderLeftWidth: 4 } : undefined}
                onClick={() => handleEdit(block)}
              >
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                <div className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">
                  {block.startTime} - {block.endTime}
                </div>
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                  {block.title}
                </span>
                {block.category && (
                  <span className="text-xs text-gray-400">{block.category}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(block.id); }}
                  aria-label="削除"
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Plus size={16} /> ブロック追加
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
