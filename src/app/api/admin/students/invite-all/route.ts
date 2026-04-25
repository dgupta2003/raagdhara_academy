import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { inviteStudent } from '../[studentId]/invite/route';
import type { Student } from '@/lib/firebase/types';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return false;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    return userDoc.exists && userDoc.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(_request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const snap = await adminDb.collection('students').where('status', '==', 'active').get();

  const results = { invited: 0, skipped: 0, errors: [] as { studentId: string; name: string; error: string }[] };

  for (const docSnap of snap.docs) {
    const student = docSnap.data() as Student;

    // Skip students already invited or without email
    if (student.inviteSentAt) {
      results.skipped++;
      continue;
    }
    if (!student.email) {
      results.skipped++;
      results.errors.push({ studentId: docSnap.id, name: student.displayName, error: 'No email address' });
      continue;
    }

    const result = await inviteStudent(docSnap.id);
    if (result.success) {
      results.invited++;
    } else {
      results.errors.push({ studentId: docSnap.id, name: student.displayName, error: result.error ?? 'Unknown error' });
    }
  }

  return NextResponse.json(results);
}
