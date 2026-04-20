import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { studentWelcomeEmail } from '@/lib/email/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Raagdhara Music Academy <noreply@raagdhara.com>';

async function verifyAdmin(): Promise<string | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const adminUid = await verifyAdmin();
  if (!adminUid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { studentId } = params;
  const studentRef = adminDb.collection('students').doc(studentId);
  const studentDoc = await studentRef.get();

  if (!studentDoc.exists) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const student = studentDoc.data()!;

  if (student.status !== 'pending') {
    return NextResponse.json({ error: 'Student is not pending approval' }, { status: 400 });
  }

  // Update status to active
  await studentRef.update({
    status: 'active',
    updatedAt: new Date(),
  });

  // Send welcome email (non-blocking — approval is already saved)
  resend.emails.send({
    from: FROM_EMAIL,
    to: student.email,
    subject: 'You\'re approved! Welcome to Raagdhara Music Academy',
    html: studentWelcomeEmail({
      displayName: student.displayName,
      email: student.email,
      courseId: student.courseId,
      batchType: student.batchType,
    }),
  }).catch((err) => console.error('Welcome email failed:', err));

  return NextResponse.json({ success: true });
}
