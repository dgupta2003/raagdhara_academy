'use client';

import Link from 'next/link';
import type { Student, Payment, Attendance, PaymentStatus, StudentStatus, AttendanceStatus } from '@/lib/firebase/types';

const COURSES: Record<string, string> = {
  'hindustani-classical-vocal': 'Hindustani Classical Vocal Music',
  'popular-film-music-hindi': 'Popular and Film Music - Hindi',
  'devotional-hindi': 'Devotional - Hindi',
  'ghazal': 'Ghazal',
  'bhatkhande-full-course': 'Bhatkhande Sangeet Vidyapeeth - Full Course',
};

const BATCH_LABELS: Record<string, string> = {
  normal: 'Normal Batch',
  special: 'Special Batch',
  personal: 'Personal Classes',
};

const STATUS_STYLES: Record<StudentStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ATTENDANCE_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-50 text-green-700 border-green-200',
  absent: 'bg-red-50 text-red-700 border-red-200',
  excused: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PAYMENT_STYLES: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'bg-green-50 text-green-700 border-green-200' },
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  sent: { label: 'Sent', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

function formatSessionDate(d: string) {
  // d is YYYY-MM-DD
  const [year, month, day] = d.split('-');
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

function formatInr(paise: number) {
  const rupees = Math.floor(paise / 100);
  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000);
    const remainder = rupees % 1000;
    return `₹${thousands},${remainder.toString().padStart(3, '0')}`;
  }
  return `₹${rupees}`;
}

function formatAmount(amount: number, currency: string) {
  return currency === 'USD' ? `$${amount}` : formatInr(amount);
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  excused: number;
  rate: number;
}

export default function StudentAnalyticsClient({
  student,
  attendanceStats,
  recentAttendance,
  recentPayments,
}: {
  student: Student & { id: string };
  attendanceStats: AttendanceStats;
  recentAttendance: (Attendance & { id: string })[];
  recentPayments: (Payment & { id: string })[];
}) {
  const courseName = COURSES[student.courseId] ?? student.courseId;
  const batchName = BATCH_LABELS[student.batchType] ?? student.batchType;
  const batchDisplay = student.batchLabel ? `${batchName} — ${student.batchLabel}` : batchName;
  const enrollmentDate = student.enrollmentDate
    ? formatDate((student.enrollmentDate as string).split('T')[0])
    : '—';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <a href="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All students
          </a>
          <h1 className="font-headline text-2xl font-semibold text-foreground">{student.displayName}</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{student.email}</p>
        </div>
        <Link
          href={`/admin/students/${student.id}/edit`}
          className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-body font-medium hover:bg-primary/90 transition-contemplative flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Details
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-card rounded-lg border border-border shadow-warm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
            <p className="font-body text-sm text-foreground">{student.countryCode} {student.phone}</p>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border capitalize ${STATUS_STYLES[student.status]}`}>
              {student.status}
            </span>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Course</p>
            <p className="font-body text-sm text-foreground">{courseName}</p>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Batch</p>
            <p className="font-body text-sm text-foreground">{batchDisplay}</p>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Category</p>
            <p className="font-body text-sm text-foreground capitalize">{student.category === 'nri' ? 'NRI' : 'India'}</p>
          </div>
          <div>
            <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Enrolled</p>
            <p className="font-body text-sm text-foreground">{enrollmentDate}</p>
          </div>
        </div>
      </div>

      {/* Attendance stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: attendanceStats.total, color: 'text-foreground' },
          { label: 'Present', value: attendanceStats.present, color: 'text-green-700' },
          { label: 'Absent / Excused', value: attendanceStats.absent + attendanceStats.excused, color: 'text-red-700' },
          { label: 'Attendance Rate', value: `${attendanceStats.rate}%`, color: attendanceStats.rate >= 75 ? 'text-green-700' : 'text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-lg border border-border shadow-warm p-5 text-center">
            <p className={`font-headline text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance history + payments side by side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent attendance */}
        <div className="bg-card rounded-lg border border-border shadow-warm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-headline text-base font-semibold text-foreground">Recent Attendance</h2>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Last {recentAttendance.length} sessions</p>
          </div>
          {recentAttendance.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground px-5 py-4">No sessions recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentAttendance.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between px-5 py-2.5">
                  <span className="font-body text-sm text-foreground">
                    {formatSessionDate(rec.sessionDate as string)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border capitalize ${ATTENDANCE_STYLES[rec.status]}`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-card rounded-lg border border-border shadow-warm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-headline text-base font-semibold text-foreground">Recent Payments</h2>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Last {recentPayments.length} invoices</p>
          </div>
          {recentPayments.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground px-5 py-4">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentPayments.map((payment) => {
                const cfg = PAYMENT_STYLES[payment.status];
                const dueParts = (payment.dueDate as string).split('-');
                const monthYear = `${MONTHS[parseInt(dueParts[1]) - 1]} ${dueParts[0]}`;
                return (
                  <div key={payment.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <p className="font-body text-sm text-foreground">{monthYear}</p>
                      <p className="font-body text-xs text-muted-foreground">{formatAmount(payment.amount, payment.currency)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${cfg.classes}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
