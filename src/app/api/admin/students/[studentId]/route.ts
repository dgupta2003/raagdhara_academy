import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { studentId } = params;
  const body = await request.json();

  const update: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.status) update.status = body.status;
  if (body.courseId) update.courseId = body.courseId;
  if (body.batchType) update.batchType = body.batchType;
  if (body.category) update.category = body.category;
  if (body.customFeeOverride !== undefined) {
    update.customFeeOverride = body.customFeeOverride ?? null;
  }
  if (body.paymentDueDayOverride !== undefined) {
    update.paymentDueDayOverride = body.paymentDueDayOverride ?? null;
  }

  const studentRef = adminDb.collection('students').doc(studentId);
  const doc = await studentRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  await studentRef.update(update);
  return NextResponse.json({ success: true });
}
