import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Payment, Student } from '@/lib/firebase/types'
import { serializeDoc } from '@/lib/firebase/serialize'
import AdminPaymentsClient from './AdminPaymentsClient'

async function getPageData() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) redirect('/auth/login')

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true)
  } catch {
    redirect('/auth/login')
  }

  const [paymentsSnap, studentsSnap] = await Promise.all([
    adminDb.collection('payments').orderBy('dueDate', 'desc').get(),
    adminDb.collection('students').get(),
  ])

  const payments = paymentsSnap.docs.map((d) =>
    serializeDoc({ id: d.id, ...(d.data() as Payment) })
  )
  const students = studentsSnap.docs.map((d) =>
    serializeDoc({ id: d.id, ...(d.data() as Student) })
  )

  return { payments, students }
}

export default async function AdminPaymentsPage() {
  const { payments, students } = await getPageData()

  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'sent').length
  const overdue = payments.filter((p) => p.status === 'overdue').length
  const paid = payments.filter((p) => p.status === 'paid').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Payments</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {payments.length > 0
            ? `${paid} paid · ${pending} pending · ${overdue} overdue`
            : 'No invoices yet.'}
        </p>
      </div>

      <AdminPaymentsClient payments={payments} students={students} />
    </div>
  )
}
