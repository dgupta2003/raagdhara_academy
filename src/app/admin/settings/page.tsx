import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Settings } from '@/lib/firebase/types';
import { serializeDoc } from '@/lib/firebase/serialize';
import SettingsClient from './SettingsClient';

const DEFAULT_SETTINGS: Settings = {
  defaultPaymentDay: 1,
  indiaFees: { normal: 50000, special: 70000, personal: 100000 },
  nriFees: {
    usd: { normal: 30, special: 45, personal: 65 },
    inrEquivalent: { normal: 250000, special: 350000, personal: 500000 },
  },
  reminderDaysAfterDue: 3,
  updatedAt: new Date().toISOString(),
};

async function getSettings(): Promise<Settings> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');
  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect('/auth/login');
  }

  const doc = await adminDb.collection('settings').doc('global').get();
  if (!doc.exists) return DEFAULT_SETTINGS;
  return serializeDoc(doc.data() as Settings & Record<string, unknown>) as Settings;
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Settings</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Global fee structure and payment configuration.</p>
      </div>
      <SettingsClient settings={settings} />
    </div>
  );
}
