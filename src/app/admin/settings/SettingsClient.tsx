'use client';

import { useState } from 'react';
import type { Settings } from '@/lib/firebase/types';

export default function SettingsClient({ settings }: { settings: Settings }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [fields, setFields] = useState({
    defaultPaymentDay: settings.defaultPaymentDay.toString(),
    reminderDaysAfterDue: settings.reminderDaysAfterDue.toString(),
    // India fees (paise)
    indiaNormal: settings.indiaFees.normal.toString(),
    indiaSpecial: settings.indiaFees.special.toString(),
    indiaPersonal: settings.indiaFees.personal.toString(),
    // NRI USD
    nriUsdNormal: settings.nriFees.usd.normal.toString(),
    nriUsdSpecial: settings.nriFees.usd.special.toString(),
    nriUsdPersonal: settings.nriFees.usd.personal.toString(),
    // NRI INR equivalent (paise)
    nriInrNormal: settings.nriFees.inrEquivalent.normal.toString(),
    nriInrSpecial: settings.nriFees.inrEquivalent.special.toString(),
    nriInrPersonal: settings.nriFees.inrEquivalent.personal.toString(),
  });

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const payload: Partial<Settings> = {
      defaultPaymentDay: Number(fields.defaultPaymentDay),
      reminderDaysAfterDue: Number(fields.reminderDaysAfterDue),
      indiaFees: {
        normal: Number(fields.indiaNormal),
        special: Number(fields.indiaSpecial),
        personal: Number(fields.indiaPersonal),
      },
      nriFees: {
        usd: {
          normal: Number(fields.nriUsdNormal),
          special: Number(fields.nriUsdSpecial),
          personal: Number(fields.nriUsdPersonal),
        },
        inrEquivalent: {
          normal: Number(fields.nriInrNormal),
          special: Number(fields.nriInrSpecial),
          personal: Number(fields.nriInrPersonal),
        },
      },
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save settings');
      }
      setSaveSuccess(true);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-md border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1 font-body';

  const FeeRow = ({ normal, special, personal, onChange }: {
    normal: string; special: string; personal: string;
    onChange: (field: 'normal' | 'special' | 'personal') => (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="grid grid-cols-3 gap-3">
      {[['normal', normal], ['special', special], ['personal', personal]].map(([key, val]) => (
        <div key={key}>
          <label className={labelClass}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
          <input type="number" value={val} onChange={onChange(key as 'normal' | 'special' | 'personal')} className={inputClass} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Payment timing */}
      <div className="bg-white rounded-lg border border-border shadow-warm p-6">
        <h2 className="font-headline text-base font-semibold text-foreground mb-4">Payment timing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Default payment due day (1–28)</label>
            <input type="number" min={1} max={28} value={fields.defaultPaymentDay} onChange={set('defaultPaymentDay')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Send reminder N days after due date</label>
            <input type="number" min={0} value={fields.reminderDaysAfterDue} onChange={set('reminderDaysAfterDue')} className={inputClass} />
          </div>
        </div>
      </div>

      {/* India fees */}
      <div className="bg-white rounded-lg border border-border shadow-warm p-6">
        <h2 className="font-headline text-base font-semibold text-foreground mb-1">India fees (₹ paise)</h2>
        <p className="font-body text-xs text-muted-foreground mb-4">Enter in paise. e.g. 50000 = ₹500/month</p>
        <FeeRow
          normal={fields.indiaNormal} special={fields.indiaSpecial} personal={fields.indiaPersonal}
          onChange={(f) => set(('india' + f.charAt(0).toUpperCase() + f.slice(1)) as keyof typeof fields)}
        />
      </div>

      {/* NRI USD fees */}
      <div className="bg-white rounded-lg border border-border shadow-warm p-6">
        <h2 className="font-headline text-base font-semibold text-foreground mb-1">NRI fees — USD</h2>
        <p className="font-body text-xs text-muted-foreground mb-4">Enter in USD dollars. e.g. 30 = $30/month</p>
        <FeeRow
          normal={fields.nriUsdNormal} special={fields.nriUsdSpecial} personal={fields.nriUsdPersonal}
          onChange={(f) => set(('nriUsd' + f.charAt(0).toUpperCase() + f.slice(1)) as keyof typeof fields)}
        />
      </div>

      {/* NRI INR equivalent fees */}
      <div className="bg-white rounded-lg border border-border shadow-warm p-6">
        <h2 className="font-headline text-base font-semibold text-foreground mb-1">NRI fees — INR equivalent (paise)</h2>
        <p className="font-body text-xs text-muted-foreground mb-4">For NRI students who prefer to pay in INR.</p>
        <FeeRow
          normal={fields.nriInrNormal} special={fields.nriInrSpecial} personal={fields.nriInrPersonal}
          onChange={(f) => set(('nriInr' + f.charAt(0).toUpperCase() + f.slice(1)) as keyof typeof fields)}
        />
      </div>

      {saveError && <p className="text-sm text-error font-body">{saveError}</p>}
      {saveSuccess && <p className="text-sm text-green-600 font-body">Settings saved.</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-body text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-contemplative"
      >
        {isSaving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}
