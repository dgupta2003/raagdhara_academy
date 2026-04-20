# Raagdhara Academy — Full Implementation Plan

## Context
This plan covers two things in sequence:
1. Fix the known bugs in the existing public website
2. Add a teacher admin dashboard + student dashboard with attendance tracking, automated payments (Razorpay), and email automation (Resend)

**Confirmed decisions:**
- Full migration from Supabase → Firebase (Firestore + Firebase Auth)
- Students self-register; sister approves in dashboard
- Payments: automated monthly on a configurable date (global default + per-student override); sister can also trigger manually; fee amount overrideable per student
- Attendance: sister marks manually per session from admin dashboard
- Email: Resend (moving from Supabase Edge Function → Next.js API routes)
- Payment gateway: Razorpay (INR for India students; USD or INR-equivalent for NRI students)

---

## Phase 0 — Bug Fixes (do first, self-contained)

**New file:**
- `src/components/common/Footer.tsx` — single shared footer (base: homepage version, `text-primary-foreground`, uses `<Link>` for all internal nav)

**Modify:**
- `src/app/layout.tsx` — fix metadata (currently says "Next.js with Tailwind CSS")
- `src/app/not-found.tsx` — add `<Footer />`
- `src/app/contact-and-connect/page.tsx` — remove commented-out `ContactFormSection` and `LocationSection`
- `src/app/free-consultation-booking/components/BookingForm.tsx` — remove 6 console.log/warn/error calls
- `src/app/courses-and-offerings/page.tsx` — replace inline footer with `<Footer />`, replace `<a>` with `<Link>`
- `src/app/free-consultation-booking/page.tsx` — replace inline footer with `<Footer />`
- `src/app/homepage/components/HomepageInteractive.tsx` — import Footer from `@/components/common/Footer`
- `src/components/common/Header.tsx` — add "Student Login" link pointing to `/auth/login`

**Delete:**
- `src/app/homepage/components/Footer.tsx`
- `src/app/contact-and-connect/components/Footer.tsx`

---

## Phase 1 — Firebase Foundation

**Install:** `firebase`, `firebase-admin`, `resend`, `razorpay`  
**Remove:** `@supabase/supabase-js`, `@supabase/ssr`

### New files:
- `src/lib/firebase/client.ts` — browser SDK (`getApps()` guard, exports `auth`, `db`, `app`)
- `src/lib/firebase/admin.ts` — Admin SDK (server-only, exports `adminDb`, `adminAuth`)
- `src/lib/firebase/types.ts` — all Firestore TypeScript interfaces (see below)
- `src/lib/firebase/converters.ts` — typed Firestore withConverter helpers
- `src/app/api/auth/session/route.ts` — POST: verifies ID token → creates 5-day session cookie; DELETE: clears cookie
- `src/app/(auth)/layout.tsx` — centered card layout, no Header/Footer
- `src/app/(auth)/login/page.tsx` — email/password login, redirects by role
- `src/app/(auth)/register/page.tsx` — student self-registration, creates `users/{uid}` (role=student) + `students/{uid}` (status=pending)
- `src/middleware.ts` — protects `/admin/*` and `/student/*` routes via session cookie
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/contexts/AuthContext.tsx` — **full rewrite** from Supabase to Firebase Auth; exposes `user`, `userRole`, `studentProfile`, `loading`, `signIn`, `signOut`

### Firestore Data Model

**`students/{uid}`**
```
email, displayName, phone, countryCode
category: 'india' | 'nri'
nriCurrencyPreference: 'usd' | 'inr-equivalent'
courseId, batchType
status: 'pending' | 'active' | 'inactive'
enrollmentDate, customFeeOverride, paymentDueDayOverride
createdAt, updatedAt
```

**`attendance/{id}`**
```
studentId, sessionDate, courseId, batchType
status: 'present' | 'absent' | 'excused'
markedBy, markedAt
```

**`payments/{id}`**
```
studentId, amount, currency: 'INR' | 'USD'
razorpayOrderId, razorpayPaymentId
status: 'pending' | 'sent' | 'paid' | 'overdue'
dueDate, paidAt, paymentLink, reminderSentAt
createdAt, updatedAt
```

**`consultations/{id}`** — migrated from Supabase (same fields, camelCase)

**`settings/global`**
```
defaultPaymentDay: 1–28
indiaFees: { normal, special, personal }  // INR paise
nriFees: { usd: {...}, inrEquivalent: {...} }
reminderDaysAfterDue: number
```

**`users/{uid}`** — `email`, `role: 'admin' | 'student'`, `studentId`

### Firestore Security Rules
- `users`: read own doc or admin; create if own UID (self-registration)
- `students`: read if admin or own studentId; create if authenticated; update/delete admin only
- `attendance`: read if admin or own studentId; write admin only
- `payments`: read if admin or own studentId; write admin only (webhook uses Admin SDK, bypasses rules)
- `consultations`: public create; admin read/write
- `settings`: authenticated read; admin write

**Middleware gotcha:** Firebase Admin SDK cannot run in Next.js Edge Runtime. Use lightweight cookie-presence check in middleware; do full `verifySessionCookie()` verification inside each protected Server Component layout.

---

## Phase 2 — Supabase Migration

**New files:**
- `src/app/api/email/consultation-notification/route.ts` — port of Supabase Edge Function; uses Resend SDK directly
- `src/lib/email/templates.ts` — typed HTML template functions (starts with consultation templates)
- `scripts/migrate-consultations.ts` — one-time script: reads Supabase `consultation_bookings` → writes to Firestore `consultations`; delete after use

**Modify:**
- `src/app/free-consultation-booking/components/BookingForm.tsx` — replace `supabase.from('consultation_bookings').insert()` with Firestore `addDoc`; replace `supabase.functions.invoke()` with `fetch('/api/email/consultation-notification')`

**Delete:**
- `src/lib/supabase/client.ts`
- `supabase/` directory (entire)

---

## Phase 3 — Admin Dashboard

Route group: `src/app/(admin)/`

**New pages:**
- `(admin)/layout.tsx` — verifies admin session cookie server-side; renders `<AdminSidebar />` + children
- `(admin)/admin/page.tsx` — overview: active students, pending approvals, unpaid invoices, today's sessions
- `(admin)/admin/students/page.tsx` — student list with filters (category, status, course)
- `(admin)/admin/students/new/page.tsx` — admin creates student directly (bypasses self-registration)
- `(admin)/admin/students/[studentId]/page.tsx` — edit student: category, fee override, payment day override, approve/deactivate
- `(admin)/admin/attendance/page.tsx` — select date + batch → mark each student present/absent/excused
- `(admin)/admin/payments/page.tsx` — all payment records by status; manual trigger button per student
- `(admin)/admin/settings/page.tsx` — global payment day, fee structure, reminder schedule

**New shared components:**
- `src/components/dashboard/AdminSidebar.tsx`
- `src/components/dashboard/StatsCard.tsx`
- `src/components/dashboard/DataTable.tsx`
- `src/components/dashboard/AttendanceGrid.tsx`
- `src/components/dashboard/PaymentStatusBadge.tsx`
- `src/components/dashboard/StudentTypeTag.tsx`

**New API routes:**
- `api/admin/students/route.ts` — POST (create), GET (list)
- `api/admin/students/[studentId]/route.ts` — PUT (update), DELETE (deactivate)
- `api/admin/students/[studentId]/approve/route.ts` — POST: set status=active, send welcome email
- `api/admin/attendance/route.ts` — POST: batch-write attendance records
- `api/email/student-welcome/route.ts` — sends welcome email via Resend

**Add to `src/lib/email/templates.ts`:**
- `studentWelcomeEmail()`

---

## Phase 4 — Student Dashboard

Route group: `src/app/(student)/`

**New pages:**
- `(student)/layout.tsx` — verifies student session; renders `<StudentSidebar />` + children
- `(student)/student/page.tsx` — overview: upcoming payment, recent attendance, course info
- `(student)/student/attendance/page.tsx` — full attendance history, present/total percentage
- `(student)/student/payments/page.tsx` — all invoices with status; "Pay Now" button; NRI currency toggle

**New components:**
- `src/components/dashboard/StudentSidebar.tsx`
- `src/components/dashboard/NriCurrencyToggle.tsx` — for NRI students: toggle USD ↔ INR-equivalent; updates Firestore `nriCurrencyPreference`

---

## Phase 5 — Payment System

**Install:** `razorpay` (Node SDK, server-side only)

**New API routes:**
- `api/payments/create-order/route.ts` — determines amount/currency by student category + preference; creates Razorpay order; writes `payments` doc (status=sent); sends payment request email
- `api/payments/webhook/route.ts` — validates Razorpay HMAC signature; on `payment.captured`: updates payment to status=paid, sends confirmation email; idempotent (check before update)
- `api/payments/verify/route.ts` — client-side UX confirmation only (not authoritative)
- `api/admin/payments/manual-trigger/route.ts` — admin triggers payment request for any student
- `api/admin/payments/reminder/route.ts` — finds overdue unpaid payments; sends reminder emails

**New component:**
- `src/components/payments/RazorpayCheckout.tsx` — loads Razorpay JS via `<Script>`; opens checkout on button click; calls `/api/payments/verify` on success

**Firebase Cloud Function (scheduled trigger):**
- `functions/src/scheduledPayments.ts` — runs daily 9 AM IST (`0 3 * * *` UTC); finds students whose payment day matches today (global or per-student override); creates Razorpay orders + sends emails
- `functions/src/index.ts`
- `functions/package.json` — Node 18, firebase-admin, firebase-functions, razorpay, resend

**Add to `src/lib/email/templates.ts`:**
- `paymentRequestEmail()`
- `paymentReminderEmail()`
- `paymentConfirmationEmail()`

---

## Implementation Order

```
Phase 0 (bugs) → Phase 1 (Firebase) → Phase 2 (migrate Supabase) → Phase 3 (admin) → Phase 4 (student) → Phase 5 (payments)
~2h               ~1 day               ~0.5 day                      ~3 days           ~2 days             ~2 days
```

Phases 3 and 4 can be partially parallelized once Phase 1 is done.

---

## Prerequisites / Setup Required

Before coding begins, the following must be provisioned:
1. **Firebase project** — create at console.firebase.google.com; enable Firestore, Firebase Auth (email/password), Cloud Functions (requires Blaze plan for scheduled triggers)
2. **Razorpay** — enable international payments if NRI USD is needed (confirm availability); set up webhook endpoint URL
3. **Resend** — verify sending domain; create API key
4. **`.env.local`** — add all Firebase client + admin vars, Razorpay key+secret, Resend API key, Razorpay webhook secret

---

## Risks & Gotchas

| Risk | Mitigation |
|------|-----------|
| Firebase Admin SDK incompatible with Edge Runtime | Do cookie-presence check in middleware; full verification in Server Component layouts |
| Firebase Cloud Functions require Blaze (paid) plan | Confirm before building scheduled trigger; fallback: use a Vercel cron job calling a Next.js API route |
| Razorpay USD may need international gateway enabled | Check Razorpay dashboard before building NRI USD flow |
| NRI currency preference change invalidates open orders | Cancel existing Razorpay order + recreate in new currency when preference changes |
| Supabase migration: run before removing credentials | Run `scripts/migrate-consultations.ts`, verify doc count matches row count, then delete Supabase |
| Webhook can fire multiple times | Implement idempotency: check `payments.status !== 'paid'` before updating |
| `AuthContext` typed as `any` currently | Define proper `AuthContextType` on rewrite; fix consuming components as type errors surface |

---

## Verification Plan (end-to-end per phase)

- **Phase 0:** All 4 public pages render identical footer; 404 has footer; no console output on form submit; page title correct in browser tab
- **Phase 1:** Register student → Firestore `users` + `students` docs created; admin login → session cookie set; `/admin` redirects unauthenticated users to login
- **Phase 2:** Submit booking form → Firestore `consultations` doc created; both emails arrive; `grep -r "supabase" src/` returns nothing
- **Phase 3:** Admin approves student → status=active in Firestore + welcome email sent; admin marks attendance → `attendance` docs created; settings saved → `settings/global` updated
- **Phase 4:** Student logs in → sees attendance history; sees payment invoices; NRI toggle saves preference to Firestore
- **Phase 5:** Admin triggers payment → Firestore `payments` doc + email sent; student clicks Pay Now → Razorpay checkout opens; test payment completes → webhook fires → status=paid + confirmation email; scheduled function fires on correct date
