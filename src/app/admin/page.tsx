import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

function timeAgo(ts: { seconds: number } | string | Date | null): string {
  if (!ts) return '—';
  const seconds = typeof ts === 'object' && 'seconds' in ts
    ? ts.seconds
    : Math.floor(new Date(ts as string | Date).getTime() / 1000);
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

  const [studentsSnap, paymentsSnap, loginAuditSnap] = await Promise.all([
    adminDb.collection('students').get(),
    adminDb.collection('payments').where('status', 'in', ['pending', 'sent', 'overdue']).get(),
    adminDb.collection('loginAudit').orderBy('loginAt', 'desc').limit(20).get(),
  ]);

  const students = studentsSnap.docs.map((d) => d.data());
  const activeCount = students.filter((s) => s.status === 'active').length;
  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const unpaidCount = paymentsSnap.size;

  const recentLogins = loginAuditSnap.docs.map((d) => {
    const data = d.data();
    return {
      email: data.email as string,
      role: data.role as string,
      loginAt: data.loginAt as { seconds: number } | null,
    };
  });

  return { activeCount, pendingCount, unpaidCount, totalStudents: students.length, uid, recentLogins };
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border border-primary/20',
  student: 'bg-green-50 text-green-700 border border-green-200',
  parent: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

export default async function AdminOverviewPage() {
  const { activeCount, pendingCount, unpaidCount, totalStudents, recentLogins } = await getOverviewStats();

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-6 shadow-warm">
          <h2 className="font-headline text-lg font-semibold text-foreground mb-4">Quick actions</h2>
          <div className="space-y-2">
            <Link href="/admin/students?status=pending" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-contemplative group">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-contemplative">
                Review pending student approvals
                {pendingCount > 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{pendingCount}</span>}
              </span>
            </Link>
            <Link href="/admin/attendance" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-contemplative group">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-contemplative">Mark today&apos;s attendance</span>
            </Link>
            <Link href="/admin/students/new" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-contemplative group">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-contemplative">Add a student directly</span>
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-warm">
          <h2 className="font-headline text-lg font-semibold text-foreground mb-4">Payments</h2>
          <div className="space-y-2">
            <Link href="/admin/payments" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-contemplative group">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-contemplative">
                View unpaid invoices
                {unpaidCount > 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{unpaidCount}</span>}
              </span>
            </Link>
            <Link href="/admin/payments" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-contemplative group">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-contemplative">Generate this month&apos;s invoices</span>
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-contemplative group">
              <span className="w-2 h-2 rounded-full bg-muted flex-shrink-0" />
              <span className="font-body text-sm text-foreground group-hover:text-primary transition-contemplative">Manage fee settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Logins */}
      <div className="bg-card rounded-lg border border-border shadow-warm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-headline text-lg font-semibold text-foreground">Recent Logins</h2>
          <p className="font-body text-xs text-muted-foreground mt-0.5">Last 20 portal sign-ins across all users</p>
        </div>
        {recentLogins.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground px-6 py-4">No logins recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentLogins.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium capitalize ${ROLE_BADGE[entry.role] ?? ROLE_BADGE.student}`}>
                    {entry.role}
                  </span>
                  <span className="font-body text-sm text-foreground">{entry.email}</span>
                </div>
                <span className="font-body text-xs text-muted-foreground flex-shrink-0 ml-4">
                  {timeAgo(entry.loginAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
