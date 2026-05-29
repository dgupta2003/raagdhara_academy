import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { Resend } from 'resend'
import { adminDb } from '@/lib/firebase/admin'
import type { Payment, Guardian } from '@/lib/firebase/types'
import { invoicePaidAdminEmail, invoicePaidStudentEmail } from '@/lib/email/templates'
import { canAccessPayment } from '@/lib/payments/access'
import { getCallerUid } from '@/lib/payments/session'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatAmountForEmail(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`
  const rupees = Math.round(amount / 100)
  return `₹${rupees.toLocaleString('en-IN')}`
}

export async function POST(request: NextRequest) {
  const uid = await getCallerUid()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json()

  if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify HMAC signature — trim to guard against copy-paste whitespace in Secret Manager
  const secret = (process.env.RAZORPAY_KEY_SECRET ?? '').trim()
  const expectedSignature = createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    console.error('[payments/verify] HMAC mismatch for payment:', paymentId)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const paymentRef = adminDb.collection('payments').doc(paymentId)
  const paymentDoc = await paymentRef.get()
  if (!paymentDoc.exists) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  const payment = paymentDoc.data() as Payment

  // Idempotency — if already paid (e.g. webhook already ran), return success
  if (payment.status === 'paid') {
    return NextResponse.json({ success: true })
  }

  const allowed = await canAccessPayment(uid, payment.studentId)
  if (!allowed) {
    console.error('[payments/verify] access denied for uid:', uid, 'studentId:', payment.studentId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const paidAt = new Date()
  await paymentRef.update({
    status: 'paid',
    razorpayPaymentId,
    paidAt,
    updatedAt: paidAt,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const amountStr = formatAmountForEmail(payment.amount, payment.currency)
  const paidAtStr = paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  // Notify admin fire-and-forget
  const adminEmail = process.env.ADMIN_EMAIL ?? 'raagdharamusic@gmail.com'
  resend.emails.send({
    from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
    to: adminEmail,
    subject: `Payment received: ${payment.studentName} — ${amountStr}`,
    html: invoicePaidAdminEmail({
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      amount: amountStr,
      paidAt: paidAtStr,
      method: 'razorpay',
    }),
  }).catch((err: unknown) => console.error('[payments/verify] admin email failed:', err))

  // Notify student + parent fire-and-forget
  ;(async () => {
    try {
      const studentDoc = await adminDb.collection('students').doc(payment.studentId).get()
      const student = studentDoc.data()

      resend.emails.send({
        from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
        to: payment.studentEmail,
        subject: `Payment confirmed — ${amountStr}`,
        html: invoicePaidStudentEmail({
          studentName: payment.studentName,
          amount: amountStr,
          paidAt: paidAtStr,
          method: 'razorpay',
          portalUrl: 'https://raagdhara.com/student/payments',
        }),
      }).catch((err: unknown) => console.error('[payments/verify] student email failed:', err))

      if (student?.guardianUid) {
        // Direct doc lookup — guardianUid IS the guardian document ID
        const guardianDoc = await adminDb.collection('guardians').doc(student.guardianUid).get()
        if (guardianDoc.exists) {
          const guardian = guardianDoc.data() as Guardian
          if (guardian.email && guardian.email !== payment.studentEmail) {
            resend.emails.send({
              from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
              to: guardian.email,
              subject: `Payment confirmed — ${amountStr}`,
              html: invoicePaidStudentEmail({
                studentName: payment.studentName,
                amount: amountStr,
                paidAt: paidAtStr,
                method: 'razorpay',
                portalUrl: 'https://raagdhara.com/parent/payments',
              }),
            }).catch((err: unknown) => console.error('[payments/verify] parent email failed:', err))
          }
        }
      }
    } catch (err) {
      console.error('[payments/verify] confirmation email failed:', err)
    }
  })()

  return NextResponse.json({ success: true })
}
