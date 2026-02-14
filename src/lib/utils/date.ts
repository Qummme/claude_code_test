import { format, parse, isValid, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';

const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * 今日の日付を "YYYY-MM-DD" 形式で返す
 */
export function getToday(): string {
  return format(new Date(), DATE_FORMAT);
}

/**
 * Date オブジェクトを "YYYY-MM-DD" 文字列に変換
 */
export function formatDate(date: Date): string {
  return format(date, DATE_FORMAT);
}

/**
 * "YYYY-MM-DD" 文字列を Date オブジェクトに変換
 */
export function parseDate(dateString: string): Date {
  return parse(dateString, DATE_FORMAT, new Date());
}

/**
 * "YYYY-MM-DD" 文字列が有効な日付かどうかを検証
 */
export function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = parse(dateString, DATE_FORMAT, new Date());
  return isValid(date) && format(date, DATE_FORMAT) === dateString;
}

/**
 * 日本語の日付表示（例: "2026年2月14日(土)"）
 */
export function formatDateJa(dateString: string): string {
  const date = parseDate(dateString);
  return format(date, 'yyyy年M月d日(E)', { locale: ja });
}

/**
 * 前日の日付文字列を返す
 */
export function getPrevDay(dateString: string): string {
  return formatDate(subDays(parseDate(dateString), 1));
}

/**
 * 翌日の日付文字列を返す
 */
export function getNextDay(dateString: string): string {
  return formatDate(addDays(parseDate(dateString), 1));
}

/**
 * 指定月のすべての日付を返す
 */
export function getDaysInMonth(year: number, month: number): string[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end }).map(formatDate);
}

/**
 * 曜日番号を返す（0=日曜日, 6=土曜日）
 */
export function getDayOfWeek(dateString: string): number {
  return getDay(parseDate(dateString));
}

/**
 * "HH:MM" 形式のバリデーション
 */
export function isValidTimeString(timeString: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(timeString)) return false;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}
