'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Student } from '@/lib/firebase/types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
};

const CATEGORY_STYLES: Record<string, string> = {
  india: 'bg-blue-100 text-blue-700',
  nri: 'bg-purple-100 text-purple-700',
};

interface Props {
  students: (Student & { id: string })[];
  courseLabels: Record<string, string>;
}

export default function StudentsClient({ students, courseLabels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteAllLoading, setInviteAllLoading] = useState(false);
  const [inviteAllResult, setInviteAllResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') ?? 'all';
  const categoryFilter = searchParams.get('category') ?? 'all';

  const filtered = students.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    router.push(`/admin/students?${params.toString()}`);
  };

  const handleApprove = async (studentId: string, studentName: string) => {
    if (!confirm(`Approve ${studentName}? They will receive a welcome email.`)) return;
    setApprovingId(studentId);
    setApproveError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to approve student');
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setApproveError((err as Error).message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleInvite = async (studentId: string, studentName: string) => {
    setInvitingId(studentId);
    setInviteError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}/invite`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invite');
      startTransition(() => router.refresh());
    } catch (err) {
      setInviteError(`${studentName}: ${(err as Error).message}`);
    } finally {
      setInvitingId(null);
    }
  };

  const handleInviteAll = async () => {
    if (!confirm('Send portal invite emails to all active students who haven\'t been invited yet?')) return;
    setInviteAllLoading(true);
    setInviteAllResult(null);
    setInviteError(null);

    try {
      const res = await fetch('/api/admin/students/invite-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invites');
      setInviteAllResult(`Invited ${data.invited} student${data.invited !== 1 ? 's' : ''}. Skipped ${data.skipped}.${data.errors?.length ? ` ${data.errors.length} error(s).` : ''}`);
      startTransition(() => router.refresh());
    } catch (err) {
      setInviteError((err as Error).message);
    } finally {
      setInviteAllLoading(false);
    }
  };

  const uninvitedCount = students.filter((s) => s.status === 'active' && !s.inviteSentAt && s.email).length;

  return (
    <div>
      {/* Top actions row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-muted-foreground">Status:</span>
            {['all', 'pending', 'active', 'inactive'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter('status', s)}
                className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-colors ${
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-muted-foreground">Category:</span>
            {['all', 'india', 'nri'].map((c) => (
              <button
                key={c}
                onClick={() => setFilter('category', c)}
                className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-colors ${
                  categoryFilter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {c === 'all' ? 'All' : c === 'india' ? 'India' : 'NRI'}
              </button>
            ))}
          </div>
        </div>

        {/* Invite All button */}
        {uninvitedCount > 0 && (
          <button
            onClick={handleInviteAll}
            disabled={inviteAllLoading || isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {inviteAllLoading ? 'Sending…' : `Invite All (${uninvitedCount})`}
          </button>
        )}
      </div>

      {approveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">{approveError}</div>
      )}
      {inviteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">{inviteError}</div>
      )}
      {inviteAllResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">{inviteAllResult}</div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-12 text-center shadow-warm">
          <p className="font-body text-muted-foreground">No students match the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Portal</th>
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-medium text-foreground">{student.displayName}</p>
                    <p className="font-body text-xs text-muted-foreground">{student.email || <span className="text-amber-600">No email</span>}</p>
                    <p className="font-body text-xs text-muted-foreground">{student.countryCode} {student.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-foreground">{courseLabels[student.courseId] ?? student.courseId}</p>
                    <p className="font-body text-xs text-muted-foreground capitalize">{student.batchType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[student.category]}`}>
                      {student.category === 'india' ? 'India' : 'NRI'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[student.status]}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {student.status === 'active' && (
                      student.inviteSentAt ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Invited</span>
                          <button
                            onClick={() => handleInvite(student.id, student.displayName)}
                            disabled={invitingId === student.id || isPending}
                            className="px-2 py-0.5 text-xs font-body text-muted-foreground border border-border rounded hover:bg-muted/50 disabled:opacity-50 transition-colors"
                          >
                            {invitingId === student.id ? '…' : 'Resend'}
                          </button>
                        </div>
                      ) : student.email ? (
                        <button
                          onClick={() => handleInvite(student.id, student.displayName)}
                          disabled={invitingId === student.id || isPending}
                          className="px-3 py-1 text-xs font-body font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {invitingId === student.id ? 'Sending…' : 'Send Invite'}
                        </button>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No email</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {student.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(student.id, student.displayName)}
                          disabled={approvingId === student.id || isPending}
                          className="px-3 py-1 text-xs font-body font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {approvingId === student.id ? 'Approving…' : 'Approve'}
                        </button>
                      )}
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="px-3 py-1 text-xs font-body font-medium border border-border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
