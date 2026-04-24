import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Student, Settings } from '@/lib/firebase/types'
import { resolveStudentFee } from '@/lib/payments/calculator'

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
  // Single-field equality query only — no composite index needed.
  // Filter by month prefix in JS (dueDate is stored as YYYY-MM-DD string).
  const snap = await adminDb
    .collection('payments')
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.some((d) => {
    const dueDate = d.data().dueDate as string | undefined
    return typeof dueDate === 'string' && dueDate.startsWith(month)
  })
}

async function createPaymentForStudent(
  student: Student & { id: string },
  settings: Settings,
  month: string
): Promise<'created' | 'skipped'> {
  if (await alreadyHasPayment(student.id, month)) return 'skipped'

  const { amount, currency } = resolveStudentFee(student, settings)
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
      month?: string // YYYY-MM, defaults to current month
    }

    const targetMonth = month ?? new Date().toISOString().slice(0, 7)

    const settingsDoc = await adminDb.collection('settings').doc('global').get()
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
        const result = await createPaymentForStudent(student, settings, targetMonth)
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
    const result = await createPaymentForStudent(student, settings, targetMonth)
    return NextResponse.json({ created: result === 'created' ? 1 : 0, skipped: result === 'skipped' ? 1 : 0 })
  } catch (err) {
    console.error('Admin payments POST error:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
