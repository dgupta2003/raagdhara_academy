'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Payment, PaymentStatus } from '@/lib/firebase/types'

type PaymentRecord = Payment & { id: string }
type Filter = 'all' | 'pending' | 'overdue' | 'paid'

const STATUS_CONFIG: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'text-green-700 bg-green-50 border-green-200' },
  pending: { label: 'Pending', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  sent: { label: 'Invoice Sent', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'text-red-700 bg-red-50 border-red-200' },
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`
  return `₹${(amount / 100).toLocaleString('en-IN')}`
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`
}

export default function AdminPaymentsClient({ payments }: { payments: PaymentRecord[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)

  const filtered = payments.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'pending') return p.status === 'pending' || p.status === 'sent'
    return p.status === filter
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

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'paid', label: 'Paid' },
  ]

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-body transition-contemplative ${
                filter === tab.key
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleBulkGenerate}
          disabled={generating}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-body font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
        >
          {generating ? 'Generating…' : 'Generate this month\'s invoices'}
        </button>
      </div>

      {genResult && (
        <p className={`text-sm font-body px-4 py-3 rounded-md border ${genResult.startsWith('Error') ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}>
          {genResult}
        </p>
      )}

      {/* Payment list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-border shadow-warm p-12 text-center">
          <p className="font-body text-sm text-muted-foreground">No invoices in this category.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border shadow-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                {['Student', 'Amount', 'Due date', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const config = STATUS_CONFIG[p.status]
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${config.classes}`}>
                        {config.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
