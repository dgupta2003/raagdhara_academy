import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { forgotPasswordEmail } from '@/lib/email/templates';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyAppCheck } from '@/lib/firebase/appcheck-server';

const FROM_EMAIL = 'Raagdhara Music Academy <noreply@raagdhara.com>';

const TOO_MANY = { error: 'Too many requests. Please try again later.' };

export async function POST(request: NextRequest) {
  // App Check (no-op unless APPCHECK_ENFORCE=true)
  if (!(await verifyAppCheck(request))) {
    return NextResponse.json({ error: 'Failed verification' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const email: string = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Rate limit by IP (5 / 15 min) and by target email (3 / hour) to block
  // password-reset email-bombing. A 429 reveals nothing about whether the email
  // exists, so it preserves the no-enumeration guarantee below.
  const ip = getClientIp(request);
  const ipRl = await checkRateLimit(`forgot-ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipRl.allowed) {
    return NextResponse.json(TOO_MANY, { status: 429, headers: { 'Retry-After': String(ipRl.retryAfterSec) } });
  }
  const emailRl = await checkRateLimit(`forgot-email:${email.toLowerCase()}`, 3, 60 * 60 * 1000);
  if (!emailRl.allowed) {
    return NextResponse.json(TOO_MANY, { status: 429, headers: { 'Retry-After': String(emailRl.retryAfterSec) } });
  }

  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Raagdhara password',
      html: forgotPasswordEmail({ email, resetLink }),
    });
  } catch (err) {
    // Never reveal to the client whether the email exists — keep returning success
    console.error('[forgot-password] failed to send reset email:', err);
  }

  return NextResponse.json({ success: true });
}
