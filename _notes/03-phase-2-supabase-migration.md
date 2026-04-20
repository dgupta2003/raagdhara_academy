# Phase 2 — Supabase Migration

**Status: ⏳ Pending Phase 1**

---

## What We're Doing

Ripping out Supabase entirely and replacing it with Firebase. The public booking form currently writes to a Supabase PostgreSQL table and calls a Supabase Edge Function to send emails. We're moving both of those to Firestore and a Next.js API route.

---

## Why Remove Supabase Completely?

Two backends means double the things to configure, monitor, and pay for. Since we're adding Firebase for auth + the new dashboards anyway, keeping Supabase alive just for the booking form creates unnecessary complexity. One backend is simpler, cheaper, and easier to understand.

---

## The Three Things Being Migrated

### 1. Booking Form → Firestore

**Before (Supabase):**
```typescript
const { error } = await supabase
  .from('consultation_bookings')
  .insert({ student_name, email, ... })
```

**After (Firebase):**
```typescript
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

await addDoc(collection(db, 'consultations'), {
  studentName, email, ...  // camelCase, not snake_case
  createdAt: serverTimestamp()
})
```

**Mentor note — camelCase vs snake_case:**
SQL databases conventionally use `snake_case` column names (like `student_name`). JavaScript/TypeScript conventionally uses `camelCase` (like `studentName`). Firestore stores JSON-like documents, so we follow the JS convention. You'll see this field name change throughout the migration.

### 2. Email Sending → Next.js API Route

**Before:**
The booking form called `supabase.functions.invoke('send-booking-notification')` — a Deno function hosted on Supabase's servers.

**After:**
The booking form calls `fetch('/api/email/consultation-notification')` — a Next.js API route in our own codebase.

**New file:** `src/app/api/email/consultation-notification/route.ts`

This is a straight port of the Supabase Edge Function logic, just in TypeScript instead of Deno. Same emails, same templates, different runtime.

**Mentor note — what is a Next.js API route?**
Any file at `src/app/api/.../route.ts` becomes an HTTP endpoint. Export a function named `GET`, `POST`, `PUT`, etc. and Next.js serves it at that path. These run on the server (Node.js), so they can safely use secret API keys.

```typescript
// src/app/api/email/consultation-notification/route.ts
export async function POST(request: Request) {
  const { bookingData, type } = await request.json()
  // use Resend SDK here (safe — server-side only)
  return Response.json({ success: true })
}
```

### 3. Email HTML → Template Functions

**New file:** `src/lib/email/templates.ts`

Instead of having raw HTML strings inside the API route (messy and hard to read), we extract them into typed functions:

```typescript
export function consultationCustomerEmail(data: { name: string, date: string }): string {
  return `
    <h1>Hi ${data.name}, your consultation is confirmed!</h1>
    ...
  `
}
```

This keeps the API route clean and makes it easy to add more email types later (welcome email, payment reminder, etc.). We'll keep adding to this file in Phases 3 and 5.

---

## The One-Time Data Migration

**File:** `scripts/migrate-consultations.ts`

This is a script you run exactly once to move existing consultation records from Supabase to Firestore. After it runs and you verify the data, you delete the script.

```
Run script → reads all rows from Supabase → writes each to Firestore consultations collection → log count
```

**Mentor note — why a script instead of doing it in the app?**
Data migrations are one-time operations, not ongoing features. Putting migration logic in a script keeps it separate from the app. You run it, check it, delete it. No migration code clutters the production codebase.

**Important:** Run this script *before* removing Supabase credentials from `.env.local`. After running:
1. Check that Firestore document count matches Supabase row count
2. Spot-check a few records to confirm fields mapped correctly
3. Only then remove Supabase credentials and packages

---

## Files Changed in Phase 2

| File | What happens |
|---|---|
| `src/app/api/email/consultation-notification/route.ts` | **Created** — Next.js port of Supabase Edge Function |
| `src/lib/email/templates.ts` | **Created** — email HTML template functions |
| `scripts/migrate-consultations.ts` | **Created then deleted** — one-time data migration |
| `src/app/free-consultation-booking/components/BookingForm.tsx` | Swap Supabase calls for Firestore + fetch() |
| `src/lib/supabase/client.ts` | **Deleted** |
| `supabase/` directory | **Deleted entirely** |
| `package.json` | Remove `@supabase/supabase-js`, `@supabase/ssr`; add `firebase`, `firebase-admin`, `resend` |

---

## How to Verify It Worked

1. Submit the booking form on the website
2. Open Firebase console → Firestore → `consultations` collection → confirm new document appeared
3. Confirm both emails arrived (customer confirmation + admin notification)
4. Run `grep -r "supabase" src/` — should return nothing
