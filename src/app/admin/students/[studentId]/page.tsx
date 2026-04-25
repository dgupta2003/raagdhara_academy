import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student, Payment, Guardian } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import StudentEditClient from './StudentEditClient';

async function getStudentData(studentId: string) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const [studentDoc, paymentsSnap] = await Promise.all([
    adminDb.collection('students').doc(studentId).get(),
    adminDb.collection('payments').where('studentId', '==', studentId).get(),
  ]);

  if (!studentDoc.exists) notFound();

  const student = serializeDoc({ id: studentDoc.id, ...(studentDoc.data() as Student) });
  const payments = paymentsSnap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as Payment) }))
    .sort((a, b) => (b.dueDate as string).localeCompare(a.dueDate as string))
    .slice(0, 3);

  let guardianInfo = null;
  if (student.guardianUid) {
    const guardianDoc = await adminDb.collection('guardians').doc(student.guardianUid as string).get();
    if (guardianDoc.exists) {
      guardianInfo = serializeDoc({ id: guardianDoc.id, ...(guardianDoc.data() as Guardian) });
    }
  }

  return { student, recentPayments: payments, guardianInfo };
}

export default async function StudentDetailPage({ params }: { params: { studentId: string } }) {
  const { student, recentPayments, guardianInfo } = await getStudentData(params.studentId);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <a href="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to students
        </a>
        <h1 className="font-headline text-2xl font-semibold text-foreground">{student.displayName}</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">{student.email}</p>
      </div>

      <StudentEditClient student={student} recentPayments={recentPayments} guardianInfo={guardianInfo} />
    </div>
  );
}
