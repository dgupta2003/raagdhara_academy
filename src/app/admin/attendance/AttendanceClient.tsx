'use client';

import { useState } from 'react';
import type { Student, AttendanceStatus } from '@/lib/firebase/types';

const BATCH_OPTIONS = [
  { id: 'normal', label: 'Normal Batch' },
  { id: 'special', label: 'Special Batch' },
  { id: 'personal', label: 'Personal Classes' },
];

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; style: string }[] = [
  { value: 'present', label: 'Present', style: 'bg-green-100 text-green-700 ring-green-400' },
  { value: 'absent', label: 'Absent', style: 'bg-red-100 text-red-700 ring-red-400' },
  { value: 'excused', label: 'Excused', style: 'bg-amber-100 text-amber-700 ring-amber-400' },
];

export default function AttendanceClient({ students }: { students: (Student & { id: string })[] }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [batchFilter, setBatchFilter] = useState('all');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const filtered = students.filter((s) => batchFilter === 'all' || s.batchType === batchFilter);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    filtered.forEach((s) => { next[s.id] = status; });
    setAttendance((prev) => ({ ...prev, ...next }));
  };

  const markedCount = filtered.filter((s) => attendance[s.id]).length;

  const handleSave = async () => {
    if (markedCount === 0) {
      setSaveError('Mark at least one student before saving.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const records = filtered
      .filter((s) => attendance[s.id])
      .map((s) => ({
        studentId: s.id,
        courseId: s.courseId,
        batchType: s.batchType,
        status: attendance[s.id],
      }));

    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, records }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save attendance');
      }
      setSaveSuccess(true);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-border shadow-warm p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-muted-foreground mb-1 font-body uppercase tracking-wide">Session date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => { setDate(e.target.value); setSaveSuccess(false); }}
            className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1 font-body uppercase tracking-wide">Batch</label>
          <select
            value={batchFilter}
            onChange={(e) => { setBatchFilter(e.target.value); setSaveSuccess(false); }}
            className="px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All batches</option>
            {BATCH_OPTIONS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {(['present', 'absent'] as AttendanceStatus[]).map((s) => (
            <button key={s} onClick={() => markAll(s)} className="px-3 py-2 text-xs font-body border border-border rounded-md hover:bg-muted/50 transition-colors capitalize">
              All {s}
            </button>
          ))}
        </div>
      </div>

      {/* Student list */}
      {filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">No active students in this batch.</p>
      ) : (
        <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden mb-4">
          <div className="divide-y divide-border">
            {filtered.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{student.displayName}</p>
                  <p className="font-body text-xs text-muted-foreground capitalize">{student.batchType}</p>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(student.id, opt.value)}
                      className={`px-3 py-1 text-xs font-body font-medium rounded-md transition-all ${
                        attendance[student.id] === opt.value
                          ? `${opt.style} ring-2`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {saveError && <p className="text-sm text-error font-body mb-3">{saveError}</p>}
      {saveSuccess && <p className="text-sm text-green-600 font-body mb-3">Attendance saved for {markedCount} student{markedCount !== 1 ? 's' : ''}.</p>}

      <button
        onClick={handleSave}
        disabled={isSaving || filtered.length === 0}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-body text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
      >
        {isSaving ? 'Saving…' : `Save attendance (${markedCount}/${filtered.length} marked)`}
      </button>
    </div>
  );
}
