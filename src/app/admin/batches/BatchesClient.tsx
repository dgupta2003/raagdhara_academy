'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Student, Batch } from '@/lib/firebase/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BATCH_TYPE_ORDER = ['normal', 'special', 'personal'];
const BATCH_TYPE_LABELS: Record<string, string> = {
  normal: 'Normal Batch',
  special: 'Special Batch',
  personal: 'Personal Classes',
};

interface BatchGroup {
  batchType: string;
  batchLabel: string | null;
  displayName: string;
  students: (Student & { id: string })[];
  batchDoc: (Batch & { id: string }) | null;
}

interface MovingState {
  studentId: string;
  studentName: string;
  targetBatchType: string;
  targetBatchLabel: string;
}

interface ScheduleForm {
  daysOfWeek: number[];
  sessionTime: string;
  sessionDurationMinutes: number;
  displayName: string;
}

export default function BatchesClient({
  students,
  batches,
}: {
  students: (Student & { id: string })[];
  batches: (Batch & { id: string })[];
}) {
  const router = useRouter();
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({ daysOfWeek: [], sessionTime: '18:00', sessionDurationMinutes: 45, displayName: '' });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [movingState, setMovingState] = useState<MovingState | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState('');

  // Derive batch groups from students
  const groups = useMemo<BatchGroup[]>(() => {
    const map = new Map<string, BatchGroup>();

    students.forEach((s) => {
      const key = `${s.batchType}__${s.batchLabel ?? ''}`;
      if (!map.has(key)) {
        const label = s.batchLabel ?? null;
        const typeName = BATCH_TYPE_LABELS[s.batchType] ?? s.batchType;
        const displayName = label ? `${typeName} — ${label}` : typeName;
        const batchDoc = batches.find(
          (b) => b.batchType === s.batchType && (b.batchLabel ?? null) === label
        ) ?? null;
        map.set(key, { batchType: s.batchType, batchLabel: label, displayName, students: [], batchDoc });
      }
      map.get(key)!.students.push(s);
    });

    return Array.from(map.values()).sort((a, b) => {
      const ai = BATCH_TYPE_ORDER.indexOf(a.batchType);
      const bi = BATCH_TYPE_ORDER.indexOf(b.batchType);
      if (ai !== bi) return ai - bi;
      return (a.batchLabel ?? '').localeCompare(b.batchLabel ?? '');
    });
  }, [students, batches]);

  // All available groups for the move-batch dropdown
  const allGroupOptions = groups.map((g) => ({
    batchType: g.batchType,
    batchLabel: g.batchLabel ?? '',
    displayName: g.displayName,
  }));

  const groupKey = (batchType: string, batchLabel: string | null) =>
    `${batchType}__${batchLabel ?? ''}`;

  const openScheduleForm = (group: BatchGroup) => {
    const key = groupKey(group.batchType, group.batchLabel);
    setEditingGroupKey(key);
    setScheduleError('');
    if (group.batchDoc) {
      setScheduleForm({
        daysOfWeek: group.batchDoc.daysOfWeek ?? [],
        sessionTime: group.batchDoc.sessionTime ?? '18:00',
        sessionDurationMinutes: group.batchDoc.sessionDurationMinutes ?? 45,
        displayName: group.batchDoc.displayName ?? group.displayName,
      });
    } else {
      setScheduleForm({ daysOfWeek: [], sessionTime: '18:00', sessionDurationMinutes: 45, displayName: group.displayName });
    }
  };

  const toggleDay = (day: number) => {
    setScheduleForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b),
    }));
  };

  const saveSchedule = async (group: BatchGroup) => {
    if (scheduleForm.daysOfWeek.length === 0) {
      setScheduleError('Select at least one day.');
      return;
    }
    setScheduleLoading(true);
    setScheduleError('');
    try {
      if (group.batchDoc) {
        const res = await fetch(`/api/admin/batches/${group.batchDoc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleForm),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update');
      } else {
        const res = await fetch('/api/admin/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batchType: group.batchType,
            batchLabel: group.batchLabel,
            ...scheduleForm,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create');
      }
      setEditingGroupKey(null);
      router.refresh();
    } catch (e) {
      setScheduleError((e as Error).message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const openMoveModal = (student: Student & { id: string }) => {
    setMovingState({
      studentId: student.id,
      studentName: student.displayName,
      targetBatchType: student.batchType,
      targetBatchLabel: student.batchLabel ?? '',
    });
    setMoveError('');
  };

  const confirmMove = async () => {
    if (!movingState) return;
    setMoveLoading(true);
    setMoveError('');
    try {
      const res = await fetch(`/api/admin/students/${movingState.studentId}/move-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchType: movingState.targetBatchType,
          batchLabel: movingState.targetBatchLabel || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to move student');
      setMovingState(null);
      router.refresh();
    } catch (e) {
      setMoveError((e as Error).message);
    } finally {
      setMoveLoading(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-warm p-12 text-center">
        <p className="font-body text-muted-foreground">No active students found. Add students and assign them to batches first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const key = groupKey(group.batchType, group.batchLabel);
        const isEditing = editingGroupKey === key;
        const doc = group.batchDoc;

        return (
          <div key={key} className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-headline text-lg font-semibold text-foreground">{group.displayName}</h2>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  {group.students.length} student{group.students.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => isEditing ? setEditingGroupKey(null) : openScheduleForm(group)}
                className="px-3 py-1.5 text-xs font-body font-medium border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                {isEditing ? 'Cancel' : doc ? 'Edit Schedule' : 'Set Schedule'}
              </button>
            </div>

            {/* Schedule display */}
            {!isEditing && (
              <div className="px-6 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center gap-3">
                {doc ? (
                  <>
                    <div className="flex gap-1.5">
                      {doc.daysOfWeek.map((d) => (
                        <span key={d} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium bg-primary/10 text-primary border border-primary/20">
                          {DAY_LABELS[d]}
                        </span>
                      ))}
                    </div>
                    <span className="font-body text-sm text-foreground">{doc.sessionTime}</span>
                    <span className="font-body text-xs text-muted-foreground">· {doc.sessionDurationMinutes} min</span>
                  </>
                ) : (
                  <p className="font-body text-xs text-muted-foreground italic">No schedule set — click &quot;Set Schedule&quot; to define session days and time.</p>
                )}
              </div>
            )}

            {/* Schedule edit form */}
            {isEditing && (
              <div className="px-6 py-4 border-b border-border bg-amber-50/40">
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2">Session days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAY_FULL.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`px-3 py-1.5 text-xs font-body font-medium rounded-md border transition-colors ${
                            scheduleForm.daysOfWeek.includes(i)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white text-foreground border-border hover:bg-muted/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Session time</label>
                      <input
                        type="time"
                        value={scheduleForm.sessionTime}
                        onChange={(e) => setScheduleForm((p) => ({ ...p, sessionTime: e.target.value }))}
                        className="px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Duration (min)</label>
                      <input
                        type="number"
                        min={15}
                        max={180}
                        value={scheduleForm.sessionDurationMinutes}
                        onChange={(e) => setScheduleForm((p) => ({ ...p, sessionDurationMinutes: parseInt(e.target.value) || 45 }))}
                        className="w-24 px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  {scheduleError && <p className="text-xs text-red-600 font-body">{scheduleError}</p>}
                  <button
                    onClick={() => saveSchedule(group)}
                    disabled={scheduleLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-body font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
                  >
                    {scheduleLoading ? 'Saving…' : 'Save Schedule'}
                  </button>
                </div>
              </div>
            )}

            {/* Students */}
            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {group.students.map((student) => (
                  <div key={student.id} className="flex items-center gap-1 bg-muted/50 border border-border rounded-full pl-3 pr-1 py-1">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="font-body text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {student.displayName}
                    </Link>
                    <button
                      onClick={() => openMoveModal(student)}
                      title="Move to another batch"
                      className="ml-1 p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Move-batch modal */}
      {movingState && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-border shadow-warm p-6 w-full max-w-sm">
            <h3 className="font-headline text-lg font-semibold text-foreground mb-1">Move student</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Moving <strong>{movingState.studentName}</strong> to a different batch.
            </p>
            <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Target batch</label>
            <select
              value={`${movingState.targetBatchType}__${movingState.targetBatchLabel}`}
              onChange={(e) => {
                const [bt, bl] = e.target.value.split('__');
                setMovingState((p) => p ? { ...p, targetBatchType: bt, targetBatchLabel: bl } : null);
              }}
              className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
            >
              {allGroupOptions.map((opt) => (
                <option key={`${opt.batchType}__${opt.batchLabel}`} value={`${opt.batchType}__${opt.batchLabel}`}>
                  {opt.displayName}
                </option>
              ))}
            </select>
            {moveError && <p className="text-xs text-red-600 font-body mb-3">{moveError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setMovingState(null); setMoveError(''); }}
                className="px-4 py-2 text-sm font-body border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMove}
                disabled={moveLoading}
                className="px-4 py-2 text-sm font-body font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
              >
                {moveLoading ? 'Moving…' : 'Confirm Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
