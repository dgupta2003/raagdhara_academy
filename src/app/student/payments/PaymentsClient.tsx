'use client';

import type { Payment, PaymentStatus } from '@/lib/firebase/types';

type PaymentRecord = Payment & { id: string };

const STATUS_CONFIG: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'text-green-700 bg-green-50 border-green-200' },
  pending: { label: 'Pending', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  sent: { label: 'Invoice Sent', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'text-red-700 bg-red-50 border-red-200' },
};

function formatAmount(amount: number, currency: string): string {
  if (currency === 'USD') return `$${amount}`;
  return `₹${(amount / 100).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentsClient({ payments }: { payments: PaymentRecord[] }) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-warm p-12 text-center">
        <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="font-body text-sm text-muted-foreground">No invoices yet.</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Invoices will appear here once Vaishnavi creates them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => {
        const config = STATUS_CONFIG[payment.status];
        const isPaid = payment.status === 'paid';

        return (
          <div key={payment.id} className="bg-white rounded-lg border border-border shadow-warm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-headline text-xl font-semibold text-foreground">
                    {formatAmount(payment.amount, payment.currency)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${config.classes}`}>
                    {config.label}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-body">Due</span>
                    <span className="text-foreground font-body">{formatDate(payment.dueDate as string)}</span>
                  </div>
                  {isPaid && payment.paidAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-body">Paid</span>
                      <span className="text-green-700 font-body">{formatDate(payment.paidAt as string)}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isPaid && (
                <button
                  disabled
                  title="Online payment coming soon"
                  className="flex-shrink-0 px-4 py-2 text-sm font-body rounded-md border border-border text-muted-foreground bg-muted/30 cursor-not-allowed"
                >
                  Pay now
                </button>
              )}
            </div>
          </div>
        );
      })}

      <p className="font-body text-xs text-muted-foreground text-center pt-2">
        Online payment will be available in the next update.
      </p>
    </div>
  );
}
