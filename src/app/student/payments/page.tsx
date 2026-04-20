import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Payment, Student } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import PaymentsClient from './PaymentsClient';

async function getPaymentsData() {
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
  if (student.status === 'pending') redirect('/student');

  const snap = await adminDb
    .collection('payments')
    .where('studentId', '==', uid)
    .get();

  const payments = snap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as Payment) }))
    .sort((a, b) => (b.dueDate as string).localeCompare(a.dueDate as string));

  return { payments };
}

export default async function StudentPaymentsPage() {
  const { payments } = await getPaymentsData();

  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const pendingCount = payments.filter((p) => p.status !== 'paid').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Payments</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Your invoice history.
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

      <PaymentsClient payments={payments} />
    </div>
  );
}
