'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDaysInMonth, getToday, getDayOfWeek, formatDate, parseDate } from '@/lib/utils/date';

interface CalendarModalProps {
  selectedDate: string;
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function CalendarModal({ selectedDate, isOpen, onClose }: CalendarModalProps) {
  const router = useRouter();
  const parsedDate = parseDate(selectedDate);
  const [year, setYear] = useState(parsedDate.getFullYear());
  const [month, setMonth] = useState(parsedDate.getMonth() + 1);

  if (!isOpen) return null;

  const days = getDaysInMonth(year, month);
  const today = getToday();

  // 月の最初の日の曜日（0=日曜）
  const firstDayOfWeek = getDayOfWeek(days[0]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleSelectDate = (date: string) => {
    router.push(`/dashboard/${date}`);
    onClose();
  };

  const handleToday = () => {
    router.push(`/dashboard/${today}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-label="カレンダー"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 mx-4 max-w-sm w-full shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} aria-label="前月" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">{year}年 {month}月</span>
          <button onClick={handleNextMonth} aria-label="次月" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
          {WEEKDAY_LABELS.map(label => (
            <div key={label}>{label}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(date => {
            const dayNum = parseInt(date.split('-')[2], 10);
            const isToday = date === today;
            const isSelected = date === selectedDate;

            return (
              <button
                key={date}
                onClick={() => handleSelectDate(date)}
                className={`p-2 text-sm rounded-full transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isToday
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Today button */}
        <div className="mt-4 text-center">
          <button
            onClick={handleToday}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            今日に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
