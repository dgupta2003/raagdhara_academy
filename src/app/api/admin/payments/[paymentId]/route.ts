import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Payment } from '@/lib/firebase/types'

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

// PUT /api/admin/payments/[paymentId]
// Body: { amount?: number, dueDate?: string, notes?: string }
// Admin-only. Cannot edit paid or cancelled invoices.
export async function PUT(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { paymentId } = params
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
  }

  try {
    const body = await request.json() as { amount?: number; dueDate?: string; notes?: string }
    const { amount, dueDate, notes } = body

    if (amount === undefined && dueDate === undefined && notes === undefined) {
      return NextResponse.json({ error: 'Nothing to update — provide amount, dueDate, or notes' }, { status: 400 })
    }

    const ref = adminDb.collection('payments').doc(paymentId)
    const doc = await ref.get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const payment = doc.data() as Payment
    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Cannot edit a paid invoice' }, { status: 400 })
    }
    if (payment.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot edit a cancelled invoice' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
      }
      updates.amount = amount
    }

    if (dueDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return NextResponse.json({ error: 'dueDate must be YYYY-MM-DD' }, { status: 400 })
      }
      updates.dueDate = dueDate
    }

    if (notes !== undefined) {
      updates.notes = notes
    }

    await ref.update(updates)
    return NextResponse.json({ updated: true })
  } catch (err) {
    console.error('[admin/payments/[paymentId]] PUT error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
