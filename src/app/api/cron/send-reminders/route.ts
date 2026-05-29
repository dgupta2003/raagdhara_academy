import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { adminDb } from '@/lib/firebase/admin'
import type { Payment, Settings, Guardian } from '@/lib/firebase/types'
import { paymentReminderEmail } from '@/lib/email/templates'

const DEFAULT_REMINDER_DAYS_BEFORE = 3

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatAmountForEmail(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`
  const rupees = Math.round(amount / 100)
  return `₹${rupees.toLocaleString('en-IN')}`
}

function formatDateForEmail(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// POST /api/cron/send-reminders
// Called daily by Cloud Scheduler. For each pending/sent invoice whose due date is exactly
// reminderDaysBefore days from today, sends a reminder email to student + parent if not already
// sent within the last 7 days.
export async function POST(request: NextRequest) {
  const cronSecret = (process.env.CRON_SECRET ?? '').trim()
  if (!cronSecret || request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settingsDoc = await adminDb.collection('settings').doc('global').get()
    const settings = settingsDoc.exists ? (settingsDoc.data() as Settings) : null
    const reminderDaysBefore = settings?.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS_BEFORE

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = toISODate(addDays(today, reminderDaysBefore))

    // Query invoices due on the target date that are still unpaid
    const snap = await adminDb
      .collection('payments')
      .where('dueDate', '==', targetDate)
      .where('status', 'in', ['pending', 'sent'])
      .get()

    const resend = new Resend(process.env.RESEND_API_KEY)
    let sent = 0
    let skipped = 0

    for (const doc of snap.docs) {
      const payment = doc.data() as Payment

      // Skip if reminder already sent within the last 7 days
      if (payment.reminderSentAt) {
        const sentAt = payment.reminderSentAt instanceof Date
          ? payment.reminderSentAt
          : new Date((payment.reminderSentAt as { seconds: number }).seconds * 1000)
        const daysSinceSent = (today.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceSent < 7) {
          skipped++
          continue
        }
      }

      const amountStr = formatAmountForEmail(payment.amount, payment.currency)
      const dueDateStr = formatDateForEmail(payment.dueDate as string)
      const subject = `Payment reminder: ${amountStr} — Raagdhara Academy`

      resend.emails.send({
        from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
        to: payment.studentEmail,
        subject,
        html: paymentReminderEmail({
          studentName: payment.studentName,
          amount: amountStr,
          dueDate: dueDateStr,
          portalUrl: 'https://raagdhara.com/student/payments',
        }),
      }).catch((err: unknown) => console.error('[cron/send-reminders] student email failed:', doc.id, err))

      // Send to parent if linked
      const studentDoc = await adminDb.collection('students').doc(payment.studentId).get()
      const student = studentDoc.data()
      if (student?.guardianUid) {
        try {
          const guardianDoc = await adminDb.collection('guardians').doc(student.guardianUid).get()
          if (guardianDoc.exists) {
            const guardian = guardianDoc.data() as Guardian
            if (guardian.email && guardian.email !== payment.studentEmail) {
              resend.emails.send({
                from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
                to: guardian.email,
                subject,
                html: paymentReminderEmail({
                  studentName: payment.studentName,
                  amount: amountStr,
                  dueDate: dueDateStr,
                  portalUrl: 'https://raagdhara.com/parent/payments',
                }),
              }).catch((err: unknown) => console.error('[cron/send-reminders] parent email failed:', doc.id, err))
            }
          }
        } catch (err) {
          console.error('[cron/send-reminders] guardian lookup failed:', student.guardianUid, err)
        }
      }

      await doc.ref.update({
        reminderSentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      sent++
    }

    console.log(`[cron/send-reminders] targetDate=${targetDate} sent=${sent} skipped=${skipped}`)
    return NextResponse.json({ sent, skipped, targetDate })
  } catch (err) {
    console.error('[cron/send-reminders] error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
