'use client';

import type { Attendance, AttendanceStatus } from '@/lib/firebase/types';

type AttendanceRecord = Attendance & { id: string };

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; classes: string; dot: string }> = {
  present: { label: 'Present', classes: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' },
  absent: { label: 'Absent', classes: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  excused: { label: 'Excused', classes: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
};

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AttendanceHistoryClient({ records }: { records: AttendanceRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-warm p-12 text-center">
        <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-body text-sm text-muted-foreground">No attendance records yet.</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Records will appear here once sessions are marked by Vaishnavi.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <p className="font-body text-sm text-muted-foreground">{records.length} sessions total</p>
      </div>
      <ul className="divide-y divide-border">
        {records.map((record) => {
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
    </div>
  );
}
