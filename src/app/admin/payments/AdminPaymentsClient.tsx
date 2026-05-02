'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Payment, PaymentStatus, Student } from '@/lib/firebase/types'

type PaymentRecord = Payment & { id: string }
type StudentRecord = Student & { id: string }
type MainTab = 'analytics' | 'invoices'
type InvoiceFilter = 'all' | 'pending' | 'overdue' | 'paid'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'text-green-700 bg-green-50 border-green-200' },
  pending: { label: 'Pending', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  sent: { label: 'Invoice Sent', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'text-red-700 bg-red-50 border-red-200' },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatInr(paise: number): string {
  const rupees = Math.round(paise / 100)
  if (rupees >= 100000) {
    const lakhs = Math.floor(rupees / 100000)
    const rem = rupees % 100000
    const thousands = Math.floor(rem / 1000)
    const hundreds = rem % 1000
    return `₹${lakhs},${thousands.toString().padStart(2, '0')},${hundreds.toString().padStart(3, '0')}`
  }
  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000)
    const rem = rupees % 1000
    return `₹${thousands},${rem.toString().padStart(3, '0')}`
  }
  return `₹${rupees}`
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`
  return formatInr(amount)
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`
}

// Convert a payment to INR paise for analytics (USD converted using stored rate or 85 fallback)
function toInrPaise(p: PaymentRecord): number {
  if (p.currency === 'INR') return p.amount
  // convertedAmountInr is stored in paise
  if (p.convertedAmountInr) return p.convertedAmountInr
  return p.amount * 85 * 100 // fallback: USD * 85 rate * 100 paise
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7) // YYYY-MM
}

function monthLabel(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${y}`
}

export default function AdminPaymentsClient({
  payments,
  students,
}: {
  payments: PaymentRecord[]
  students: StudentRecord[]
}) {
  const router = useRouter()
  const [mainTab, setMainTab] = useState<MainTab>('analytics')
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [sendingNotif, setSendingNotif] = useState<string | null>(null)
  const [notifResult, setNotifResult] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState(false)

  // Student lookup map for batch info
  const studentMap = useMemo(() => {
    const m = new Map<string, StudentRecord>()
    students.forEach((s) => m.set(s.id, s))
    return m
  }, [students])

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)
  const thisYear = today.slice(0, 4)

  // ── Analytics computations ────────────────────────────────────────────────

  const ytdRevenue = useMemo(() =>
    payments.filter((p) => p.status === 'paid' && (p.dueDate as string).startsWith(thisYear))
      .reduce((s, p) => s + toInrPaise(p), 0),
  [payments, thisYear])

  const thisMonthRevenue = useMemo(() =>
    payments.filter((p) => p.status === 'paid' && (p.dueDate as string).startsWith(thisMonth))
      .reduce((s, p) => s + toInrPaise(p), 0),
  [payments, thisMonth])

  const pendingTotal = useMemo(() =>
    payments.filter((p) => p.status === 'pending' || p.status === 'sent')
      .reduce((s, p) => s + toInrPaise(p), 0),
  [payments])

  const overdueTotal = useMemo(() =>
    payments.filter((p) => p.status === 'overdue')
      .reduce((s, p) => s + toInrPaise(p), 0),
  [payments])

  // Monthly breakdown — last 12 months
  const monthlyData = useMemo(() => {
    const months: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      months.push(d.toISOString().slice(0, 7))
    }
    return months.map((m) => {
      const inMonth = payments.filter((p) => (p.dueDate as string).startsWith(m))
      const paid = inMonth.filter((p) => p.status === 'paid').reduce((s, p) => s + toInrPaise(p), 0)
      const pending = inMonth.filter((p) => p.status === 'pending' || p.status === 'sent').reduce((s, p) => s + toInrPaise(p), 0)
      const overdue = inMonth.filter((p) => p.status === 'overdue').reduce((s, p) => s + toInrPaise(p), 0)
      return { month: m, label: monthLabel(m), paid, pending, overdue, total: paid + pending + overdue, count: inMonth.length }
    })
  }, [payments])

  const maxMonthlyRevenue = Math.max(...monthlyData.map((m) => m.total), 1)

  // Batch breakdown
  const batchBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; paidTotal: number; invoicedTotal: number; studentIds: Set<string> }>()
    payments.forEach((p) => {
      const student = studentMap.get(p.studentId)
      const batchType = student?.batchType ?? 'unknown'
      const batchLabel = student?.batchLabel
      const key = batchLabel ? `${batchType}__${batchLabel}` : batchType
      const label = batchLabel
        ? `${batchType.charAt(0).toUpperCase() + batchType.slice(1)} — ${batchLabel}`
        : { normal: 'Normal Batch', special: 'Special Batch', personal: 'Personal Classes' }[batchType] ?? batchType
      if (!map.has(key)) {
        map.set(key, { label, paidTotal: 0, invoicedTotal: 0, studentIds: new Set() })
      }
      const row = map.get(key)!
      const amount = toInrPaise(p)
      row.invoicedTotal += amount
      if (p.status === 'paid') row.paidTotal += amount
      row.studentIds.add(p.studentId)
    })
    return Array.from(map.entries())
      .map(([, v]) => ({ ...v, studentCount: v.studentIds.size }))
      .sort((a, b) => b.invoicedTotal - a.invoicedTotal)
  }, [payments, studentMap])

  // Per-student summary
  const studentSummary = useMemo(() => {
    const map = new Map<string, { name: string; batchLabel: string; paidYtd: number; pending: number; lastPaid: string | null }>()
    payments.forEach((p) => {
      const student = studentMap.get(p.studentId)
      const batchLabel = student?.batchLabel ?? student?.batchType ?? '—'
      if (!map.has(p.studentId)) {
        map.set(p.studentId, { name: p.studentName, batchLabel, paidYtd: 0, pending: 0, lastPaid: null })
      }
      const row = map.get(p.studentId)!
      const amount = toInrPaise(p)
      if (p.status === 'paid' && (p.dueDate as string).startsWith(thisYear)) {
        row.paidYtd += amount
        const paidAt = p.paidAt as string | undefined
        if (paidAt && (!row.lastPaid || paidAt > row.lastPaid)) row.lastPaid = paidAt
      }
      if (p.status === 'pending' || p.status === 'sent' || p.status === 'overdue') {
        row.pending += amount
      }
    })
    return Array.from(map.values()).sort((a, b) => b.paidYtd - a.paidYtd)
  }, [payments, studentMap, thisYear])

  // ── Invoice actions ───────────────────────────────────────────────────────

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    setDeleting(paymentId)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete')
      router.refresh()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setDeleting(null)
    }
  }

  const handleMarkPaid = async (paymentId: string, studentName: string) => {
    if (!confirm(`Mark invoice for ${studentName} as paid (manual / UPI)?`)) return
    setMarkingPaid(paymentId)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      router.refresh()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setMarkingPaid(null)
    }
  }

  const handleSendNotif = async (paymentId: string, type: 'reminder' | 'overdue') => {
    setSendingNotif(paymentId)
    try {
      const res = await fetch('/api/admin/payments/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setNotifResult((prev) => ({ ...prev, [paymentId]: `Sent to ${data.recipients?.join(', ') ?? 'recipient'}` }))
      // Clear message after 4s
      setTimeout(() => setNotifResult((prev) => { const n = { ...prev }; delete n[paymentId]; return n }), 4000)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSendingNotif(null)
    }
  }

  const filtered = payments.filter((p) => {
    if (invoiceFilter === 'all') return true
    if (invoiceFilter === 'pending') return p.status === 'pending' || p.status === 'sent'
    return p.status === invoiceFilter
  })

  const handleBulkGenerate = async () => {
    setGenerating(true)
    setGenResult(null)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setGenResult(`Created ${data.created} invoice${data.created !== 1 ? 's' : ''}${data.skipped > 0 ? `, skipped ${data.skipped} (already exist)` : ''}.`)
      router.refresh()
    } catch (err) {
      setGenResult(`Error: ${(err as Error).message}`)
    } finally {
      setGenerating(false)
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')

      // Sheet 1: All invoices
      const invoiceRows = payments.map((p) => {
        const student = studentMap.get(p.studentId)
        return {
          'Student': p.studentName,
          'Email': p.studentEmail,
          'Batch': student?.batchLabel ?? student?.batchType ?? '—',
          'Amount (display)': formatAmount(p.amount, p.currency),
          'Amount INR (paise)': toInrPaise(p),
          'Currency': p.currency,
          'Due Date': p.dueDate as string,
          'Status': p.status,
          'Paid At': p.paidAt ? (p.paidAt as string) : '',
          'Method': p.markedPaidManually ? 'Manual' : p.razorpayPaymentId ? 'Razorpay' : '',
        }
      })

      // Sheet 2: Monthly summary
      const monthRows = monthlyData.map((m) => ({
        'Month': m.label,
        'Paid (₹)': Math.round(m.paid / 100),
        'Pending (₹)': Math.round(m.pending / 100),
        'Overdue (₹)': Math.round(m.overdue / 100),
        'Total Invoiced (₹)': Math.round(m.total / 100),
        'Invoice Count': m.count,
      }))

      // Sheet 3: Batch breakdown
      const batchRows = batchBreakdown.map((b) => ({
        'Batch': b.label,
        'Students': b.studentCount,
        'Total Invoiced (₹)': Math.round(b.invoicedTotal / 100),
        'Total Paid (₹)': Math.round(b.paidTotal / 100),
        'Collection Rate': b.invoicedTotal > 0 ? `${Math.round((b.paidTotal / b.invoicedTotal) * 100)}%` : '—',
      }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows), 'All Invoices')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthRows), 'Monthly Summary')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(batchRows), 'Batch Breakdown')

      const now = new Date().toISOString().slice(0, 7)
      XLSX.writeFile(wb, `raagdhara-payments-${now}.xlsx`)
    } catch (err) {
      alert('Export failed: ' + (err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Main tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          {([
            { key: 'analytics', label: 'Analytics' },
            { key: 'invoices', label: 'Invoices' },
          ] as { key: MainTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-body transition-contemplative ${
                mainTab === tab.key
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {mainTab === 'analytics' && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-3 py-2 border border-border text-sm font-body rounded-md hover:bg-muted/50 disabled:opacity-60 transition-contemplative"
            >
              {exporting ? 'Exporting…' : 'Export .xlsx'}
            </button>
          )}
          <button
            onClick={handleBulkGenerate}
            disabled={generating}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-body font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
          >
            {generating ? 'Generating…' : "Generate this month's invoices"}
          </button>
        </div>
      </div>

      {genResult && (
        <p className={`text-sm font-body px-4 py-3 rounded-md border ${genResult.startsWith('Error') ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}>
          {genResult}
        </p>
      )}

      {/* ── ANALYTICS TAB ── */}
      {mainTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'YTD Revenue', value: formatInr(ytdRevenue), sub: `Jan–${MONTHS[new Date().getMonth()]} ${thisYear}`, color: 'text-green-700' },
              { label: 'This Month', value: formatInr(thisMonthRevenue), sub: 'paid invoices', color: 'text-primary' },
              { label: 'Pending', value: formatInr(pendingTotal), sub: 'awaiting payment', color: 'text-amber-600' },
              { label: 'Overdue', value: formatInr(overdueTotal), sub: 'past due date', color: 'text-red-600' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-lg border border-border shadow-warm p-5">
                <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-1">{card.label}</p>
                <p className={`font-headline text-2xl font-semibold ${card.color}`}>{card.value}</p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly breakdown */}
          <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-headline text-base font-semibold text-foreground">Monthly Breakdown — Last 12 Months</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    {['Month', 'Revenue bar', 'Paid', 'Pending', 'Overdue', 'Invoices'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {monthlyData.map((m) => (
                    <tr key={m.month} className={`hover:bg-muted/10 transition-colors ${m.month === thisMonth ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3 font-body text-sm font-medium text-foreground whitespace-nowrap">
                        {m.label}
                        {m.month === thisMonth && <span className="ml-1.5 text-xs text-primary font-body">← now</span>}
                      </td>
                      <td className="px-4 py-3 w-40">
                        <div className="w-full bg-muted/30 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.round((m.paid / maxMonthlyRevenue) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-green-700">{m.paid ? formatInr(m.paid) : '—'}</td>
                      <td className="px-4 py-3 font-body text-sm text-amber-600">{m.pending ? formatInr(m.pending) : '—'}</td>
                      <td className="px-4 py-3 font-body text-sm text-red-600">{m.overdue ? formatInr(m.overdue) : '—'}</td>
                      <td className="px-4 py-3 font-body text-sm text-muted-foreground">{m.count || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Batch breakdown */}
          {batchBreakdown.length > 0 && (
            <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-headline text-base font-semibold text-foreground">Revenue by Batch</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      {['Batch', 'Students', 'Total Invoiced', 'Total Paid', 'Collection Rate'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-muted-foreground uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {batchBreakdown.map((b) => {
                      const rate = b.invoicedTotal > 0 ? Math.round((b.paidTotal / b.invoicedTotal) * 100) : 0
                      return (
                        <tr key={b.label} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-body text-sm font-medium text-foreground">{b.label}</td>
                          <td className="px-4 py-3 font-body text-sm text-muted-foreground">{b.studentCount}</td>
                          <td className="px-4 py-3 font-body text-sm text-foreground">{formatInr(b.invoicedTotal)}</td>
                          <td className="px-4 py-3 font-body text-sm text-green-700">{formatInr(b.paidTotal)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted/30 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="font-body text-xs text-muted-foreground">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-student summary */}
          {studentSummary.length > 0 && (
            <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-headline text-base font-semibold text-foreground">Per-Student Summary ({thisYear})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      {['Student', 'Batch', 'Paid YTD', 'Pending', 'Last Paid'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-muted-foreground uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentSummary.map((s) => (
                      <tr key={s.name} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-body text-sm font-medium text-foreground">{s.name}</td>
                        <td className="px-4 py-3 font-body text-xs text-muted-foreground capitalize">{s.batchLabel}</td>
                        <td className="px-4 py-3 font-body text-sm text-green-700">{s.paidYtd ? formatInr(s.paidYtd) : '—'}</td>
                        <td className="px-4 py-3 font-body text-sm text-amber-600">{s.pending ? formatInr(s.pending) : '—'}</td>
                        <td className="px-4 py-3 font-body text-xs text-muted-foreground">
                          {s.lastPaid ? formatDate((s.lastPaid as string).slice(0, 10)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {mainTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
            {([
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'paid', label: 'Paid' },
            ] as { key: InvoiceFilter; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setInvoiceFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-body transition-contemplative ${
                  invoiceFilter === tab.key
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-border shadow-warm p-12 text-center">
              <p className="font-body text-sm text-muted-foreground">No invoices in this category.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    {['Student', 'Amount', 'Due date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => {
                    const config = STATUS_CONFIG[p.status]
                    const canAct = p.status !== 'paid'
                    const isOverdue = p.status === 'overdue'
                    return (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-body font-medium text-foreground">{p.studentName}</p>
                          <p className="font-body text-xs text-muted-foreground">{p.studentEmail}</p>
                        </td>
                        <td className="px-4 py-3 font-body text-foreground">
                          {formatAmount(p.amount, p.currency)}
                        </td>
                        <td className="px-4 py-3 font-body text-foreground">
                          {formatDate(p.dueDate as string)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${config.classes}`}>
                              {config.label}
                            </span>
                            {p.markedPaidManually && (
                              <p className="font-body text-xs text-muted-foreground mt-0.5">Manual</p>
                            )}
                            {notifResult[p.id] && (
                              <p className="font-body text-xs text-green-600 mt-0.5">{notifResult[p.id]}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {canAct && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleMarkPaid(p.id, p.studentName)}
                                disabled={markingPaid === p.id}
                                className="text-xs font-body text-green-700 hover:text-green-800 border border-green-200 bg-green-50 hover:bg-green-100 rounded px-2 py-1 transition-colors disabled:opacity-50"
                              >
                                {markingPaid === p.id ? '…' : 'Mark paid'}
                              </button>
                              <button
                                onClick={() => handleSendNotif(p.id, isOverdue ? 'overdue' : 'reminder')}
                                disabled={sendingNotif === p.id}
                                className="text-xs font-body text-amber-700 hover:text-amber-800 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded px-2 py-1 transition-colors disabled:opacity-50"
                              >
                                {sendingNotif === p.id ? '…' : isOverdue ? 'Send overdue notice' : 'Send reminder'}
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                disabled={deleting === p.id}
                                className="text-xs font-body text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                {deleting === p.id ? '…' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
