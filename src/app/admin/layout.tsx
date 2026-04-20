import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import AdminSidebar from '@/components/dashboard/AdminSidebar';

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
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
