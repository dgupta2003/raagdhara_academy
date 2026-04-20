import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import StudentsClient from './StudentsClient';

const COURSE_LABELS: Record<string, string> = {
  'hindustani-classical-vocal': 'Hindustani Classical',
  'popular-film-music-hindi': 'Film Music - Hindi',
  'devotional-hindi': 'Devotional - Hindi',
  'ghazal': 'Ghazal',
  'bhatkhande-full-course': 'Bhatkhande Full Course',
};

async function getStudents(): Promise<(Student & { id: string })[]> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const snap = await adminDb.collection('students').orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => serializeDoc({ id: d.id, ...(d.data() as Student) }));
}

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-semibold text-foreground">Students</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{students.length} total students</p>
        </div>
        <Link
          href="/admin/students/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-body rounded-md hover:bg-primary/90 transition-contemplative"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add student
        </Link>
      </div>

      <Suspense>
        <StudentsClient students={students} courseLabels={COURSE_LABELS} />
      </Suspense>
    </div>
  );
}
