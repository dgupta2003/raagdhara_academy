import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { forgotPasswordEmail } from '@/lib/email/templates';

const FROM_EMAIL = 'Raagdhara Music Academy <noreply@raagdhara.com>';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email: string = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const origin = request.headers.get('origin') || 'https://raagdhara.com';

  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${origin}/auth/login`,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Raagdhara password',
      html: forgotPasswordEmail({ email, resetLink }),
    });
  } catch {
    // Silently swallow — never reveal whether the email exists in our system
  }

  return NextResponse.json({ success: true });
}
