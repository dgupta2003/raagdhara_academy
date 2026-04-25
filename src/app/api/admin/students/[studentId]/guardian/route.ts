import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
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

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { studentId } = params;
  const body = await request.json();
  const { guardianEmail, guardianName, phone, countryCode, relationship } = body;

  if (!guardianEmail || !guardianName) {
    return NextResponse.json({ error: 'Guardian email and name are required' }, { status: 400 });
  }

  const studentDoc = await adminDb.collection('students').doc(studentId).get();
  if (!studentDoc.exists) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }
  const student = studentDoc.data() as Student;
  const normalizedEmail = guardianEmail.toLowerCase().trim();

  // Check if a guardian with this email already exists
  const existingSnap = await adminDb
    .collection('guardians')
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  let guardianUid: string;

  if (!existingSnap.empty) {
    // Guardian exists — add this student to their list
    const existingDoc = existingSnap.docs[0];
    guardianUid = existingDoc.id;
    const existingData = existingDoc.data();

    if (!existingData.studentIds.includes(studentId)) {
      await existingDoc.ref.update({
        studentIds: FieldValue.arrayUnion(studentId),
        [`studentNames.${studentId}`]: student.displayName,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } else {
    // Create new guardian Firebase Auth account (no password — will use invite link)
    try {
      const existingAuthUser = await adminAuth.getUserByEmail(normalizedEmail);
      guardianUid = existingAuthUser.uid;
    } catch {
      const newUser = await adminAuth.createUser({ email: normalizedEmail, emailVerified: true });
      guardianUid = newUser.uid;
    }

    await adminDb.runTransaction(async (tx) => {
      tx.set(adminDb.collection('guardians').doc(guardianUid), {
        uid: guardianUid,
        email: normalizedEmail,
        displayName: guardianName.trim(),
        phone: phone ?? '',
        countryCode: countryCode ?? '+91',
        relationship: relationship ?? 'Parent',
        studentIds: [studentId],
        studentNames: { [studentId]: student.displayName },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(adminDb.collection('users').doc(guardianUid), {
        email: normalizedEmail,
        role: 'parent',
        guardianId: guardianUid,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }

  // Link guardian to student
  await adminDb.collection('students').doc(studentId).update({
    isMinor: true,
    guardianUid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true, guardianUid });
}
