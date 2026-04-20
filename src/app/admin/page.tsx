import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

async function getOverviewStats() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/auth/login');

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    redirect('/auth/login');
  }

  const [studentsSnap, paymentsSnap] = await Promise.all([
    adminDb.collection('students').get(),
    adminDb.collection('payments').where('status', 'in', ['pending', 'sent', 'overdue']).get(),
  ]);

  const students = studentsSnap.docs.map((d) => d.data());
  const activeCount = students.filter((s) => s.status === 'active').length;
  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const unpaidCount = paymentsSnap.size;

  return { activeCount, pendingCount, unpaidCount, totalStudents: students.length, uid };
}

export default async function AdminOverviewPage() {
  const { activeCount, pendingCount, unpaidCount, totalStudents } = await getOverviewStats();

  const stats = [
    {
      label: 'Active Students',
      value: activeCount,
      href: '/admin/students?status=active',
      color: 'border-green-200 bg-green-50',
      valueColor: 'text-green-700',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Approval',
      value: pendingCount,
      href: '/admin/students?status=pending',
      color: 'border-amber-200 bg-amber-50',
      valueColor: 'text-amber-700',
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Unpaid Invoices',
      value: unpaidCount,
      href: '/admin/payments',
      color: 'border-red-200 bg-red-50',
      valueColor: 'text-red-700',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: 'Total Students',
      value: totalStudents,
      href: '/admin/students',
      color: 'border-primary/20 bg-primary/5',
      valueColor: 'text-primary',
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Overview</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Welcome back, Vaishnavi. Here&apos;s what needs your attention today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className={`block rounded-lg border p-5 ${stat.color} hover:shadow-warm transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              {stat.icon}
              <span className={`font-headline text-3xl font-bold ${stat.valueColor}`}>{stat.value}</span>
            </div>
            <p className="font-body text-sm text-foreground font-medium">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-border p-6 shadow-warm">
          <h2 className="font-headline text-lg font-semibold text-foreground mb-4">Quick actions</h2>
          <div className="space-y-2">
            <Link href="/admin/students?status=pending" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">
                Review pending student approvals
                {pendingCount > 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{pendingCount}</span>}
              </span>
            </Link>
            <Link href="/admin/attendance" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">Mark today&apos;s attendance</span>
            </Link>
            <Link href="/admin/students/new" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors">Add a student directly</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6 shadow-warm">
          <h2 className="font-headline text-lg font-semibold text-foreground mb-4">Coming soon</h2>
          <div className="space-y-2">
            {['Payment collection (Phase 5)', 'Attendance reports', 'Student progress tracking'].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3">
                <span className="w-2 h-2 rounded-full bg-muted flex-shrink-0" />
                <span className="font-body text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
