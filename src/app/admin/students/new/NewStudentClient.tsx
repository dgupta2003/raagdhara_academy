'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+60', label: 'Malaysia (+60)' },
];

export default function NewStudentClient() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [fields, setFields] = useState({
    displayName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    category: 'india',
    courseId: '',
    batchType: '',
    status: 'active',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!fields.displayName || !fields.email || !fields.phone || !fields.courseId || !fields.batchType) {
      setSaveError('Please fill in all required fields.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create student');
      }
      router.push('/admin/students');
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative';
  const labelClass = 'block text-sm font-medium text-foreground mb-1 font-body';

  return (
    <div className="bg-white rounded-lg border border-border shadow-warm p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Full name *</label>
          <input type="text" value={fields.displayName} onChange={set('displayName')} className={inputClass} placeholder="Arjun Sharma" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Email *</label>
          <input type="email" value={fields.email} onChange={set('email')} className={inputClass} placeholder="student@example.com" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Phone *</label>
          <div className="flex gap-2">
            <select value={fields.countryCode} onChange={set('countryCode')} className="w-36 px-2 py-2.5 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <input type="tel" value={fields.phone} onChange={set('phone')} className="flex-1 px-4 py-2.5 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="98765 43210" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={fields.category} onChange={set('category')} className={inputClass}>
            <option value="india">India</option>
            <option value="nri">NRI</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={fields.status} onChange={set('status')} className={inputClass}>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Course *</label>
          <select value={fields.courseId} onChange={set('courseId')} className={inputClass}>
            <option value="">Select a course…</option>
            {COURSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Batch type *</label>
          <select value={fields.batchType} onChange={set('batchType')} className={inputClass}>
            <option value="">Select a batch type…</option>
            {BATCH_TYPES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
      </div>

      {saveError && <p className="text-sm text-error font-body">{saveError}</p>}

      <button onClick={handleSave} disabled={isSaving} className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-body text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative">
        {isSaving ? 'Creating…' : 'Create student'}
      </button>
    </div>
  );
}
