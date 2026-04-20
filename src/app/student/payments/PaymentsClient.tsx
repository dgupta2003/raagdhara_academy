'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import type { Payment, PaymentStatus, StudentCategory } from '@/lib/firebase/types';

type PaymentRecord = Payment & { id: string };

const STATUS_CONFIG: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'text-green-700 bg-green-50 border-green-200' },
  pending: { label: 'Pending', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  sent: { label: 'Invoice Sent', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'text-red-700 bg-red-50 border-red-200' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`
}

function formatInr(paise: number): string {
  const rupees = Math.floor(paise / 100)
  if (rupees >= 100000) {
    const lakhs = Math.floor(rupees / 100000)
    const remainder = rupees % 100000
    const thousands = Math.floor(remainder / 1000)
    const hundreds = remainder % 1000
    return `₹${lakhs},${thousands.toString().padStart(2, '0')},${hundreds.toString().padStart(3, '0')}`
  }
  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000)
    const remainder = rupees % 1000
    return `₹${thousands},${remainder.toString().padStart(3, '0')}`
  }
  return `₹${rupees}`
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function PayNowButton({ payment }: { payment: PaymentRecord }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? 'Failed to create order');

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: 'INR',
        name: 'Raagdhara Music Academy',
        description: `Monthly fee — due ${formatDate(payment.dueDate as string)}`,
        theme: { color: '#8B4513' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId: payment.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error ?? 'Payment verification failed');
          } else {
            router.refresh();
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handlePay}
        disabled={loading}
        className="flex-shrink-0 px-4 py-2 text-sm font-body font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
      >
        {loading ? 'Opening…' : 'Pay now'}
      </button>
      {error && <p className="text-xs text-red-600 font-body max-w-[180px] text-right">{error}</p>}
    </div>
  );
}

export default function PaymentsClient({
  payments,
  exchangeRate,
  studentCategory,
}: {
  payments: PaymentRecord[];
  exchangeRate: number | null;
  studentCategory: StudentCategory;
}) {
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
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-3">
        {payments.map((payment) => {
          const config = STATUS_CONFIG[payment.status];
          const isPaid = payment.status === 'paid';
          const isPayable = !isPaid;
          const isUsd = payment.currency === 'USD' && studentCategory === 'nri';

          // Compute display amounts
          const primaryAmount = isUsd
            ? `$${payment.amount}`
            : formatInr(payment.amount);

          const convertedPaise = isUsd && exchangeRate
            ? Math.round(payment.amount * exchangeRate * 100)
            : null;

          return (
            <div key={payment.id} className="bg-white rounded-lg border border-border shadow-warm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-headline text-xl font-semibold text-foreground">
                      {primaryAmount}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${config.classes}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* NRI USD conversion info */}
                  {isUsd && isPayable && exchangeRate && convertedPaise && (
                    <p className="text-xs font-body text-muted-foreground mb-2">
                      {formatInr(convertedPaise)} at today's rate · 1 USD = ₹{exchangeRate.toFixed(2)}
                    </p>
                  )}

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

                {isPayable && <PayNowButton payment={payment} />}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
