import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  consultationStudentConfirmationEmail,
  consultationAdminNotificationEmail,
  type ConsultationEmailData,
} from '@/lib/email/templates';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyAppCheck } from '@/lib/firebase/appcheck-server';

export async function POST(request: NextRequest) {
  // App Check (no-op unless APPCHECK_ENFORCE=true)
  if (!(await verifyAppCheck(request))) {
    return NextResponse.json({ error: 'Failed verification' }, { status: 401 });
  }

  // Rate limit: max 5 consultation submissions per hour per IP
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`consult:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = 'Raagdhara Music Academy <noreply@raagdhara.com>';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'raagdharamusic@gmail.com';
  try {
    const data: ConsultationEmailData = await request.json();

    if (!data.name || !data.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send both emails concurrently — if one fails, we still try the other
    const [studentResult, adminResult] = await Promise.allSettled([
      resend.emails.send({
        from: FROM_EMAIL,
        to: data.email,
        subject: 'Your free consultation is confirmed — Raagdhara Music Academy',
        html: consultationStudentConfirmationEmail(data),
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: data.email,
        subject: `New consultation: ${data.name} — ${data.course}`,
        html: consultationAdminNotificationEmail(data),
      }),
    ]);

    const studentOk = studentResult.status === 'fulfilled';
    const adminOk = adminResult.status === 'fulfilled';

    if (!studentOk) {
      console.error('Student email failed:', studentResult.reason);
    }
    if (!adminOk) {
      console.error('Admin email failed:', adminResult.reason);
    }

    // Return success as long as at least the student email went through.
    // Booking is already saved to Firestore — email failure shouldn't fail the whole request.
    return NextResponse.json({ success: true, studentOk, adminOk });
  } catch (error) {
    console.error('Email route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
