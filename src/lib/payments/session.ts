import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

export async function getCallerUid(): Promise<string | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie)
    return decoded.uid
  } catch (err) {
    console.error('[payments] session verification failed:', err)
    return null
  }
}
