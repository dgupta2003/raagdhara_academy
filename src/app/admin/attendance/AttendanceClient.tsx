'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Student, Batch, AttendanceStatus } from '@/lib/firebase/types';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';

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

export default function AttendanceClient({
  students,
  batches,
}: {
  students: (Student & { id: string })[];
  batches: (Batch & { id: string })[];
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [batchFilter, setBatchFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadExisting = useCallback(async (d: string) => {
    setIsLoading(true);
    setAttendance({});
    setSaveSuccess(false);
    setSaveError('');
    try {
      const res = await fetch(`/api/admin/attendance?date=${d}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.records ?? {});
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadExisting(today); }, [loadExisting, today]);

  // Groups available for the selected batch (only meaningful for 'normal')
  const groupsInBatch = batchFilter === 'normal'
    ? Array.from(new Set(
        students
          .filter((s) => s.batchType === 'normal' && s.batchLabel)
          .map((s) => s.batchLabel as string)
      )).sort()
    : [];

  const showGroupFilter = batchFilter === 'normal' && groupsInBatch.length > 0;

  const filtered = students.filter((s) => {
    if (batchFilter !== 'all' && s.batchType !== batchFilter) return false;
    if (showGroupFilter && groupFilter !== 'all' && s.batchLabel !== groupFilter) return false;
    return true;
  });

  // Derive session days for calendar highlighting from the matching batch doc
  const scheduleDays = useMemo(() => {
    if (batchFilter === 'all') return undefined;
    const targetLabel = groupFilter === 'all' ? null : groupFilter;
    return batches.find(
      (b) => b.batchType === batchFilter && (b.batchLabel ?? null) === targetLabel
    )?.daysOfWeek;
  }, [batches, batchFilter, groupFilter]);

  const handleBatchChange = (val: string) => {
    setBatchFilter(val);
    setGroupFilter('all');
    setSaveSuccess(false);
  };

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
      <div className="bg-white rounded-lg border border-border shadow-warm p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-start">
          {/* Calendar date picker */}
          <div className="flex-none">
            <label className="block text-xs font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">Session date</label>
            <CalendarDatePicker
              value={date}
              onChange={(d) => { setDate(d); loadExisting(d); }}
              maxDate={today}
              scheduleDays={scheduleDays}
            />
          </div>

          {/* Batch + group filters + mark-all actions */}
          <div className="flex flex-col gap-4 flex-1 min-w-48">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1 font-body uppercase tracking-wide">Batch</label>
              <select
                value={batchFilter}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All batches</option>
                {BATCH_OPTIONS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            {showGroupFilter && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 font-body uppercase tracking-wide">Group</label>
                <select
                  value={groupFilter}
                  onChange={(e) => { setGroupFilter(e.target.value); setSaveSuccess(false); }}
                  className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All groups</option>
                  {groupsInBatch.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
            {scheduleDays && scheduleDays.length > 0 && (
              <p className="font-body text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-200 mr-1 align-middle" />
                Highlighted dates = scheduled sessions
              </p>
            )}
            <div className="flex gap-2 pt-1">
              {(['present', 'absent'] as AttendanceStatus[]).map((s) => (
                <button key={s} onClick={() => markAll(s)} className="px-3 py-2 text-xs font-body border border-border rounded-md hover:bg-muted/50 transition-colors capitalize">
                  All {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student list */}
      {isLoading ? (
        <p className="font-body text-sm text-muted-foreground">Loading attendance…</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">No active students in this batch.</p>
      ) : (
        <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden mb-4">
          <div className="divide-y divide-border">
            {filtered.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{student.displayName}</p>
                  <p className="font-body text-xs text-muted-foreground capitalize">
                    {student.batchLabel ?? student.batchType}
                  </p>
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
