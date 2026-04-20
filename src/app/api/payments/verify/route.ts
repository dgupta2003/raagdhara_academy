import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Payment } from '@/lib/firebase/types'

async function getStudentUid(): Promise<string | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decoded.uid
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const uid = await getStudentUid()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json()

  if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify HMAC signature
  const secret = process.env.RAZORPAY_KEY_SECRET!
  const expectedSignature = createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const paymentRef = adminDb.collection('payments').doc(paymentId)
  const paymentDoc = await paymentRef.get()
  if (!paymentDoc.exists) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  const payment = paymentDoc.data() as Payment
  if (payment.studentId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await paymentRef.update({
    status: 'paid',
    razorpayPaymentId,
    paidAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({ success: true })
}
