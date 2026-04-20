export interface StudentWelcomeEmailData {
  displayName: string;
  email: string;
  courseId: string;
  batchType: string;
}

export function studentWelcomeEmail(data: StudentWelcomeEmailData): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:${BRAND_BROWN};">You're approved! 🎵</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
      Hi ${data.displayName}, your Raagdhara Academy account has been reviewed and activated. You can now sign in to your student portal.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_BG};border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tr><td colspan="2" style="padding-bottom:10px;font-size:12px;font-weight:bold;color:${BRAND_BROWN};letter-spacing:1px;text-transform:uppercase;">Your enrollment</td></tr>
      ${detailRow('Course', data.courseId)}
      ${detailRow('Batch', data.batchType)}
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#555555;line-height:1.6;">
      Sign in at <a href="https://raagdhara.com/auth/login" style="color:${BRAND_BROWN};font-weight:bold;">raagdhara.com</a> to view your attendance and upcoming payment details.
    </p>

    <div style="margin:28px 0 0;padding-top:20px;border-top:1px solid #eeeeee;">
      <p style="margin:0;font-size:13px;color:#888888;">With warm regards,<br/><strong style="color:${BRAND_BROWN};">Vaishnavi Gupta</strong><br/>Raagdhara Music Academy</p>
    </div>
  `;
  return baseLayout('Welcome to Raagdhara Music Academy!', body);
}

export interface ConsultationEmailData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  ageGroup: string;
  course: string;
  timezone: string;
  experience: string;
  goals?: string;
  hearAbout?: string;
  consultationType?: string;
}

const BRAND_BROWN = '#8B4513';
const BRAND_GOLD = '#D4AF37';
const BRAND_BG = '#FDF5E6';

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_BROWN};padding:28px 32px;border-radius:8px 8px 0 0;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">रागधारा</p>
              <p style="margin:4px 0 0;font-size:12px;color:${BRAND_GOLD};letter-spacing:2px;text-transform:uppercase;">Music Academy</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888888;">Raagdhara Music Academy &nbsp;·&nbsp; raagdharamusic@gmail.com</p>
              <p style="margin:4px 0 0;font-size:11px;color:#aaaaaa;">Where tradition meets innovation in Indian Classical Music education.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#666666;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#333333;font-weight:bold;">${value || '—'}</td>
  </tr>`;
}

export function consultationStudentConfirmationEmail(data: ConsultationEmailData): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;color:${BRAND_BROWN};">Your consultation is booked!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
      Hi ${data.name}, thank you for reaching out. We've received your free consultation request and will be in touch soon to confirm your session details.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_BG};border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tr><td colspan="2" style="padding-bottom:10px;font-size:12px;font-weight:bold;color:${BRAND_BROWN};letter-spacing:1px;text-transform:uppercase;">Your booking summary</td></tr>
      ${detailRow('Name', data.name)}
      ${detailRow('Email', data.email)}
      ${detailRow('Phone', `${data.countryCode} ${data.phone}`)}
      ${detailRow('Course interest', data.course)}
      ${detailRow('Age group', data.ageGroup)}
      ${detailRow('Timezone', data.timezone)}
      ${detailRow('Experience', data.experience)}
      ${data.goals ? detailRow('Goals', data.goals) : ''}
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#555555;line-height:1.6;">
      <strong>What happens next?</strong> Vaishnavi will review your details and reach out within 24–48 hours to schedule your free 30-minute session.
    </p>
    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
      If you have any questions in the meantime, feel free to reply to this email.
    </p>

    <div style="margin:28px 0 0;padding-top:20px;border-top:1px solid #eeeeee;">
      <p style="margin:0;font-size:13px;color:#888888;">With warm regards,<br/><strong style="color:${BRAND_BROWN};">Vaishnavi Gupta</strong><br/>Raagdhara Music Academy</p>
    </div>
  `;
  return baseLayout('Consultation Booking Confirmed — Raagdhara Music Academy', body);
}

export function consultationAdminNotificationEmail(data: ConsultationEmailData): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;color:${BRAND_BROWN};">New consultation booking</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#555555;">A new free consultation has been submitted. Details below.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_BG};border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      ${detailRow('Name', data.name)}
      ${detailRow('Email', data.email)}
      ${detailRow('Phone', `${data.countryCode} ${data.phone}`)}
      ${detailRow('Course', data.course)}
      ${detailRow('Age group', data.ageGroup)}
      ${detailRow('Timezone', data.timezone)}
      ${detailRow('Experience', data.experience)}
      ${data.goals ? detailRow('Goals', data.goals) : ''}
      ${data.hearAbout ? detailRow('Heard about us', data.hearAbout) : ''}
      ${data.consultationType ? detailRow('Type', data.consultationType) : ''}
    </table>

    <p style="margin:0;font-size:13px;color:#888888;">Reply directly to this email to contact the student.</p>
  `;
  return baseLayout('New Consultation Booking — Raagdhara Academy', body);
}
