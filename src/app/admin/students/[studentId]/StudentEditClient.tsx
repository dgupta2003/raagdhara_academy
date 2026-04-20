'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Payment, PaymentStatus } from '@/lib/firebase/types';

const COURSES = [
  { id: 'hindustani-classical-vocal', label: 'Hindustani Classical Vocal Music' },
  { id: 'popular-film-music-hindi', label: 'Popular and Film Music - Hindi' },
  { id: 'devotional-hindi', label: 'Devotional - Hindi' },
  { id: 'ghazal', label: 'Ghazal' },
  { id: 'bhatkhande-full-course', label: 'Bhatkhande Sangeet Vidyapeeth - Full Course' },
];

const BATCH_TYPES = [
  { id: 'normal', label: 'Normal Batch' },
  { id: 'special', label: 'Special Batch' },
  { id: 'personal', label: 'Personal Classes' },
];

const STATUS_CONFIG: Record<PaymentStatus, { label: string; classes: string }> = {
  paid: { label: 'Paid', classes: 'text-green-700 bg-green-50 border-green-200' },
  pending: { label: 'Pending', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  sent: { label: 'Invoice Sent', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'text-red-700 bg-red-50 border-red-200' },
};

function formatAmount(amount: number, currency: string) {
  return currency === 'USD' ? `$${amount}` : `₹${(amount / 100).toLocaleString('en-IN')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentEditClient({
  student,
  recentPayments = [],
}: {
  student: Student & { id: string };
  recentPayments?: (Payment & { id: string })[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState('');

  const [fields, setFields] = useState({
    status: student.status,
    courseId: student.courseId,
    batchType: student.batchType,
    category: student.category,
    customFeeOverride: student.customFeeOverride?.toString() ?? '',
    paymentDueDayOverride: student.paymentDueDayOverride?.toString() ?? '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: fields.status,
          courseId: fields.courseId,
          batchType: fields.batchType,
          category: fields.category,
          customFeeOverride: fields.customFeeOverride ? Number(fields.customFeeOverride) : null,
          paymentDueDayOverride: fields.paymentDueDayOverride ? Number(fields.paymentDueDayOverride) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative';
  const labelClass = 'block text-sm font-medium text-foreground mb-1 font-body';

  return (
    <div className="bg-white rounded-lg border border-border shadow-warm p-6 space-y-5">
      {/* Read-only info */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
        {[
          ['Phone', `${student.countryCode} ${student.phone}`],
          ['Enrolled', new Date(student.enrollmentDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground font-body">{label}</p>
            <p className="text-sm text-foreground font-body font-medium">{value}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Status</label>
          <select value={fields.status} onChange={(e) => setFields((p) => ({ ...p, status: e.target.value as Student['status'] }))} className={inputClass}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={fields.category} onChange={(e) => setFields((p) => ({ ...p, category: e.target.value as Student['category'] }))} className={inputClass}>
            <option value="india">India</option>
            <option value="nri">NRI</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Course</label>
        <select value={fields.courseId} onChange={(e) => setFields((p) => ({ ...p, courseId: e.target.value }))} className={inputClass}>
          {COURSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Batch type</label>
        <select value={fields.batchType} onChange={(e) => setFields((p) => ({ ...p, batchType: e.target.value }))} className={inputClass}>
          {BATCH_TYPES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div>
          <label className={labelClass}>Custom fee override (₹ paise)</label>
          <input type="number" value={fields.customFeeOverride} onChange={(e) => setFields((p) => ({ ...p, customFeeOverride: e.target.value }))} className={inputClass} placeholder="Leave blank to use global" />
          <p className="mt-1 text-xs text-muted-foreground font-body">e.g. 50000 = ₹500</p>
        </div>
        <div>
          <label className={labelClass}>Payment due day override</label>
          <input type="number" min={1} max={28} value={fields.paymentDueDayOverride} onChange={(e) => setFields((p) => ({ ...p, paymentDueDayOverride: e.target.value }))} className={inputClass} placeholder="Leave blank for global default" />
          <p className="mt-1 text-xs text-muted-foreground font-body">Day of month (1–28)</p>
        </div>
      </div>

      {saveError && <p className="text-sm text-error font-body">{saveError}</p>}
      {saveSuccess && <p className="text-sm text-green-600 font-body">Saved successfully.</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-body text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
      >
        {isSaving ? 'Saving…' : 'Save changes'}
      </button>

      {/* Payments section */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-base font-semibold text-foreground">Payments</h2>
          <button
            onClick={async () => {
              setInvoiceLoading(true);
              setInvoiceMsg('');
              try {
                const res = await fetch('/api/admin/payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ studentId: student.id }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Failed');
                setInvoiceMsg(data.created > 0 ? 'Invoice created.' : 'Invoice already exists for this month.');
                router.refresh();
              } catch (err) {
                setInvoiceMsg(`Error: ${(err as Error).message}`);
              } finally {
                setInvoiceLoading(false);
              }
            }}
            disabled={invoiceLoading}
            className="px-3 py-1.5 text-xs font-body font-medium rounded-md border border-border text-foreground hover:bg-muted/30 disabled:opacity-60 transition-contemplative"
          >
            {invoiceLoading ? 'Creating…' : 'Generate invoice for this month'}
          </button>
        </div>

        {invoiceMsg && (
          <p className={`text-xs font-body px-3 py-2 rounded-md border ${invoiceMsg.startsWith('Error') ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}>
            {invoiceMsg}
          </p>
        )}

        {recentPayments.length === 0 ? (
          <p className="text-sm font-body text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((p) => {
              const cfg = STATUS_CONFIG[p.status];
              return (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/20">
                  <div>
                    <span className="font-body text-sm font-medium text-foreground">{formatAmount(p.amount, p.currency)}</span>
                    <span className="font-body text-xs text-muted-foreground ml-2">due {formatDate(p.dueDate as string)}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium border ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
