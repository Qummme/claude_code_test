'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar, Settings } from 'lucide-react';
import { formatDateJa, getPrevDay, getNextDay, getToday } from '@/lib/utils/date';
import Link from 'next/link';

interface HeaderProps {
  date: string;
  onCalendarOpen: () => void;
}

export function Header({ date, onCalendarOpen }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold">{formatDateJa(date)}</h1>
        <Link href="/settings" aria-label="設定">
          <Settings size={20} className="text-gray-500" />
        </Link>
      </div>
      <div className="flex items-center justify-center gap-4 pb-3">
        <button
          onClick={() => router.push(`/dashboard/${getPrevDay(date)}`)}
          aria-label="前日"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onCalendarOpen}
          aria-label="カレンダー"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Calendar size={20} />
        </button>
        <button
          onClick={() => router.push(`/dashboard/${getNextDay(date)}`)}
          aria-label="翌日"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </header>
  );
}
