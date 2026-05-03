import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import ParentDashboardShell from '@/components/dashboard/ParentDashboardShell';
import AuthProvider from '@/components/providers/AuthProvider';

async function verifyParentSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'parent') {
      redirect('/auth/login');
    }
  } catch {
    redirect('/auth/login');
  }
}

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  await verifyParentSession();

  return (
    <AuthProvider>
      <ParentDashboardShell>{children}</ParentDashboardShell>
    </AuthProvider>
  );
}
