import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import StudentSidebar from '@/components/dashboard/StudentSidebar';

async function verifyStudentSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'student') {
      redirect('/auth/login');
    }
    return decoded.uid;
  } catch {
    redirect('/auth/login');
  }
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await verifyStudentSession();

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
