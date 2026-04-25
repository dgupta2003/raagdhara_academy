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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

  const snap = await adminDb.collection('attendance').where('sessionDate', '==', date).get();
  const records: Record<string, string> = {};
  snap.docs.forEach((d) => { records[d.data().studentId] = d.data().status; });
  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const adminUid = await verifyAdmin();
  if (!adminUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date, records } = await request.json();

  if (!date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'Missing date or records' }, { status: 400 });
  }

  // Use a Firestore batch write — all records saved atomically
  const batch = adminDb.batch();

  for (const record of records) {
    // Doc ID is deterministic: studentId_date — prevents duplicate entries for the same session
    const docId = `${record.studentId}_${date}`;
    const ref = adminDb.collection('attendance').doc(docId);
    batch.set(ref, {
      studentId: record.studentId,
      sessionDate: date,
      courseId: record.courseId,
      batchType: record.batchType,
      status: record.status,
      markedBy: 'admin',
      markedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  return NextResponse.json({ success: true, count: records.length });
}
