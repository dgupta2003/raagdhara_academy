'use client';

import { useState, useMemo } from 'react';

interface CalendarDatePickerProps {
  value: string;               // YYYY-MM-DD
  onChange: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void; // 0-based month
  maxDate?: string;            // YYYY-MM-DD, defaults to today
  highlightedDates?: string[]; // YYYY-MM-DD dates to highlight amber (actual session dates)
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseYMD(s: string): { year: number; month: number; day: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m - 1, day: d }; // month is 0-based
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarDatePicker({
  value,
  onChange,
  onMonthChange,
  maxDate,
  highlightedDates,
}: CalendarDatePickerProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const effectiveMax = maxDate ?? todayStr;
  const max = parseYMD(effectiveMax);

  const initial = value ? parseYMD(value) : parseYMD(todayStr);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const selected = value ? parseYMD(value) : null;
  const today = parseYMD(todayStr);

  // Build a set of highlighted date strings for O(1) lookup
  const highlightSet = useMemo(
    () => new Set(highlightedDates ?? []),
    [highlightedDates]
  );

  // Number of days in the viewed month
  const daysInMonth = useMemo(
    () => new Date(viewYear, viewMonth + 1, 0).getDate(),
    [viewYear, viewMonth]
  );

  // Day of week the month starts on (0=Sun)
  const firstDayOffset = useMemo(
    () => new Date(viewYear, viewMonth, 1).getDay(),
    [viewYear, viewMonth]
  );

  const canGoNext =
    viewYear < max.year || (viewYear === max.year && viewMonth < max.month);

  const goNext = () => {
    let y = viewYear;
    let m = viewMonth;
    if (m === 11) { m = 0; y += 1; } else m += 1;
    setViewMonth(m);
    setViewYear(y);
    onMonthChange?.(y, m);
  };

  const goPrev = () => {
    let y = viewYear;
    let m = viewMonth;
    if (m === 0) { m = 11; y -= 1; } else m -= 1;
    setViewMonth(m);
    setViewYear(y);
    onMonthChange?.(y, m);
  };

  const isFuture = (day: number) => {
    if (viewYear > max.year) return true;
    if (viewYear === max.year && viewMonth > max.month) return true;
    if (viewYear === max.year && viewMonth === max.month && day > max.day) return true;
    return false;
  };

  const isSelected = (day: number) =>
    selected !== null &&
    selected.year === viewYear &&
    selected.month === viewMonth &&
    selected.day === day;

  const isToday = (day: number) =>
    today.year === viewYear && today.month === viewMonth && today.day === day;

  const isHighlighted = (day: number) => highlightSet.has(toYMD(viewYear, viewMonth, day));

  const handleClick = (day: number) => {
    if (isFuture(day)) return;
    onChange(toYMD(viewYear, viewMonth, day));
  };

  // Build a flat array of cells: null for blank padding, number for day
  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-72 bg-white rounded-lg border border-border shadow-warm p-3 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={goPrev}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-body text-sm font-medium text-foreground">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center font-body text-xs text-muted-foreground py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />;
          }

          const future = isFuture(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          const highlighted = isHighlighted(day);

          let cellClass = 'relative flex items-center justify-center h-8 w-full text-xs font-body rounded-full transition-colors ';

          if (future) {
            cellClass += 'text-muted-foreground opacity-40 cursor-not-allowed';
          } else if (sel) {
            cellClass += 'bg-primary text-primary-foreground cursor-pointer';
          } else if (highlighted) {
            cellClass += 'bg-amber-50 text-foreground border border-amber-200 cursor-pointer hover:bg-amber-100';
          } else {
            cellClass += 'text-foreground cursor-pointer hover:bg-muted/50';
          }

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleClick(day)}
              disabled={future}
              className={cellClass}
            >
              {day}
              {/* Today indicator — gold ring overlaid */}
              {tod && !sel && (
                <span className="absolute inset-0 rounded-full ring-2 ring-secondary pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
