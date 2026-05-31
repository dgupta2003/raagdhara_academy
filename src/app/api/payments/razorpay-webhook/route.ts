import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { adminDb } from '@/lib/firebase/admin'
import type { Payment, Guardian } from '@/lib/firebase/types'
import { invoicePaidAdminEmail, invoicePaidStudentEmail } from '@/lib/email/templates'

// Razorpay sends the raw request body as bytes for HMAC verification.
// We MUST read as text before any JSON parsing — the signature covers the raw bytes.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET ?? '').trim()
  if (!webhookSecret) {
    console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)
  if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
    console.error('[razorpay-webhook] signature mismatch — possible spoofed request')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle payment.captured — return 200 for all other events so Razorpay doesn't retry
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const entity = event.payload?.payment?.entity
  const razorpayPaymentId = entity?.id
  const razorpayOrderId = entity?.order_id

  if (!razorpayPaymentId || !razorpayOrderId) {
    console.error('[razorpay-webhook] missing payment entity fields:', entity)
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
  }

  // Find the payment doc by Razorpay order ID
  const snap = await adminDb
    .collection('payments')
    .where('razorpayOrderId', '==', razorpayOrderId)
    .limit(1)
    .get()

  if (snap.empty) {
    // Order not found — could be from a different context; log and return 200 so Razorpay doesn't retry
    console.warn('[razorpay-webhook] no payment doc found for orderId:', razorpayOrderId)
    return NextResponse.json({ received: true })
  }

  const paymentRef = snap.docs[0].ref
  const payment = snap.docs[0].data() as Payment

  // Idempotent — verify route may have already marked it paid
  if (payment.status === 'paid') {
    return NextResponse.json({ received: true })
  }

  const paidAt = new Date()
  await paymentRef.update({
    status: 'paid',
    razorpayPaymentId,
    paidAt,
    updatedAt: paidAt,
  })

  console.log('[razorpay-webhook] marked paid:', snap.docs[0].id, 'for student:', payment.studentId)

  const resend = new Resend(process.env.RESEND_API_KEY)
  const rupees = payment.currency === 'USD' ? `$${payment.amount}` : `₹${Math.round(payment.amount / 100).toLocaleString('en-IN')}`
  const paidAtStr = paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  // Notify admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'raagdharamusic@gmail.com'
  resend.emails.send({
    from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
    to: adminEmail,
    subject: `Payment received: ${payment.studentName} — ${rupees}`,
    html: invoicePaidAdminEmail({
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      amount: rupees,
      paidAt: paidAtStr,
      method: 'razorpay',
    }),
  }).catch((err: unknown) => console.error('[razorpay-webhook] admin email failed:', err))

  // Notify student + parent
  ;(async () => {
    try {
      resend.emails.send({
        from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
        to: payment.studentEmail,
        subject: `Payment confirmed — ${rupees}`,
        html: invoicePaidStudentEmail({
          studentName: payment.studentName,
          amount: rupees,
          paidAt: paidAtStr,
          method: 'razorpay',
          portalUrl: 'https://raagdhara.com/student/payments',
        }),
      }).catch((err: unknown) => console.error('[razorpay-webhook] student email failed:', err))

      const studentDoc = await adminDb.collection('students').doc(payment.studentId).get()
      const student = studentDoc.data()
      if (student?.guardianUid) {
        const guardianDoc = await adminDb.collection('guardians').doc(student.guardianUid).get()
        if (guardianDoc.exists) {
          const guardian = guardianDoc.data() as Guardian
          if (guardian.email && guardian.email !== payment.studentEmail) {
            resend.emails.send({
              from: 'Raagdhara Music Academy <noreply@raagdhara.com>',
              to: guardian.email,
              subject: `Payment confirmed — ${rupees}`,
              html: invoicePaidStudentEmail({
                studentName: payment.studentName,
                amount: rupees,
                paidAt: paidAtStr,
                method: 'razorpay',
                portalUrl: 'https://raagdhara.com/parent/payments',
              }),
            }).catch((err: unknown) => console.error('[razorpay-webhook] parent email failed:', err))
          }
        }
      }
    } catch (err) {
      console.error('[razorpay-webhook] confirmation email failed:', err)
    }
  })()

  return NextResponse.json({ received: true })
}
