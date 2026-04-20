import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Razorpay from 'razorpay'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Payment } from '@/lib/firebase/types'
import { getUsdToInrRate } from '@/lib/payments/exchange-rate'

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

  const { paymentId } = await request.json()
  if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })

  const paymentRef = adminDb.collection('payments').doc(paymentId)
  const paymentDoc = await paymentRef.get()
  if (!paymentDoc.exists) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  const payment = paymentDoc.data() as Payment
  if (payment.studentId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!['pending', 'sent', 'overdue'].includes(payment.status)) {
    return NextResponse.json({ error: 'Payment is not payable' }, { status: 400 })
  }

  let amountInPaise: number
  let convertedAmountInr: number | undefined
  let rate: number | undefined

  if (payment.currency === 'USD') {
    rate = await getUsdToInrRate()
    amountInPaise = Math.round(payment.amount * rate * 100)
    convertedAmountInr = amountInPaise
  } else {
    amountInPaise = payment.amount
  }

  if (amountInPaise < 100) {
    return NextResponse.json({ error: 'Amount too small (minimum ₹1)' }, { status: 400 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: paymentId,
  })

  const update: Record<string, unknown> = { razorpayOrderId: order.id, updatedAt: new Date() }
  if (convertedAmountInr !== undefined) update.convertedAmountInr = convertedAmountInr

  await paymentRef.update(update)

  return NextResponse.json({
    orderId: order.id,
    amount: amountInPaise,
    currency: 'INR',
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    rate,
  })
}
