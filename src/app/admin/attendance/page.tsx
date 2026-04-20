import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import AttendanceClient from './AttendanceClient';

async function getActiveStudents(): Promise<(Student & { id: string })[]> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');
  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const snap = await adminDb.collection('students').where('status', '==', 'active').get();
  return snap.docs.map((d) => serializeDoc({ id: d.id, ...(d.data() as Student) }));
}

export default async function AttendancePage() {
  const students = await getActiveStudents();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Attendance</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Mark attendance for a session. Select a date and batch, then mark each student.</p>
      </div>
      <AttendanceClient students={students} />
    </div>
  );
}
