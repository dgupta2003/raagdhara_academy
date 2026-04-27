import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { guardianInviteEmail } from '@/lib/email/templates';
import type { Guardian, Student } from '@/lib/firebase/types';

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

export async function POST(
  _request: NextRequest,
  { params }: { params: { guardianId: string } }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { guardianId } = params;
  const guardianDoc = await adminDb.collection('guardians').doc(guardianId).get();

  if (!guardianDoc.exists) {
    return NextResponse.json({ error: 'Guardian not found' }, { status: 404 });
  }

  const guardian = guardianDoc.data() as Guardian;

  // Get the first linked student's details for the email
  const firstStudentId = guardian.studentIds[0];
  const studentDoc = await adminDb.collection('students').doc(firstStudentId).get();
  const student = studentDoc.exists ? (studentDoc.data() as Student) : null;

  const resetLink = await adminAuth.generatePasswordResetLink(guardian.email, {
    url: 'https://raagdhara.com/auth/login',
  });

  await adminDb.collection('guardians').doc(guardianId).update({
    inviteSentAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  resend.emails.send({
    from: FROM_EMAIL,
    to: guardian.email,
    subject: `Parent Portal Access — ${student?.displayName ?? 'Your child'} at Raagdhara`,
    html: guardianInviteEmail({
      parentName: guardian.displayName,
      studentName: student?.displayName ?? 'your child',
      courseId: student?.courseId ?? '',
      batchType: student?.batchType ?? '',
      passwordResetLink: resetLink,
    }),
  }).catch((err) => console.error('Guardian invite email failed:', err));

  return NextResponse.json({ success: true });
}
