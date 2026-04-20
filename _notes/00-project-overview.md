# Raagdhara Academy — Project Overview

## What This Project Is

A website for an Indian classical vocal music academy. Currently it:
- Gives the academy an online presence (marketing)
- Lets potential students book a free consultation

What we're adding:
- A **teacher (admin) dashboard** for attendance tracking, payment management, and automated billing
- A **student dashboard** for viewing attendance history and paying fees

---

## Tech Stack (Current → Final)

| Layer | Before | After |
|---|---|---|
| Framework | Next.js 14, TypeScript, Tailwind | Same |
| Database | Supabase (PostgreSQL) | Firebase Firestore |
| Auth | Supabase Auth | Firebase Auth |
| Email | Resend (via Supabase Edge Function) | Resend (via Next.js API routes) |
| Payments | None | Razorpay |
| Hosting | Netlify | Netlify (Next.js app) + Firebase (Cloud Functions) |

---

## Why These Technology Choices

### Firebase over Supabase
Supabase is great, but Firebase gives us Cloud Functions with native scheduled triggers — which we need for automated monthly payment reminders. Firebase also has a tighter ecosystem for Auth + Firestore + Functions together, which keeps the backend simple.

### Resend for emails
Already partially integrated. Clean API, great deliverability, generous free tier. The existing Supabase Edge Function gets ported to a Next.js API route — same logic, simpler location.

### Razorpay for payments
Supports INR natively (India students) and can handle USD for international (NRI students). Widely used in India, your sister's students will already be familiar with it.

### Next.js App Router
Already in use. The `(admin)` and `(student)` route groups let us add entire new sections of the app without touching the existing public pages at all.

---

## Two Student Types

| Type | Currency | Notes |
|---|---|---|
| India | INR | Standard Indian pricing |
| NRI | USD (default) | Can opt to pay INR-equivalent instead (USD wire transfers are expensive) |

Sister sets the student type in the admin dashboard. NRI students can toggle their currency preference themselves on the student payment page.

---

## Phase Roadmap

| Phase | What | Status |
|---|---|---|
| 0 | Bug fixes — footer consolidation, metadata, console logs | ✅ Done |
| 1 | Firebase foundation — Auth, Firestore, middleware, login/register pages | 🔜 Next |
| 2 | Supabase migration — port booking form, migrate data, remove Supabase | |
| 3 | Admin dashboard — students, attendance, payments, settings | |
| 4 | Student dashboard — attendance history, payment history, pay now | |
| 5 | Payment system — Razorpay orders, webhooks, automated scheduling | |

---

## Environment Variables Needed

### Firebase (client-side — safe to expose, prefixed NEXT_PUBLIC_)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Firebase Admin (server-side only — never expose)
```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

### Services
```
RESEND_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID   (safe to expose — used in browser checkout)
```

### Existing (keep)
```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
NEXT_PUBLIC_CALENDLY_URL       (move hardcoded URL here)
```
