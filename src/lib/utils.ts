import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 금액 통화 포맷 (예: 1,234,500원 또는 12.3만 등)
export function formatCurrency(amount: number, short = false): string {
  if (short) {
    if (Math.abs(amount) >= 100_000_000) {
      return `${(amount / 100_000_000).toFixed(1)}억원`;
    }
    if (Math.abs(amount) >= 10_000) {
      return `${(amount / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원`;
    }
  }
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

// 천단위 콤마
export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('ko-KR');
}

// 퍼센트 포맷 (+12.4%, -5.2%)
export function formatPercent(rate: number, showSign = true): string {
  const sign = showSign && rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

// 요일 구하기
export function getDayOfWeek(dateStr: string): '월' | '화' | '수' | '목' | '금' | '토' | '일' {
  const days: ('일' | '월' | '화' | '수' | '목' | '금' | '토')[] = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr);
  return days[d.getDay()] as any;
}

// 날짜 연산 YYYY-MM-DD
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// N일 전/후 날짜
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// 주말 여부 체크 (토, 일)
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}
