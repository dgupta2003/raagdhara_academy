# Phase 1 — Concepts & Reasoning

## Why we use React Context for auth

React Context is how you share state (like "who's logged in?") across your whole component tree without passing props down every level. Without it, you'd have to pass `user` and `userRole` as props to every component that needs them — which gets unwieldy fast.

`AuthContext` is the single source of truth for:
- The current Firebase Auth user object
- Their role (`admin` or `student`) — fetched from Firestore `users/{uid}`
- Their full student profile — fetched from Firestore `students/{uid}` (only for students)
- A `loading` boolean so the UI doesn't flash the wrong state on first render

Any component in the app can call `useAuth()` to access these — no prop drilling.

---

## Why we use server-side session cookies instead of client-side persistence

Firebase gives you two ways to keep a user logged in:

**Option A — Client-side persistence (Firebase default)**
- Stores the auth token in `localStorage` or `IndexedDB`
- Works fine for SPAs, but the server has no idea if the user is logged in until the client JS runs
- Problem: if you hit `/student/dashboard` directly, the server renders the page before knowing if you're authenticated — leads to flashes, unauthorized data exposure, or awkward redirects

**Option B — Server-side session cookies (what we use)**
- After login, we take Firebase's short-lived ID token and trade it for a 5-day HttpOnly cookie via `POST /api/auth/session`
- HttpOnly means JavaScript can't read or steal this cookie (XSS protection)
- `Secure` means it only travels over HTTPS
- Because it's a real cookie, it's sent automatically with every request — the server always knows the login state before sending any HTML
- The middleware and server layouts can check it server-side

**The trade-off:** Slightly more setup (the session API route + cookie management). Worth it for a multi-route app where some pages are admin-only.

---

## The Edge Runtime constraint — why middleware can't use Firebase Admin

Next.js middleware runs at the "edge" — a globally distributed layer that intercepts requests before they reach your server. It's extremely fast and runs close to the user geographically.

The catch: the edge runtime is a stripped-down environment (like a Service Worker) that only has Web APIs — `fetch`, `Request`, `Response`, `URL`, `crypto`. It does **not** have Node.js APIs like `fs`, `net`, or `buffer`.

Firebase Admin SDK depends on Node.js internals (it's designed to run on a full Node server). So you **cannot** `import` Firebase Admin in `middleware.ts` — the build will fail or crash at runtime.

**Our solution:**
- Middleware does a lightweight check: "is the `session` cookie present?"
- If yes → let the request through
- If no → redirect to `/auth/login`

This stops unauthenticated users from even reaching protected routes. But it doesn't cryptographically verify the cookie — a determined attacker could forge a cookie value and pass the check.

**The full verification** (`adminAuth.verifySessionCookie()`) happens in each protected layout or API route, which runs in the full Node.js runtime. If the cookie is forged or expired, the layout rejects it there.

So security is: middleware as the fast outer gate (presence check), server layout as the rigorous inner gate (cryptographic verification).

---

## Why `signIn` returns the role

Inside `AuthContext`, we use `onAuthStateChanged` — a Firebase listener that fires whenever auth state changes. After a successful `signInWithEmailAndPassword`, this listener fires and we fetch the user's role from Firestore.

But here's the timing problem: `signIn` resolves before `onAuthStateChanged` has finished fetching the Firestore role. So in `LoginForm`, if you tried:

```typescript
await signIn(email, password);
// ❌ userRole might still be null here — onAuthStateChanged hasn't updated state yet
router.push(userRole === 'admin' ? '/admin' : '/student');
```

You'd always push to `/student` even for admins.

**The fix:** `signIn` in `AuthContext` also reads the role from Firestore directly before returning, and returns it:

```typescript
// ✅ signIn returns the role it just fetched
const role = await signIn(email, password);
router.push(role === 'admin' ? '/admin' : '/student');
```

The `onAuthStateChanged` listener will also fire and update context state eventually — that's fine, it's idempotent (doing it twice doesn't break anything). But the LoginForm doesn't have to wait for it.

---

## Why `src/app/auth/` and not `src/app/(auth)/`

Next.js "route groups" use parentheses — `(auth)` — purely for code organization. They don't affect the URL. So `src/app/(auth)/login/page.tsx` maps to `/login`, not `/auth/login`.

Our `Header.tsx` already has a "Student Login" button pointing to `/auth/login` (added in Phase 0). If we used a route group, the URL would be `/login` — that link would 404.

So we use a regular folder `src/app/auth/` which maps to `/auth/*` as expected. The layout at `src/app/auth/layout.tsx` applies to all `/auth/*` routes, giving us the centered card UI without Header/Footer.

---

## The `nriCurrencyPreference` default on registration

The `Student` interface in `types.ts` requires `nriCurrencyPreference: 'usd' | 'inr-equivalent'`. It's not optional.

When a student registers, we don't ask for their currency preference (keeping the form simple). So we default it:
- India students → `'inr-equivalent'` (they always pay in INR)
- NRI students → `'usd'` (most common NRI preference)

They can change this later from their student dashboard profile settings (Phase 4).

---

## The `User` type name collision

`firebase/auth` exports a type called `User` (the logged-in user object with uid, email, getIdToken, etc.).

Our `src/lib/firebase/types.ts` also exports an interface called `User` (the Firestore document shape: `{ email, role, studentId, createdAt }`).

Both are needed in `AuthContext.tsx`. To avoid a naming conflict, we import them with aliases:

```typescript
import { User as FirebaseUser } from 'firebase/auth';
import type { User as FirestoreUser, Student } from '@/lib/firebase/types';
```

`FirebaseUser` is what gets stored in React state (it has `.uid`, `.getIdToken()`, etc.).
`FirestoreUser` is what we read from Firestore to get the role.
