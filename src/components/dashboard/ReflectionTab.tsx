'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Reflection, ReflectionItem } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { saveReflection } from '@/lib/firebase/firestore';

interface ReflectionTabProps {
  date: string;
  reflection: Reflection | null;
  onReflectionChange: () => void;
}

const MOOD_OPTIONS = [
  { value: 1, label: '😢' },
  { value: 2, label: '😐' },
  { value: 3, label: '🙂' },
  { value: 4, label: '😊' },
  { value: 5, label: '🤩' },
];

export function ReflectionTab({ date, reflection, onReflectionChange }: ReflectionTabProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ReflectionItem[]>(reflection?.items ?? []);
  const [mood, setMood] = useState<number | undefined>(reflection?.mood);
  const [newItemText, setNewItemText] = useState('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reflection が変わったら state を更新
  useEffect(() => {
    setItems(reflection?.items ?? []);
    setMood(reflection?.mood);
  }, [reflection]);

  const save = useCallback(async (newItems: ReflectionItem[], newMood?: number) => {
    if (!user) return;
    await saveReflection(user.uid, date, { items: newItems, mood: newMood });
    onReflectionChange();
  }, [user, date, onReflectionChange]);

  // デバウンス保存（2秒後）
  const debounceSave = useCallback((newItems: ReflectionItem[], newMood?: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => save(newItems, newMood), 2000);
  }, [save]);

  const handleAddItem = useCallback(() => {
    if (!newItemText.trim()) return;
    const newItem: ReflectionItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      order: items.length,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setNewItemText('');
    debounceSave(newItems, mood);
  }, [newItemText, items, mood, debounceSave]);

  const handleDeleteItem = useCallback((itemId: string) => {
    const newItems = items.filter(i => i.id !== itemId);
    setItems(newItems);
    debounceSave(newItems, mood);
  }, [items, mood, debounceSave]);

  const handleUpdateItem = useCallback((itemId: string, text: string) => {
    const newItems = items.map(i => i.id === itemId ? { ...i, text } : i);
    setItems(newItems);
    debounceSave(newItems, mood);
  }, [items, mood, debounceSave]);

  const handleMoodChange = useCallback((value: number) => {
    const newMood = mood === value ? undefined : value;
    setMood(newMood);
    // 気分変更は即座に保存
    save(items, newMood);
  }, [mood, items, save]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        今日の振り返り
      </h2>

      {/* Mood selector */}
      <div className="space-y-1">
        <span className="text-xs text-gray-500">気分:</span>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleMoodChange(value)}
              aria-label={label}
              aria-pressed={mood === value}
              className={`text-2xl p-1 rounded-lg transition-all ${
                mood === value
                  ? 'bg-blue-100 dark:bg-blue-900 scale-110'
                  : 'opacity-50 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-2 group">
            <span className="text-gray-400 mt-1">•</span>
            <input
              type="text"
              value={item.text}
              onChange={e => handleUpdateItem(item.id, e.target.value)}
              className="flex-1 text-sm border-none outline-none bg-transparent text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => handleDeleteItem(item.id)}
              aria-label="削除"
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      {/* Add item input */}
      <div className="flex items-center gap-2">
        <Plus size={16} className="text-gray-400" />
        <input
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="項目を追加..."
          className="flex-1 text-sm border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      <p className="text-xs text-gray-400">※ 自動保存されます</p>
    </div>
  );
}
