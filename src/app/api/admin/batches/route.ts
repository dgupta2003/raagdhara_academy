import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { serializeDoc } from '@/lib/firebase/serialize';

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

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const snap = await adminDb.collection('batches').get();
  const batches = snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() }));
  return NextResponse.json({ batches });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { batchType, batchLabel, displayName, daysOfWeek, sessionTime, sessionDurationMinutes } = body;

  if (!VALID_BATCH_TYPES.includes(batchType)) {
    return NextResponse.json({ error: 'Invalid batchType' }, { status: 400 });
  }
  if (!displayName || !Array.isArray(daysOfWeek) || !sessionTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (daysOfWeek.some((d: unknown) => typeof d !== 'number' || d < 0 || d > 6)) {
    return NextResponse.json({ error: 'daysOfWeek must be numbers 0-6' }, { status: 400 });
  }

  const ref = await adminDb.collection('batches').add({
    batchType,
    batchLabel: batchLabel ?? null,
    displayName,
    daysOfWeek,
    sessionTime,
    sessionDurationMinutes: sessionDurationMinutes ?? 45,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true, batchId: ref.id });
}
