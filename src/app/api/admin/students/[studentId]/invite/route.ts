import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { studentInviteEmail } from '@/lib/email/templates';
import type { Student } from '@/lib/firebase/types';

const FROM_EMAIL = 'Raagdhara Music Academy <noreply@raagdhara.com>';

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

export async function inviteStudent(studentId: string): Promise<{ success: boolean; error?: string }> {
  const studentRef = adminDb.collection('students').doc(studentId);
  const studentDoc = await studentRef.get();

  if (!studentDoc.exists) return { success: false, error: 'Student not found' };

  const student = studentDoc.data() as Student;

  if (!student.email) {
    return { success: false, error: 'Student has no email address. Please add an email before sending invite.' };
  }

  // Find or create Firebase Auth account
  let authUid: string;
  try {
    const existingUser = await adminAuth.getUserByEmail(student.email);
    authUid = existingUser.uid;
  } catch {
    // User doesn't exist — create with no password (must use reset link)
    const newUser = await adminAuth.createUser({ email: student.email, emailVerified: true });
    authUid = newUser.uid;
  }

  // Reconcile users/ collection: create users/{authUid} pointing to existing student doc
  if (authUid !== studentId) {
    await adminDb.runTransaction(async (tx) => {
      tx.set(adminDb.collection('users').doc(authUid), {
        email: student.email,
        role: 'student',
        studentId,
        createdAt: FieldValue.serverTimestamp(),
      });
      // Remove the old stub users doc (random ID that matched student doc ID)
      tx.delete(adminDb.collection('users').doc(studentId));
      tx.update(studentRef, { inviteSentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    });
  } else {
    // Auth UID already matches student doc ID (self-registered path) — just update inviteSentAt
    await studentRef.update({ inviteSentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }

  const resetLink = await adminAuth.generatePasswordResetLink(student.email, {
    url: 'https://raagdhara.com/auth/login',
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  resend.emails.send({
    from: FROM_EMAIL,
    to: student.email,
    subject: 'Your Raagdhara Student Portal is Ready',
    html: studentInviteEmail({
      displayName: student.displayName,
      email: student.email,
      courseId: student.courseId,
      batchType: student.batchType,
      passwordResetLink: resetLink,
    }),
  }).catch((err) => console.error('Invite email failed:', err));

  return { success: true };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await inviteStudent(params.studentId);

  if (!result.success) {
    const status = result.error?.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true });
}
