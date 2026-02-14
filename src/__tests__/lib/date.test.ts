import { describe, it, expect } from 'vitest';
import {
  formatDate,
  parseDate,
  isValidDateString,
  formatDateJa,
  getPrevDay,
  getNextDay,
  getDaysInMonth,
  getDayOfWeek,
  isValidTimeString,
} from '@/lib/utils/date';

describe('date utils', () => {
  describe('formatDate', () => {
    it('Date を "YYYY-MM-DD" 形式に変換する', () => {
      expect(formatDate(new Date(2026, 1, 14))).toBe('2026-02-14');
    });

    it('1桁の月日をゼロ埋めする', () => {
      expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('parseDate', () => {
    it('"YYYY-MM-DD" 文字列を Date に変換する', () => {
      const date = parseDate('2026-02-14');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(1); // 0-indexed
      expect(date.getDate()).toBe(14);
    });
  });

  describe('isValidDateString', () => {
    it('有効な日付文字列を受け入れる', () => {
      expect(isValidDateString('2026-02-14')).toBe(true);
      expect(isValidDateString('2026-12-31')).toBe(true);
      expect(isValidDateString('2026-01-01')).toBe(true);
    });

    it('無効な日付文字列を拒否する', () => {
      expect(isValidDateString('2026-13-01')).toBe(false); // 月が無効
      expect(isValidDateString('2026-02-30')).toBe(false); // 2月30日は存在しない
      expect(isValidDateString('not-a-date')).toBe(false);
      expect(isValidDateString('2026/02/14')).toBe(false); // フォーマット違い
      expect(isValidDateString('')).toBe(false);
    });
  });

  describe('formatDateJa', () => {
    it('日本語の日付表示に変換する', () => {
      const result = formatDateJa('2026-02-14');
      expect(result).toBe('2026年2月14日(土)');
    });

    it('日曜日を正しく表示する', () => {
      const result = formatDateJa('2026-02-15');
      expect(result).toBe('2026年2月15日(日)');
    });
  });

  describe('getPrevDay / getNextDay', () => {
    it('前日を返す', () => {
      expect(getPrevDay('2026-02-14')).toBe('2026-02-13');
    });

    it('月またぎを正しく処理する', () => {
      expect(getPrevDay('2026-03-01')).toBe('2026-02-28');
      expect(getNextDay('2026-02-28')).toBe('2026-03-01');
    });

    it('年またぎを正しく処理する', () => {
      expect(getPrevDay('2026-01-01')).toBe('2025-12-31');
      expect(getNextDay('2025-12-31')).toBe('2026-01-01');
    });
  });

  describe('getDaysInMonth', () => {
    it('2月の日数を正しく返す（非閏年）', () => {
      const days = getDaysInMonth(2026, 2);
      expect(days).toHaveLength(28);
      expect(days[0]).toBe('2026-02-01');
      expect(days[27]).toBe('2026-02-28');
    });

    it('閏年の2月を正しく処理する', () => {
      const days = getDaysInMonth(2024, 2);
      expect(days).toHaveLength(29);
      expect(days[28]).toBe('2024-02-29');
    });

    it('31日の月を正しく返す', () => {
      const days = getDaysInMonth(2026, 1);
      expect(days).toHaveLength(31);
    });
  });

  describe('getDayOfWeek', () => {
    it('2026-02-14 (土曜日) → 6 を返す', () => {
      expect(getDayOfWeek('2026-02-14')).toBe(6);
    });

    it('2026-02-15 (日曜日) → 0 を返す', () => {
      expect(getDayOfWeek('2026-02-15')).toBe(0);
    });

    it('2026-02-16 (月曜日) → 1 を返す', () => {
      expect(getDayOfWeek('2026-02-16')).toBe(1);
    });
  });

  describe('isValidTimeString', () => {
    it('有効な時刻文字列を受け入れる', () => {
      expect(isValidTimeString('00:00')).toBe(true);
      expect(isValidTimeString('06:30')).toBe(true);
      expect(isValidTimeString('23:59')).toBe(true);
    });

    it('無効な時刻文字列を拒否する', () => {
      expect(isValidTimeString('24:00')).toBe(false);
      expect(isValidTimeString('12:60')).toBe(false);
      expect(isValidTimeString('6:30')).toBe(false); // ゼロ埋めなし
      expect(isValidTimeString('invalid')).toBe(false);
      expect(isValidTimeString('')).toBe(false);
    });
  });
});
