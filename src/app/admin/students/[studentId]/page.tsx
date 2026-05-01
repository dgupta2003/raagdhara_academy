import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student, Payment, Attendance } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import StudentAnalyticsClient from './StudentAnalyticsClient';

async function getStudentAnalytics(studentId: string) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const [studentDoc, attendanceSnap, paymentsSnap] = await Promise.all([
    adminDb.collection('students').doc(studentId).get(),
    adminDb.collection('attendance').where('studentId', '==', studentId).get(),
    adminDb.collection('payments').where('studentId', '==', studentId).get(),
  ]);

  if (!studentDoc.exists) notFound();

  const student = serializeDoc({ id: studentDoc.id, ...(studentDoc.data() as Student) });

  const allAttendance = attendanceSnap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as Attendance) }))
    .sort((a, b) => (b.sessionDate as string).localeCompare(a.sessionDate as string));

  const total = allAttendance.length;
  const present = allAttendance.filter((r) => r.status === 'present').length;
  const absent = allAttendance.filter((r) => r.status === 'absent').length;
  const excused = allAttendance.filter((r) => r.status === 'excused').length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  const recentAttendance = allAttendance.slice(0, 10);

  const recentPayments = paymentsSnap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as Payment) }))
    .sort((a, b) => (b.dueDate as string).localeCompare(a.dueDate as string))
    .slice(0, 5);

  return {
    student,
    attendanceStats: { total, present, absent, excused, rate },
    recentAttendance,
    recentPayments,
  };
}

export default async function StudentOverviewPage({ params }: { params: { studentId: string } }) {
  const { student, attendanceStats, recentAttendance, recentPayments } = await getStudentAnalytics(params.studentId);

  return (
    <div className="p-8 max-w-4xl">
      <StudentAnalyticsClient
        student={student}
        attendanceStats={attendanceStats}
        recentAttendance={recentAttendance}
        recentPayments={recentPayments}
      />
    </div>
  );
}
