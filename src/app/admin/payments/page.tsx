import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Payment } from '@/lib/firebase/types'
import { serializeDoc } from '@/lib/firebase/serialize'
import AdminPaymentsClient from './AdminPaymentsClient'

async function getPayments() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) redirect('/auth/login')

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true)
  } catch {
    redirect('/auth/login')
  }

  const snap = await adminDb
    .collection('payments')
    .orderBy('dueDate', 'desc')
    .get()

  return snap.docs.map((d) =>
    serializeDoc({ id: d.id, ...(d.data() as Payment) })
  )
}

export default async function AdminPaymentsPage() {
  const payments = await getPayments()

  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'sent').length
  const overdue = payments.filter((p) => p.status === 'overdue').length
  const paid = payments.filter((p) => p.status === 'paid').length

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-semibold text-foreground">Payments</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {payments.length > 0
              ? `${paid} paid · ${pending} pending · ${overdue} overdue`
              : 'No invoices yet.'}
          </p>
        </div>
      </div>

      <AdminPaymentsClient payments={payments} />
    </div>
  )
}
