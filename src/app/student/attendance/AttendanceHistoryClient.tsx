'use client';

import { useState, useMemo } from 'react';
import type { Attendance, AttendanceStatus } from '@/lib/firebase/types';

type AttendanceRecord = Attendance & { id: string };

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; classes: string; dot: string }> = {
  present: { label: 'Present', classes: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' },
  absent: { label: 'Absent', classes: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  excused: { label: 'Excused', classes: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AttendanceHistoryClient({ records }: { records: AttendanceRecord[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of records) {
      const key = monthKey(r.sessionDate as string);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [records]);

  const monthKeys = useMemo(() => Array.from(grouped.keys()), [grouped]);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(monthKeys.length > 0 ? [monthKeys[0]] : [])
  );

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (records.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-warm p-12 text-center">
        <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-body text-sm text-muted-foreground">No attendance records yet.</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Records will appear here once sessions are marked by Vaishnavi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {monthKeys.map((key) => {
        const monthRecords = grouped.get(key)!;
        const isOpen = expandedMonths.has(key);
        const presentCount = monthRecords.filter(r => r.status === 'present').length;
        const absentCount = monthRecords.filter(r => r.status === 'absent').length;
        const excusedCount = monthRecords.filter(r => r.status === 'excused').length;

        return (
          <div key={key} className="bg-card rounded-lg border border-border shadow-warm overflow-hidden">
            {/* Month header */}
            <button
              onClick={() => toggleMonth(key)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-contemplative"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="font-headline text-base font-semibold text-foreground">{monthLabel(key)}</span>
                <span className="font-body text-xs text-muted-foreground">{monthRecords.length} session{monthRecords.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                {presentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body bg-green-50 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {presentCount}
                  </span>
                )}
                {absentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body bg-red-50 text-red-700 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {absentCount}
                  </span>
                )}
                {excusedCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {excusedCount}
                  </span>
                )}
              </div>
            </button>

            {/* Records */}
            {isOpen && (
              <ul className="divide-y divide-border border-t border-border">
                {monthRecords.map((record) => {
                  const config = STATUS_CONFIG[record.status];
                  return (
                    <li key={record.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                        <span className="font-body text-sm text-foreground">
                          {formatSessionDate(record.sessionDate as string)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${config.classes}`}>
                        {config.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
