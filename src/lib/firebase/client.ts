import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
  type AppCheck,
} from 'firebase/app-check'

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

// ── App Check ────────────────────────────────────────────────────────────────
// Gated on NEXT_PUBLIC_RECAPTCHA_SITE_KEY: if the key is unset, App Check is never
// initialized and getAppCheckToken() returns null, so nothing changes until you
// register App Check (reCAPTCHA v3) in the Firebase console and set the key.
let appCheck: AppCheck | undefined

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  // Local dev: reCAPTCHA can't issue tokens on localhost, so use an App Check debug
  // token instead. On first load this prints "App Check debug token: <uuid>" to the
  // console — register it under Firebase Console → App Check → Manage debug tokens.
  // Never enabled in production (would be a bypass).
  if (process.env.NODE_ENV !== 'production') {
    // @ts-expect-error - App Check debug global is not typed on Window
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (err) {
    console.error('[appcheck] client init failed:', err)
  }
}

/**
 * Returns a fresh App Check token to send as the `X-Firebase-AppCheck` header on
 * fetches to our public API routes, or null when App Check isn't configured.
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) return null
  try {
    const result = await getToken(appCheck)
    return result.token
  } catch (err) {
    console.error('[appcheck] getToken failed:', err)
    return null
  }
}
