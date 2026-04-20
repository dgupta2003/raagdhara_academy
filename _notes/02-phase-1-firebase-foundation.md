# Phase 1 — Firebase Foundation

**Status: 🔜 Next up**

This phase replaces Supabase with Firebase and builds the auth system that everything else depends on. Nothing in Phases 2–5 can be built until this is done.

---

## What We're Building

1. Firebase client + Admin SDK setup
2. All TypeScript types for the database
3. Session-based authentication (login, register, logout)
4. Route protection middleware (guards `/admin` and `/student`)
5. Login and registration pages

---

## Key Concept: Two Firebase SDKs

This trips up a lot of developers. Firebase has **two entirely different SDKs** and you use them in different places:

| SDK | Where it runs | What it can do |
|---|---|---|
| **Client SDK** (`firebase`) | Browser (user's computer) | Auth sign-in, read/write Firestore (limited by security rules) |
| **Admin SDK** (`firebase-admin`) | Server only (Next.js API routes, Server Components) | Full database access, bypass security rules, create/delete users |

**Why the split?**
The Admin SDK has a private service account key — if it ran in the browser, any visitor could steal it and have full admin access to your database. So it only ever runs on the server, where users can't see it.

In our code:
- `src/lib/firebase/client.ts` → Client SDK (used in components, contexts)
- `src/lib/firebase/admin.ts` → Admin SDK (used in API routes and Server Components only)

---

## Key Concept: How Auth Works in Next.js App Router

Here's the flow we're implementing:

```
User logs in (browser)
  → Firebase Auth verifies email/password
  → Browser gets a short-lived Firebase ID token (1 hour)
  → Browser POSTs that token to our server: POST /api/auth/session
  → Server verifies the token with Admin SDK
  → Server creates a session cookie (5 days) and sends it back
  → Browser stores the cookie automatically

On every subsequent request:
  → Browser sends the cookie automatically (that's what cookies do)
  → Middleware reads the cookie
  → Protected pages are served or the user is redirected to login
```

**Why session cookies instead of storing the token in localStorage?**
Storing auth tokens in `localStorage` is a security risk — any JavaScript on the page can read it (XSS attacks). An `HttpOnly` cookie cannot be read by JavaScript at all; only the browser sends it automatically. Much safer.

---

## Key Concept: Next.js Middleware

`src/middleware.ts` is a special file that Next.js runs **before** serving any page. Think of it as a bouncer at the door.

```typescript
// Rough logic:
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!sessionCookie) redirect to /auth/login
    if (role !== 'admin') redirect to /homepage
  }

  if (request.nextUrl.pathname.startsWith('/student')) {
    if (!sessionCookie) redirect to /auth/login
    if (role !== 'student') redirect to /homepage
  }
}
```

**Important gotcha — Edge Runtime:**
Next.js middleware runs in the "Edge Runtime" by default — a stripped-down JavaScript environment (no Node.js APIs). Firebase Admin SDK requires Node.js and **cannot** run in the Edge Runtime.

The solution: middleware only checks if the cookie *exists*. The full cryptographic verification (`adminAuth.verifySessionCookie()`) happens inside each protected layout (Server Components, which run in Node.js).

---

## The Firestore Data Model

### Why Firestore (NoSQL) vs a SQL database?

Firestore stores data as **documents** (like JSON objects) grouped into **collections**. There are no tables, no joins, no foreign keys.

For our use case:
- Student profiles, attendance records, and payments are naturally document-shaped
- We'll almost always read one student's data at a time (not complex cross-table queries)
- Firebase's real-time listeners are useful for the admin attendance page (updates without refresh)

The main tradeoff: NoSQL doesn't enforce strict relationships between documents — we have to manage that in code. For example, deleting a student doesn't automatically delete their attendance records; we'd have to do that ourselves.

### Our Collections

**`users/{uid}`** — uid is the Firebase Auth user ID. This is our role directory.
```
{
  email: "student@example.com",
  role: "student",              // or "admin"
  studentId: "abc123",          // links to the students collection
  createdAt: Timestamp
}
```

**Why a separate `users` collection if Firebase Auth already stores users?**
Firebase Auth only stores basic info (email, display name). It doesn't know about roles or which student profile a user is linked to. The `users` collection is our extension of Auth.

**`students/{studentId}`**
```
{
  uid: "firebase-auth-uid",
  email, displayName, phone, countryCode,
  category: "india" | "nri",
  nriCurrencyPreference: "usd" | "inr-equivalent",
  courseId, batchType,
  status: "pending" | "active" | "inactive",
  enrollmentDate: Timestamp,
  customFeeOverride: 150000,    // in paise (₹1500.00) — always store money as integers!
  paymentDueDayOverride: 5,     // override global default payment day
  createdAt, updatedAt: Timestamp
}
```

**Why store money as integers (paise/cents)?**
Never store money as floats. `0.1 + 0.2 = 0.30000000000000004` in JavaScript. Storing ₹1500 as `150000` paise means all math is integer math — exact, no surprises.

**`attendance/{auto-id}`**
```
{
  studentId: "abc123",
  sessionDate: Timestamp,
  courseId: "hindustani-vocal",
  batchType: "morning",
  status: "present" | "absent" | "excused",
  markedBy: "admin-uid",
  markedAt: Timestamp
}
```

**`payments/{auto-id}`**
```
{
  studentId: "abc123",
  amount: 150000,               // in paise (INR) or cents (USD)
  currency: "INR" | "USD",
  razorpayOrderId: "order_xxx",
  razorpayPaymentId: "pay_xxx",
  status: "pending" | "sent" | "paid" | "overdue",
  dueDate: Timestamp,
  paidAt: Timestamp,
  reminderSentAt: Timestamp,
  createdAt, updatedAt: Timestamp
}
```

**`consultations/{auto-id}`** — migrated from Supabase, same fields

**`settings/global`** — single document, holds all configurable values
```
{
  defaultPaymentDay: 1,         // 1st of every month
  indiaFees: {
    normal: 150000,             // ₹1500
    special: 200000,            // ₹2000
    personal: 300000            // ₹3000
  },
  nriFees: {
    usd: { normal: 2000, special: 2500, personal: 4000 },       // cents
    inrEquivalent: { normal: 165000, special: 210000, personal: 335000 }
  },
  reminderDaysAfterDue: 3,
  updatedAt: Timestamp
}
```

---

## Firestore Security Rules

Security rules decide who can read/write each collection. They run on Firebase's servers — not in your app.

```javascript
// users: read your own doc or admin reads any
match /users/{uid} {
  allow read: if request.auth.uid == uid || isAdmin();
  allow create: if request.auth.uid == uid;  // self-registration
  allow update: if isAdmin();
}

// students: admin full access; student reads own profile only
match /students/{studentId} {
  allow read: if isAdmin() || isOwnStudentDoc(studentId);
  allow create: if isAuthenticated();
  allow update, delete: if isAdmin();
}

// attendance: admin writes; student reads own records
match /attendance/{id} {
  allow read: if isAdmin() || isOwnStudent(resource.data.studentId);
  allow write: if isAdmin();
}

// payments: same pattern as attendance
// consultations: anyone can create (public booking form); admin reads
// settings: authenticated users read; only admin writes
```

**Why do this instead of just checking in the app?**
Security rules are enforced by Firebase's servers. Even if someone bypasses your app entirely and hits the Firestore API directly (e.g., using curl or the Firebase console), the rules still apply. Never rely solely on app-level checks for sensitive data.

---

## Student Registration Flow

```
Student visits /auth/register
  → Fills name, email, password, phone, course interest
  → createUserWithEmailAndPassword() creates Firebase Auth account
  → Write users/{uid} = { role: 'student', ... }
  → Write students/{uid} = { status: 'pending', ... }
  → Show: "Your registration is pending approval"

Admin sees new student in /admin/students with "Pending" badge
  → Clicks Approve
  → POST /api/admin/students/{id}/approve
  → Sets students/{id}.status = 'active'
  → Sends welcome email via Resend

Student receives welcome email, can now log in and see their dashboard
```

---

## Files Being Created in Phase 1

| File | What it does |
|---|---|
| `src/lib/firebase/client.ts` | Firebase browser SDK — one instance shared across the app |
| `src/lib/firebase/admin.ts` | Firebase Admin SDK — server only, full DB access |
| `src/lib/firebase/types.ts` | TypeScript interfaces for every Firestore document shape |
| `src/lib/firebase/converters.ts` | Type-safe Firestore read/write helpers |
| `src/app/api/auth/session/route.ts` | POST: ID token → session cookie; DELETE: logout |
| `src/app/(auth)/layout.tsx` | Centered auth layout (no Header/Footer) |
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(auth)/register/page.tsx` | Student self-registration page |
| `src/middleware.ts` | Route protection (runs before every request) |
| `src/components/auth/LoginForm.tsx` | Login form component |
| `src/components/auth/RegisterForm.tsx` | Registration form component |
| `src/contexts/AuthContext.tsx` | **Rewritten** — Firebase Auth replacing Supabase Auth |

---

## Setup Checklist Before Coding

- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable **Firestore** (start in production mode)
- [ ] Enable **Firebase Auth** → Email/Password provider
- [ ] Enable **Cloud Functions** (requires Blaze/pay-as-you-go plan)
- [ ] Generate a **service account key** (Project Settings → Service Accounts → Generate new private key)
- [ ] Copy Firebase config values (Project Settings → General → Your apps → Web app)
- [ ] Add all values to `.env.local`
