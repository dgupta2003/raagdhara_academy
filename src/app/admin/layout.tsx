import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import AdminDashboardShell from '@/components/dashboard/AdminDashboardShell';
import AuthProvider from '@/components/providers/AuthProvider';

// Full cryptographic session verification — runs on every admin page load.
// This is the "inner gate": middleware checked cookie presence, this checks validity.
async function verifyAdminSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      redirect('/auth/login');
    }
    return decoded.uid;
  } catch {
    redirect('/auth/login');
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyAdminSession();

  return (
    <AuthProvider>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </AuthProvider>
  );
}
