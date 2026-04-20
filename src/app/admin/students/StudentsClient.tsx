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

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
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

      {approveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">{approveError}</div>
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
                <th className="text-left px-4 py-3 font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-medium text-foreground">{student.displayName}</p>
                    <p className="font-body text-xs text-muted-foreground">{student.email}</p>
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
