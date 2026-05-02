import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Student, Settings, Guardian } from '@/lib/firebase/types'
import { resolveStudentFee } from '@/lib/payments/calculator'
import { getUsdToInrRate } from '@/lib/payments/exchange-rate'
import { invoiceRaisedEmail, invoicePaidAdminEmail } from '@/lib/email/templates'

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

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return false
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get()
    return userDoc.exists && userDoc.data()?.role === 'admin'
  } catch {
    return false
  }
}

function buildDueDate(paymentDay: number, month?: string): string {
  const base = month ? new Date(month + '-01') : new Date()
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
    .get()
  return snap.docs.some((d) => {
    const dueDate = d.data().dueDate as string | undefined
    return typeof dueDate === 'string' && dueDate.startsWith(month)
  })
}

// Fire-and-forget: send invoice raised email to student + linked parent
async function sendInvoiceRaisedEmails(
  student: Student & { id: string },
  amount: number,
  currency: string,
  dueDate: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const portalUrl = 'https://raagdhara.com/student'
  const amountStr = formatAmountForEmail(amount, currency)
  const dueDateStr = formatDateForEmail(dueDate)
  const html = invoiceRaisedEmail({ studentName: student.displayName, amount: amountStr, dueDate: dueDateStr, portalUrl })

  const recipients = [student.email]

  // Find parent email if linked
  if (student.guardianUid) {
    try {
      const guardianSnap = await adminDb
        .collection('guardians')
        .where('uid', '==', student.guardianUid)
        .limit(1)
        .get()
      if (!guardianSnap.empty) {
        const guardian = guardianSnap.docs[0].data() as Guardian
        if (guardian.email && !recipients.includes(guardian.email)) {
          recipients.push(guardian.email)
        }
      }
    } catch {
      // silently skip guardian lookup failure
    }
  }

  for (const email of recipients) {
    resend.emails.send({
      from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
      to: email,
      subject: `New invoice: ${amountStr} due ${dueDateStr}`,
      html,
    }).catch((err: unknown) => console.error('Invoice email failed:', err))
  }
}

async function createPaymentForStudent(
  student: Student & { id: string },
  settings: Settings,
  month: string,
  exchangeRate: number
): Promise<'created' | 'skipped'> {
  if (await alreadyHasPayment(student.id, month)) return 'skipped'

  const { amount, currency } = resolveStudentFee(student, settings, exchangeRate)
  const paymentDay = student.paymentDueDayOverride ?? settings.defaultPaymentDay
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

  // Fire-and-forget email
  sendInvoiceRaisedEmails(student, amount, currency, dueDate).catch((err: unknown) =>
    console.error('sendInvoiceRaisedEmails error:', err)
  )

  return 'created'
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { paymentId } = await request.json() as { paymentId: string }
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

    const ref = adminDb.collection('payments').doc(paymentId)
    const doc = await ref.get()
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const status = doc.data()?.status
    if (status === 'paid') {
      return NextResponse.json({ error: 'Cannot delete a paid invoice' }, { status: 400 })
    }

    await ref.delete()
    return NextResponse.json({ deleted: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { studentId, bulk, month } = body as {
      studentId?: string
      bulk?: boolean
      month?: string
    }

    const targetMonth = month ?? new Date().toISOString().slice(0, 7)

    const [settingsDoc, exchangeRate] = await Promise.all([
      adminDb.collection('settings').doc('global').get(),
      getUsdToInrRate().catch(() => 85),
    ])
    const settings: Settings = settingsDoc.exists
      ? (settingsDoc.data() as Settings)
      : DEFAULT_SETTINGS

    if (bulk) {
      const snap = await adminDb
        .collection('students')
        .where('status', '==', 'active')
        .get()

      let created = 0
      let skipped = 0
      for (const doc of snap.docs) {
        const student = { id: doc.id, ...(doc.data() as Student) }
        const result = await createPaymentForStudent(student, settings, targetMonth, exchangeRate)
        if (result === 'created') created++
        else skipped++
      }
      return NextResponse.json({ created, skipped })
    }

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    }

    const studentDoc = await adminDb.collection('students').doc(studentId).get()
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    const student = { id: studentDoc.id, ...(studentDoc.data() as Student) }
    const result = await createPaymentForStudent(student, settings, targetMonth, exchangeRate)
    return NextResponse.json({ created: result === 'created' ? 1 : 0, skipped: result === 'skipped' ? 1 : 0 })
  } catch (err) {
    console.error('Admin payments POST error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { paymentId } = await request.json() as { paymentId: string }
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

    const ref = adminDb.collection('payments').doc(paymentId)
    const doc = await ref.get()
    if (!doc.exists) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    const payment = doc.data()!
    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already marked as paid' }, { status: 400 })
    }

    const paidAt = new Date()
    await ref.update({
      status: 'paid',
      paidAt,
      markedPaidManually: true,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Notify admin
    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminEmail = process.env.ADMIN_EMAIL ?? 'raagdharamusic@gmail.com'
    const amountStr = formatAmountForEmail(payment.amount as number, payment.currency as string)
    resend.emails.send({
      from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
      to: adminEmail,
      subject: `Payment received: ${payment.studentName} — ${amountStr}`,
      html: invoicePaidAdminEmail({
        studentName: payment.studentName as string,
        studentEmail: payment.studentEmail as string,
        amount: amountStr,
        paidAt: paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        method: 'manual',
      }),
    }).catch((err: unknown) => console.error('Admin paid email failed:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin payments PATCH error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
