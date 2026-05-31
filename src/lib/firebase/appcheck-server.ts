import { getAppCheck } from 'firebase-admin/app-check'
import { getAdminApp } from '@/lib/firebase/admin'

/**
 * Verify a Firebase App Check token sent by the client in the `X-Firebase-AppCheck`
 * header. Returns true when the request is allowed.
 *
 * Enforcement is OPT-IN via `APPCHECK_ENFORCE=true`. While that flag is unset (the
 * default), this always returns true — so the App Check code can ship before the
 * reCAPTCHA key + console registration exist, without breaking the public endpoints.
 * Flip the flag on only after the client is sending tokens.
 */
export async function verifyAppCheck(request: Request): Promise<boolean> {
  if (process.env.APPCHECK_ENFORCE !== 'true') return true

  const token = request.headers.get('X-Firebase-AppCheck')
  if (!token) return false

  try {
    await getAppCheck(getAdminApp()).verifyToken(token)
    return true
  } catch (err) {
    console.error('[appcheck] token verification failed:', err)
    return false
  }
}
