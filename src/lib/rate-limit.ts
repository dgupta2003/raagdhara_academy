import { adminDb } from '@/lib/firebase/admin'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * Fixed-window rate limiter backed by Firestore (`rateLimits/{key}`). Works across
 * Cloud Run instances (in-memory counters would not). Uses a transaction so concurrent
 * requests can't race past the limit.
 *
 * Fail-open: if the Firestore transaction errors, the request is allowed — these guard
 * public convenience endpoints, so an infra blip must never lock out legitimate users.
 *
 * `rateLimits` is server-only: no security rule matches it, so clients are denied by
 * Firestore's default-deny. Each doc carries `expiresAt`; set a Firestore TTL policy on
 * that field to auto-purge old counters.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const ref = adminDb.collection('rateLimits').doc(encodeKey(key))
  const now = Date.now()

  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data()
      const windowStart: number = data?.windowStart ?? 0
      const count: number = data?.count ?? 0

      // Still inside the current window
      if (now - windowStart < windowMs) {
        if (count >= limit) {
          const retryAfterSec = Math.ceil((windowStart + windowMs - now) / 1000)
          return { allowed: false, remaining: 0, retryAfterSec }
        }
        tx.set(
          ref,
          { count: count + 1, windowStart, expiresAt: new Date(windowStart + windowMs) },
          { merge: true },
        )
        return { allowed: true, remaining: limit - count - 1, retryAfterSec: 0 }
      }

      // Window expired (or first request) — start a fresh window
      tx.set(ref, { count: 1, windowStart: now, expiresAt: new Date(now + windowMs) })
      return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
    })
  } catch (err) {
    console.error('[rate-limit] transaction failed, failing open for key:', key, err)
    return { allowed: true, remaining: limit, retryAfterSec: 0 }
  }
}

/**
 * Best-effort client IP from the `x-forwarded-for` header. Behind Firebase App Hosting /
 * Cloud Run this carries the caller IP. The leftmost entry is client-supplied and can be
 * spoofed, so this is abuse-mitigation, not a hard security control — App Check is the
 * stronger gate once enabled.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for') ?? ''
  const first = xff.split(',')[0]?.trim()
  return first || request.headers.get('x-real-ip')?.trim() || 'unknown'
}

// Firestore doc IDs cannot contain '/' and are capped at 1500 bytes.
function encodeKey(key: string): string {
  return key.replace(/\//g, '_').slice(0, 1400)
}
