import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import StudentEditClient from './StudentEditClient';

async function getStudent(studentId: string): Promise<Student & { id: string }> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const doc = await adminDb.collection('students').doc(studentId).get();
  if (!doc.exists) notFound();
  return serializeDoc({ id: doc.id, ...(doc.data() as Student) });
}

export default async function StudentDetailPage({ params }: { params: { studentId: string } }) {
  const student = await getStudent(params.studentId);

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

      <StudentEditClient student={student} />
    </div>
  );
}
