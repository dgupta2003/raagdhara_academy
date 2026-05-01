import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Student, Batch } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import BatchesClient from './BatchesClient';

async function getBatchesData() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const [studentsSnap, batchesSnap] = await Promise.all([
    adminDb.collection('students').where('status', '==', 'active').get(),
    adminDb.collection('batches').get(),
  ]);

  const students = studentsSnap.docs.map((d) =>
    serializeDoc({ id: d.id, ...(d.data() as Student) })
  );
  const batches = batchesSnap.docs.map((d) =>
    serializeDoc({ id: d.id, ...(d.data() as Batch) })
  );

  return { students, batches };
}

export default async function BatchesPage() {
  const { students, batches } = await getBatchesData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Batches</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Manage batch schedules and view students per group.</p>
      </div>
      <BatchesClient students={students} batches={batches} />
    </div>
  );
}
