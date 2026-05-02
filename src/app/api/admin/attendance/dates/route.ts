import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return false;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    return userDoc.exists && userDoc.data()?.role === 'admin';
  } catch {
    return false;
  }
}

// GET /api/admin/attendance/dates?month=YYYY-MM
// Returns all attendance records for the month so the client can derive
// highlighted dates per batch/subgroup filter.
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 });
  }

  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate(); // days in month
  const start = `${month}-01`;
  const end = `${month}-${String(lastDay).padStart(2, '0')}`;

  // Single-field range query — no composite index needed
  const snap = await adminDb
    .collection('attendance')
    .where('sessionDate', '>=', start)
    .where('sessionDate', '<=', end)
    .get();

  const records = snap.docs.map((d) => {
    const data = d.data();
    return {
      studentId: data.studentId as string,
      sessionDate: data.sessionDate as string,
      batchType: data.batchType as string,
    };
  });

  return NextResponse.json({ records });
}
