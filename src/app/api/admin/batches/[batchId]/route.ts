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

export async function PUT(request: NextRequest, { params }: { params: { batchId: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { batchId } = params;
  const ref = adminDb.collection('batches').doc(batchId);
  const doc = await ref.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const allowed: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (Array.isArray(body.daysOfWeek)) allowed.daysOfWeek = body.daysOfWeek;
  if (typeof body.sessionTime === 'string') allowed.sessionTime = body.sessionTime;
  if (typeof body.sessionDurationMinutes === 'number') allowed.sessionDurationMinutes = body.sessionDurationMinutes;
  if (typeof body.displayName === 'string') allowed.displayName = body.displayName;
  if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;

  await ref.update(allowed);
  return NextResponse.json({ success: true });
}
