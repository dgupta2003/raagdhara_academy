import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Payment, Guardian } from '@/lib/firebase/types'
import { paymentReminderEmail, paymentOverdueAdminEmail } from '@/lib/email/templates'

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

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
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

// POST /api/admin/payments/notifications
// Body: { paymentId: string, type: 'reminder' | 'overdue' }
// Sends reminder email to student + parent. For 'overdue' also notifies admin.
// Updates reminderSentAt on the payment doc.
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { paymentId, type } = await request.json() as { paymentId: string; type: 'reminder' | 'overdue' }
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    if (type !== 'reminder' && type !== 'overdue') {
      return NextResponse.json({ error: 'type must be reminder or overdue' }, { status: 400 })
    }

    const paymentRef = adminDb.collection('payments').doc(paymentId)
    const paymentDoc = await paymentRef.get()
    if (!paymentDoc.exists) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    const payment = paymentDoc.data() as Payment & { id: string }
    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    // Find student to get guardianUid
    const studentDoc = await adminDb.collection('students').doc(payment.studentId).get()
    const student = studentDoc.exists ? studentDoc.data() : null

    const amountStr = formatAmountForEmail(payment.amount, payment.currency)
    const dueDateStr = formatDateForEmail(payment.dueDate as string)
    const overdueCount = daysOverdue(payment.dueDate as string)

    const resend = new Resend(process.env.RESEND_API_KEY)
    const subjectPrefix = type === 'overdue' ? `Overdue invoice (${overdueCount}d)` : 'Payment reminder'
    const subject = `${subjectPrefix}: ${amountStr} — Raagdhara Academy`

    // Send to student
    resend.emails.send({
      from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
      to: payment.studentEmail,
      subject,
      html: paymentReminderEmail({
        studentName: payment.studentName,
        amount: amountStr,
        dueDate: dueDateStr,
        daysOverdue: type === 'overdue' ? overdueCount : undefined,
        portalUrl: 'https://raagdhara.com/student/payments',
      }),
    }).catch((err: unknown) => console.error('Reminder email (student) failed:', err))

    // Send to parent with parent portal URL if linked
    let guardianEmail: string | null = null
    if (student?.guardianUid) {
      try {
        // Direct doc lookup — guardianUid IS the guardian document ID
        const guardianDoc = await adminDb.collection('guardians').doc(student.guardianUid).get()
        if (guardianDoc.exists) {
          const guardian = guardianDoc.data() as Guardian
          if (guardian.email && guardian.email !== payment.studentEmail) {
            guardianEmail = guardian.email
            resend.emails.send({
              from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
              to: guardian.email,
              subject,
              html: paymentReminderEmail({
                studentName: payment.studentName,
                amount: amountStr,
                dueDate: dueDateStr,
                daysOverdue: type === 'overdue' ? overdueCount : undefined,
                portalUrl: 'https://raagdhara.com/parent/payments',
              }),
            }).catch((err: unknown) => console.error('Reminder email (parent) failed:', err))
          }
        }
      } catch (err) {
        console.error('[notifications] guardian lookup failed for guardianUid:', student.guardianUid, err)
      }
    }

    const recipients = guardianEmail ? [payment.studentEmail, guardianEmail] : [payment.studentEmail]

    // For overdue: also alert admin
    if (type === 'overdue') {
      const adminEmail = process.env.ADMIN_EMAIL ?? 'raagdharamusic@gmail.com'
      resend.emails.send({
        from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
        to: adminEmail,
        subject: `Overdue alert: ${payment.studentName} — ${amountStr}`,
        html: paymentOverdueAdminEmail({
          studentName: payment.studentName,
          studentEmail: payment.studentEmail,
          amount: amountStr,
          dueDate: dueDateStr,
          daysOverdue: overdueCount,
        }),
      }).catch((err: unknown) => console.error('Overdue admin email failed:', err))
    }

    // Update reminderSentAt
    await paymentRef.update({
      reminderSentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ sent: true, recipients })
  } catch (err) {
    console.error('Payment notification error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
