import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { adminDb } from '@/lib/firebase/admin'
import type { Payment, Settings, Guardian } from '@/lib/firebase/types'
import { paymentReminderEmail, paymentOverdueAdminEmail } from '@/lib/email/templates'

const DEFAULT_OVERDUE_AFTER_DAYS = 3

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

function daysSince(dateStr: string): number {
  const due = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

// POST /api/cron/mark-overdue
// Called daily by Cloud Scheduler. Marks pending/sent invoices as overdue once they pass the
// overdueAfterDays threshold. Sends overdue notification to student + parent + admin exactly
// once (when the invoice first transitions to overdue).
export async function POST(request: NextRequest) {
  const cronSecret = (process.env.CRON_SECRET ?? '').trim()
  if (!cronSecret || request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settingsDoc = await adminDb.collection('settings').doc('global').get()
    const settings = settingsDoc.exists ? (settingsDoc.data() as Settings) : null
    const overdueAfterDays = settings?.overdueAfterDays ?? settings?.reminderDaysAfterDue ?? DEFAULT_OVERDUE_AFTER_DAYS

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // All pending/sent/overdue invoices with a due date in the past
    const snap = await adminDb
      .collection('payments')
      .where('dueDate', '<', todayStr)
      .where('status', 'in', ['pending', 'sent', 'overdue'])
      .get()

    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminEmail = process.env.ADMIN_EMAIL ?? 'raagdharamusic@gmail.com'
    let markedOverdue = 0
    let alreadyOverdue = 0

    for (const doc of snap.docs) {
      const payment = doc.data() as Payment
      const daysLate = daysSince(payment.dueDate as string)

      // Mark overdue regardless of threshold — due date has passed and status is still pending/sent
      if (payment.status === 'overdue') {
        alreadyOverdue++
      } else {
        await doc.ref.update({
          status: 'overdue',
          updatedAt: FieldValue.serverTimestamp(),
        })
        markedOverdue++
      }

      // Send the overdue notice once per invoice, tracked by overdueNoticeSentAt (separate from
      // reminderSentAt which tracks the pre-due-date reminder).
      const shouldNotify = daysLate >= overdueAfterDays && !payment.overdueNoticeSentAt

      if (!shouldNotify) continue

      const amountStr = formatAmountForEmail(payment.amount, payment.currency)
      const dueDateStr = formatDateForEmail(payment.dueDate as string)
      const subject = `Overdue invoice (${daysLate}d): ${amountStr} — Raagdhara Academy`

      resend.emails.send({
        from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
        to: payment.studentEmail,
        subject,
        html: paymentReminderEmail({
          studentName: payment.studentName,
          amount: amountStr,
          dueDate: dueDateStr,
          daysOverdue: daysLate,
          portalUrl: 'https://raagdhara.com/student/payments',
        }),
      }).catch((err: unknown) => console.error('[cron/mark-overdue] student email failed:', doc.id, err))

      // Parent notification
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
                  daysOverdue: daysLate,
                  portalUrl: 'https://raagdhara.com/parent/payments',
                }),
              }).catch((err: unknown) => console.error('[cron/mark-overdue] parent email failed:', doc.id, err))
            }
          }
        } catch (err) {
          console.error('[cron/mark-overdue] guardian lookup failed:', student.guardianUid, err)
        }
      }

      // Admin alert
      resend.emails.send({
        from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
        to: adminEmail,
        subject: `Overdue alert: ${payment.studentName} — ${amountStr}`,
        html: paymentOverdueAdminEmail({
          studentName: payment.studentName,
          studentEmail: payment.studentEmail,
          amount: amountStr,
          dueDate: dueDateStr,
          daysOverdue: daysLate,
        }),
      }).catch((err: unknown) => console.error('[cron/mark-overdue] admin email failed:', doc.id, err))

      await doc.ref.update({
        overdueNoticeSentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    console.log(`[cron/mark-overdue] markedOverdue=${markedOverdue} alreadyOverdue=${alreadyOverdue}`)
    return NextResponse.json({ markedOverdue, alreadyOverdue })
  } catch (err) {
    console.error('[cron/mark-overdue] error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
