import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Payment, Guardian, Student } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import { getUsdToInrRate } from '@/lib/payments/exchange-rate';
import PaymentsClient from '@/app/student/payments/PaymentsClient';

async function getPaymentsData(childParam?: string) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  let guardianId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
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
  const student = studentDoc.data() as Student;

  const snap = await adminDb
    .collection('payments')
    .where('studentId', '==', studentId)
    .get();

  const payments = snap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as Payment) }))
    .sort((a, b) => (b.dueDate as string).localeCompare(a.dueDate as string));

  const hasUsdPayments = payments.some((p) => p.currency === 'USD');
  let exchangeRate: number | null = null;
  if (hasUsdPayments) {
    try {
      exchangeRate = await getUsdToInrRate();
    } catch {
      // Rate fetch failed — Pay button will fetch at click time
    }
  }

  return {
    payments,
    exchangeRate,
    studentCategory: student?.category ?? 'india',
    studentName: student?.displayName ?? 'Student',
  };
}

export default async function ParentPaymentsPage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const { payments, exchangeRate, studentCategory, studentName } = await getPaymentsData(searchParams.child);

  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const pendingCount = payments.filter((p) => p.status !== 'paid').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Payments</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {studentName}&apos;s invoice history.
          {payments.length > 0 && (
            <span className="ml-2">
              <span className="text-green-700 font-medium">{paidCount} paid</span>
              {pendingCount > 0 && (
                <span className="text-amber-700 font-medium"> · {pendingCount} pending</span>
              )}
            </span>
          )}
        </p>
      </div>

      <PaymentsClient
        payments={payments}
        exchangeRate={exchangeRate}
        studentCategory={studentCategory}
      />
    </div>
  );
}
