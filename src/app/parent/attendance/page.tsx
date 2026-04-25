import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Attendance, Guardian, Student } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import AttendanceHistoryClient from '@/app/student/attendance/AttendanceHistoryClient';

async function getAttendanceData(childParam?: string) {
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
    .collection('attendance')
    .where('studentId', '==', studentId)
    .get();

  const records = snap.docs
    .map((d) => serializeDoc({ id: d.id, ...(d.data() as Attendance) }))
    .sort((a, b) => (b.sessionDate as string).localeCompare(a.sessionDate as string));

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const percent = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  return {
    records,
    studentName: student?.displayName ?? 'Student',
    stats: { total: records.length, present: presentCount, absent: absentCount, excused: excusedCount, percent },
  };
}

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: { child?: string };
}) {
  const { records, stats, studentName } = await getAttendanceData(searchParams.child);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">{studentName}&apos;s session attendance history.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border p-4 border-primary/20 bg-primary/5">
          <p className="font-headline text-2xl font-bold text-primary">{stats.percent}%</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Attendance rate</p>
        </div>
        <div className="rounded-lg border p-4 border-green-200 bg-green-50">
          <p className="font-headline text-2xl font-bold text-green-700">{stats.present}</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Present</p>
        </div>
        <div className="rounded-lg border p-4 border-red-200 bg-red-50">
          <p className="font-headline text-2xl font-bold text-red-700">{stats.absent}</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Absent</p>
        </div>
        <div className="rounded-lg border p-4 border-amber-200 bg-amber-50">
          <p className="font-headline text-2xl font-bold text-amber-700">{stats.excused}</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Excused</p>
        </div>
      </div>

      <AttendanceHistoryClient records={records} />
    </div>
  );
}
