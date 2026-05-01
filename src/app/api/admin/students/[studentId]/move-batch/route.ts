import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

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

const VALID_BATCH_TYPES = ['normal', 'special', 'personal'];

export async function POST(request: NextRequest, { params }: { params: { studentId: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { studentId } = params;
  const ref = adminDb.collection('students').doc(studentId);
  const doc = await ref.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { batchType, batchLabel } = body;
  if (!VALID_BATCH_TYPES.includes(batchType)) {
    return NextResponse.json({ error: 'Invalid batchType' }, { status: 400 });
  }

  // Historical attendance records retain their original batchType — only the student doc is updated
  await ref.update({
    batchType,
    batchLabel: batchLabel ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true });
}
