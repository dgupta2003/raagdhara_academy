import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student, Attendance, Payment } from '@/lib/firebase/types';

const COURSE_LABELS: Record<string, string> = {
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

function formatAmount(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`;
  return `₹${(amount / 100).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function getStudentOverview() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    redirect('/auth/login');
  }

  const studentDoc = await adminDb.collection('students').doc(uid).get();
  if (!studentDoc.exists) redirect('/auth/login');
  const student = studentDoc.data() as Student;

  if (student.status !== 'active') {
    return { student, uid, attendanceStats: null, latestPayment: null };
  }

  // For active students: fetch all attendance + all payments in parallel, filter/sort in JS.
  // Avoids composite index requirement — single-field equality queries use auto-indexing.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [attendanceSnap, paymentsSnap] = await Promise.all([
    adminDb.collection('attendance').where('studentId', '==', uid).get(),
    adminDb.collection('payments').where('studentId', '==', uid).get(),
  ]);

  const allRecords = attendanceSnap.docs.map((d) => d.data() as Attendance);
  const records = allRecords.filter((r) => (r.sessionDate as string) >= thirtyDaysAgoStr);
  const presentCount = records.filter((r) => r.status === 'present').length;
  const attendanceStats = {
    total: records.length,
    present: presentCount,
    percent: records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0,
  };

  const allPayments = paymentsSnap.docs.map((d) => d.data() as Payment);
  const latestPayment = allPayments.length === 0 ? null :
    allPayments.sort((a, b) => (b.dueDate as string).localeCompare(a.dueDate as string))[0];

  return { student, uid, attendanceStats, latestPayment };
}

export default async function StudentOverviewPage() {
  const { student, attendanceStats, latestPayment } = await getStudentOverview();

  const courseName = COURSE_LABELS[student.courseId] ?? student.courseId;
  const batchName = BATCH_LABELS[student.batchType] ?? student.batchType;
  const isPending = student.status === 'pending';

  if (isPending) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-headline text-2xl font-semibold text-foreground">
            Welcome, {student.displayName}
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{student.email}</p>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-warm p-6">
          <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-md mb-6">
            <p className="font-body text-sm font-medium text-foreground mb-1">Your account is under review</p>
            <p className="font-body text-sm text-muted-foreground">
              Vaishnavi will review and activate your account shortly. You&apos;ll be able to access your attendance records and invoices once approved.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-body">Course</span>
              <span className="text-foreground font-body font-medium">{courseName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-body">Batch</span>
              <span className="text-foreground font-body font-medium">{batchName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-body">Category</span>
              <span className="text-foreground font-body font-medium capitalize">{student.category === 'nri' ? 'NRI' : 'India'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-body">Status</span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-body font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Pending approval
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active student overview
  const paymentStatusColor: Record<string, string> = {
    paid: 'text-green-700 bg-green-50 border-green-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    sent: 'text-amber-700 bg-amber-50 border-amber-200',
    overdue: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">
          Welcome back, {student.displayName}
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="font-body text-sm text-muted-foreground">{courseName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-body text-sm text-muted-foreground">{batchName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="inline-flex items-center gap-1 font-body text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Active
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Attendance stat */}
        <Link
          href="/student/attendance"
          className="block rounded-lg border p-5 border-primary/20 bg-primary/5 hover:shadow-warm transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="font-headline text-3xl font-bold text-primary">
              {attendanceStats!.percent}%
            </span>
          </div>
          <p className="font-body text-sm text-foreground font-medium">Attendance (last 30 days)</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            {attendanceStats!.present} of {attendanceStats!.total} sessions
          </p>
        </Link>

        {/* Payment stat */}
        <Link
          href="/student/payments"
          className={`block rounded-lg border p-5 hover:shadow-warm transition-shadow ${
            latestPayment
              ? paymentStatusColor[latestPayment.status] ?? 'border-border bg-white'
              : 'border-border bg-white'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <svg className="w-6 h-6 text-current opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {latestPayment ? (
              <span className="font-headline text-2xl font-bold">
                {formatAmount(latestPayment.amount, latestPayment.currency)}
              </span>
            ) : (
              <span className="font-headline text-lg font-medium text-muted-foreground">—</span>
            )}
          </div>
          <p className="font-body text-sm font-medium">
            {latestPayment ? `Due ${formatDate(latestPayment.dueDate as string)}` : 'No invoices yet'}
          </p>
          {latestPayment && (
            <p className="font-body text-xs mt-0.5 capitalize">{latestPayment.status}</p>
          )}
        </Link>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-lg border border-border p-6 shadow-warm">
        <h2 className="font-headline text-lg font-semibold text-foreground mb-4">Quick links</h2>
        <div className="space-y-2">
          <Link href="/student/attendance" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">View full attendance history</span>
          </Link>
          <Link href="/student/payments" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">View payment invoices</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
