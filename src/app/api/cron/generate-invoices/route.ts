import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { adminDb } from '@/lib/firebase/admin'
import type { Student, Settings, Guardian } from '@/lib/firebase/types'
import { resolveStudentFee } from '@/lib/payments/calculator'
import { getUsdToInrRate } from '@/lib/payments/exchange-rate'
import { invoiceRaisedEmail } from '@/lib/email/templates'

const DEFAULT_SETTINGS: Settings = {
  defaultPaymentDay: 1,
  indiaFees: { normal: 50000, special: 70000, personal: 100000 },
  nriFees: {
    usd: { normal: 30, special: 45, personal: 65 },
    inrEquivalent: { normal: 250000, special: 350000, personal: 500000 },
  },
  reminderDaysAfterDue: 3,
  updatedAt: new Date().toISOString(),
}

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

function buildDueDate(paymentDay: number, month: string): string {
  const base = new Date(month + '-01')
  const year = base.getFullYear()
  const m = base.getMonth()
  const maxDay = new Date(year, m + 1, 0).getDate()
  const day = Math.min(paymentDay, maxDay)
  return new Date(year, m, day).toISOString().split('T')[0]
}

async function alreadyHasPayment(studentId: string, month: string): Promise<boolean> {
  const snap = await adminDb
    .collection('payments')
    .where('studentId', '==', studentId)
    .where('dueDate', '>=', month + '-01')
    .where('dueDate', '<=', month + '-31')
    .limit(1)
    .get()
  return !snap.empty
}

async function sendInvoiceRaisedEmails(
  student: Student & { id: string },
  amount: number,
  currency: string,
  dueDate: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const amountStr = formatAmountForEmail(amount, currency)
  const dueDateStr = formatDateForEmail(dueDate)
  const subject = `New invoice: ${amountStr} due ${dueDateStr}`

  resend.emails.send({
    from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
    to: student.email,
    subject,
    html: invoiceRaisedEmail({
      studentName: student.displayName,
      amount: amountStr,
      dueDate: dueDateStr,
      portalUrl: 'https://raagdhara.com/student/payments',
    }),
  }).catch((err: unknown) => console.error('[cron/generate-invoices] student email failed:', err))

  if (student.guardianUid) {
    try {
      const guardianDoc = await adminDb.collection('guardians').doc(student.guardianUid).get()
      if (guardianDoc.exists) {
        const guardian = guardianDoc.data() as Guardian
        if (guardian.email && guardian.email !== student.email) {
          resend.emails.send({
            from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
            to: guardian.email,
            subject,
            html: invoiceRaisedEmail({
              studentName: student.displayName,
              amount: amountStr,
              dueDate: dueDateStr,
              portalUrl: 'https://raagdhara.com/parent/payments',
            }),
          }).catch((err: unknown) => console.error('[cron/generate-invoices] parent email failed:', err))
        }
      }
    } catch (err) {
      console.error('[cron/generate-invoices] guardian lookup failed:', student.guardianUid, err)
    }
  }
}

// POST /api/cron/generate-invoices
// Called daily by Cloud Scheduler. Generates invoices for active students whose payment due
// date falls today. Checks settings.autoGenerateInvoices — skips if false.
export async function POST(request: NextRequest) {
  const cronSecret = (process.env.CRON_SECRET ?? '').trim()
  if (!cronSecret || request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [settingsDoc, exchangeRate] = await Promise.all([
      adminDb.collection('settings').doc('global').get(),
      getUsdToInrRate().catch(() => 85),
    ])
    const settings: Settings = settingsDoc.exists
      ? (settingsDoc.data() as Settings)
      : DEFAULT_SETTINGS

    if (!settings.autoGenerateInvoices) {
      return NextResponse.json({ skipped: true, reason: 'autoGenerateInvoices is disabled' })
    }

    const today = new Date()
    const todayDay = today.getDate()
    const month = today.toISOString().slice(0, 7) // YYYY-MM

    const studentsSnap = await adminDb
      .collection('students')
      .where('status', '==', 'active')
      .get()

    let created = 0
    let skipped = 0

    for (const doc of studentsSnap.docs) {
      const student = { ...(doc.data() as Student), id: doc.id }
      const paymentDay = student.paymentDueDayOverride ?? settings.defaultPaymentDay

      // Only generate for students whose due date is today
      const maxDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const effectiveDay = Math.min(paymentDay, maxDay)
      if (effectiveDay !== todayDay) {
        skipped++
        continue
      }

      if (await alreadyHasPayment(student.id, month)) {
        skipped++
        continue
      }

      const { amount, currency } = resolveStudentFee(student, settings, exchangeRate)
      const dueDate = buildDueDate(paymentDay, month)

      await adminDb.collection('payments').add({
        studentId: student.id,
        studentName: student.displayName,
        studentEmail: student.email,
        amount,
        currency,
        status: 'pending',
        dueDate,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      sendInvoiceRaisedEmails(student, amount, currency, dueDate).catch((err: unknown) =>
        console.error('[cron/generate-invoices] email error for student:', student.id, err)
      )

      created++
    }

    console.log(`[cron/generate-invoices] month=${month} created=${created} skipped=${skipped}`)
    return NextResponse.json({ created, skipped, month })
  } catch (err) {
    console.error('[cron/generate-invoices] error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
