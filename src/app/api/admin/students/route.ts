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

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, email, phone, countryCode, category, courseId, batchType, status } = body;

  if (!displayName || !email || !phone || !courseId || !batchType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Generate a new document ID for the student
  const studentRef = adminDb.collection('students').doc();
  const uid = studentRef.id;

  await adminDb.runTransaction(async (tx) => {
    tx.set(adminDb.collection('users').doc(uid), {
      email,
      role: 'student',
      studentId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(studentRef, {
      uid,
      email,
      displayName,
      phone,
      countryCode: countryCode ?? '+91',
      category: category ?? 'india',
      nriCurrencyPreference: category === 'nri' ? 'usd' : 'inr-equivalent',
      courseId,
      batchType,
      status: status ?? 'active',
      enrollmentDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return NextResponse.json({ success: true, studentId: uid });
}
