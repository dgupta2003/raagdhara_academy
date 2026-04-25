import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student, Guardian, Attendance, Payment } from '@/lib/firebase/types';

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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`;
  const rupees = Math.floor(amount / 100);
  return rupees >= 1000
    ? `₹${Math.floor(rupees / 1000)},${(rupees % 1000).toString().padStart(3, '0')}`
    : `₹${rupees}`;
}

async function getParentOverview(childParam?: string) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  let guardianId: string;
  let authUid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    authUid = decoded.uid;
    const userDoc = await adminDb.collection('users').doc(authUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'parent') redirect('/auth/login');
    guardianId = userDoc.data()?.guardianId;
  } catch {
    redirect('/auth/login');
  }

  const guardianDoc = await adminDb.collection('guardians').doc(guardianId).get();
  if (!guardianDoc.exists) redirect('/auth/login');
  const guardian = guardianDoc.data() as Guardian;

  const studentId = guardian.studentIds.includes(childParam ?? '')
    ? childParam!
    : guardian.studentIds[0];

  const studentDoc = await adminDb.collection('students').doc(studentId).get();
  if (!studentDoc.exists) redirect('/auth/login');
  const student = studentDoc.data() as Student;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [attendanceSnap, paymentsSnap] = await Promise.all([
    adminDb.collection('attendance').where('studentId', '==', studentId).get(),
    adminDb.collection('payments').where('studentId', '==', studentId).get(),
  ]);

  const allRecords = attendanceSnap.docs.map((d) => d.data() as Attendance);
  const recentRecords = allRecords.filter((r) => (r.sessionDate as string) >= thirtyDaysAgoStr);
  const presentCount = recentRecords.filter((r) => r.status === 'present').length;
  const attendanceStats = {
    total: recentRecords.length,
    present: presentCount,
    percent: recentRecords.length > 0 ? Math.round((presentCount / recentRecords.length) * 100) : 0,
  };

  const allPayments = paymentsSnap.docs.map((d) => d.data() as Payment);
  const latestPayment = allPayments.length === 0 ? null
    : allPayments.sort((a, b) => (b.dueDate as string).localeCompare(a.dueDate as string))[0];

  return { student, studentId, guardian, attendanceStats, latestPayment };
}

const paymentStatusColor: Record<string, string> = {
  paid: 'text-green-700 bg-green-50 border-green-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  sent: 'text-amber-700 bg-amber-50 border-amber-200',
  overdue: 'text-red-700 bg-red-50 border-red-200',
};

export default async function ParentOverviewPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const { student, studentId, guardian, attendanceStats, latestPayment } =
    await getParentOverview(searchParams.child);

  const isMultiChild = guardian.studentIds.length > 1;
  const courseName = COURSE_LABELS[student.courseId] ?? student.courseId;
  const batchName = BATCH_LABELS[student.batchType] ?? student.batchType;
  const childParam = `?child=${studentId}`;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">
          {isMultiChild ? `${student.displayName}'s Progress` : `Welcome`}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href={`/parent/attendance${childParam}`}
          className="block rounded-lg border p-5 border-primary/20 bg-primary/5 hover:shadow-warm transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="font-headline text-3xl font-bold text-primary">{attendanceStats.percent}%</span>
          </div>
          <p className="font-body text-sm text-foreground font-medium">Attendance (last 30 days)</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            {attendanceStats.present} of {attendanceStats.total} sessions
          </p>
        </Link>

        <Link
          href={`/parent/payments${childParam}`}
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

      <div className="bg-white rounded-lg border border-border p-6 shadow-warm">
        <h2 className="font-headline text-lg font-semibold text-foreground mb-4">Quick links</h2>
        <div className="space-y-2">
          <Link href={`/parent/attendance${childParam}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">View full attendance history</span>
          </Link>
          <Link href={`/parent/payments${childParam}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">View and pay invoices</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
