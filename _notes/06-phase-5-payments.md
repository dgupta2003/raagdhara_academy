# Phase 5 — Payment System

**Status: ⏳ Pending Phases 1–4**

This phase wires together Razorpay (payment gateway), Firebase (data), and Resend (emails) into a complete payment automation system.

---

## How Razorpay Works (Overview)

Razorpay uses an **order-based flow**:

```
1. Your server creates an Order (Razorpay generates an order ID)
2. Your frontend opens the Razorpay checkout popup using that order ID
3. Student enters card/UPI/bank details in the popup
4. Razorpay processes the payment
5. Razorpay sends a webhook to your server: "payment.captured"
6. Your server marks the invoice as paid, sends confirmation email
```

You never handle raw card data — Razorpay's popup does that. Your server only deals with order IDs and payment IDs.

---

## The Three Types of Payment Triggers

### A) Automated Monthly Trigger (Firebase Cloud Function)
Runs daily at 9 AM IST. Checks: "which students have their payment day = today?" For each match, creates a Razorpay order and sends a payment request email.

**Why a Firebase Cloud Function and not a Next.js cron?**
Next.js/Netlify cron jobs are HTTP-triggered — a scheduler hits a URL at a set time. They work, but they add complexity (the URL needs auth, the job needs to handle cold starts, etc.). Firebase Cloud Functions with `onSchedule` are designed exactly for this — they run in your Firebase project, have full access to Firestore via Admin SDK, and don't need an HTTP endpoint. Cleaner for a scheduled background job.

**Requires Firebase Blaze plan (pay-as-you-go).** Free tier doesn't include Cloud Functions that make external network calls (like calling Razorpay and Resend). Blaze has a generous free allowance (2M function invocations/month) — a daily function running for 50 students is essentially free.

### B) Manual Trigger (Admin Dashboard)
Admin clicks "Send Payment Request" for any student from `/admin/payments`. Calls `POST /api/admin/payments/manual-trigger`. Useful for: first invoice for a new student, re-sending a lost email, or off-cycle billing.

### C) Student Pays Directly (Student Dashboard)
Student clicks "Pay Now" on a pending invoice. Calls `POST /api/payments/create-order`. Useful when admin already created the invoice record but the student wants to pay on their own terms.

---

## Currency Logic (India vs NRI)

```typescript
function determinePaymentDetails(student, settings) {
  if (student.category === 'india') {
    return {
      amount: student.customFeeOverride ?? settings.indiaFees[student.batchType],
      currency: 'INR'
    }
  }

  // NRI student
  if (student.nriCurrencyPreference === 'usd') {
    return {
      amount: student.customFeeOverride ?? settings.nriFees.usd[student.batchType],
      currency: 'USD'
    }
  } else {
    // 'inr-equivalent'
    return {
      amount: student.customFeeOverride ?? settings.nriFees.inrEquivalent[student.batchType],
      currency: 'INR'
    }
  }
}
```

The `??` (nullish coalescing) operator: use `customFeeOverride` if it's not null/undefined, otherwise fall back to the global fee structure. This is how per-student negotiated pricing works — set `customFeeOverride` in the admin dashboard.

**Razorpay note:** Razorpay requires enabling "International Payments" in their dashboard for USD orders. Confirm this with your Razorpay account before going live with NRI USD payments.

---

## The Webhook — Most Critical Part

The webhook is how Razorpay tells your server that a payment succeeded. It's more reliable than the frontend (the student's browser could crash after payment but before your app gets notified).

**`src/app/api/payments/webhook/route.ts`**

```typescript
export async function POST(request: Request) {
  // 1. Verify the request actually came from Razorpay
  const body = await request.text()  // raw text for signature check
  const signature = request.headers.get('x-razorpay-signature')
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSig) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Handle the event
  const event = JSON.parse(body)
  if (event.event === 'payment.captured') {
    const razorpayOrderId = event.payload.payment.entity.order_id

    // 3. Find our payment record
    const paymentQuery = await adminDb
      .collection('payments')
      .where('razorpayOrderId', '==', razorpayOrderId)
      .get()

    if (paymentQuery.empty) return Response.json({ ok: true }) // unknown order, ignore

    const paymentDoc = paymentQuery.docs[0]
    const payment = paymentDoc.data()

    // 4. Idempotency check — don't process twice
    if (payment.status === 'paid') return Response.json({ ok: true })

    // 5. Update status
    await paymentDoc.ref.update({
      status: 'paid',
      razorpayPaymentId: event.payload.payment.entity.id,
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    // 6. Send confirmation email
    // ... call Resend
  }

  return Response.json({ ok: true })
}
```

**Why verify the signature?**
Anyone on the internet can POST to your webhook URL. The HMAC signature proves the request genuinely came from Razorpay (only Razorpay and you know the webhook secret). Never process a webhook without verifying it.

**Why the idempotency check?**
Webhook delivery is "at least once" — Razorpay may send the same webhook multiple times if your server was slow to respond. The `if (payment.status === 'paid') return` check ensures you don't send duplicate confirmation emails or double-count payments.

---

## Email Automation

Four email types triggered from the payment system:

| Email | When | Template function |
|---|---|---|
| Payment request | Order created (automated or manual) | `paymentRequestEmail()` |
| Payment reminder | X days after due, still unpaid | `paymentReminderEmail()` |
| Payment confirmation | Webhook `payment.captured` fires | `paymentConfirmationEmail()` |
| Welcome | Admin approves a student | `studentWelcomeEmail()` (Phase 3) |

All live in `src/lib/email/templates.ts`. Each is a function that takes data and returns an HTML string.

**Reminder logic (daily check):**
```
/api/admin/payments/reminder (called by Cloud Function or manually):
  → find all payments where status = 'sent' AND dueDate < (today - reminderDaysAfterDue)
  → for each: send reminder email, update reminderSentAt
```

---

## Frontend: Razorpay Checkout Component

**`src/components/payments/RazorpayCheckout.tsx`**

Razorpay provides a JavaScript library that opens a payment modal. You load it via a `<Script>` tag and call `new window.Razorpay({...}).open()`.

```typescript
'use client'

export function RazorpayCheckout({ orderId, amount, currency, keyId, studentName, email }) {
  const handlePayment = () => {
    const rzp = new (window as any).Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: orderId,
      name: 'Raagdhara Academy',
      description: 'Monthly fees',
      prefill: { name: studentName, email },
      handler: async (response) => {
        // Payment succeeded in the modal
        // Call /api/payments/verify for immediate UX feedback
        // (webhook is the authoritative source, this is just for the success screen)
        await fetch('/api/payments/verify', {
          method: 'POST',
          body: JSON.stringify(response)
        })
        // Show success state
      }
    })
    rzp.open()
  }

  return <button onClick={handlePayment}>Pay Now</button>
}
```

**Why `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safe to expose:**
The Key ID is a public identifier — Razorpay expects it to be in the browser. It's like a username; it identifies your account but can't be used to charge anyone or access your account. The Key Secret (`RAZORPAY_KEY_SECRET`) is the sensitive one — that only ever lives in server-side environment variables.

---

## Firebase Cloud Functions Structure

```
functions/
  src/
    index.ts              ← exports all functions
    scheduledPayments.ts  ← daily payment trigger
  package.json            ← Node 18, firebase-admin, firebase-functions, razorpay, resend
  tsconfig.json
```

**`scheduledPayments.ts`:**
```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const triggerMonthlyPayments = onSchedule('0 3 * * *', async () => {
  // 3 AM UTC = 8:30 AM IST
  const today = new Date()
  const dayOfMonth = today.getDate()  // in IST

  const settings = await adminDb.collection('settings').doc('global').get()
  const globalPaymentDay = settings.data()?.defaultPaymentDay

  // Find students whose payment day is today
  const students = await adminDb
    .collection('students')
    .where('status', '==', 'active')
    .get()

  for (const student of students.docs) {
    const data = student.data()
    const paymentDay = data.paymentDueDayOverride ?? globalPaymentDay

    if (paymentDay === dayOfMonth) {
      // Create Razorpay order + write payment doc + send email
      await createPaymentRequest(student.id, data)
    }
  }
})
```

Deploy separately from the Next.js app:
```bash
cd functions
npm run deploy
```

---

## Files Created in Phase 5

**API routes (5):**
- `src/app/api/payments/create-order/route.ts`
- `src/app/api/payments/webhook/route.ts`
- `src/app/api/payments/verify/route.ts`
- `src/app/api/admin/payments/manual-trigger/route.ts`
- `src/app/api/admin/payments/reminder/route.ts`

**Component (1):**
- `src/components/payments/RazorpayCheckout.tsx`

**Email templates added to `src/lib/email/templates.ts`:**
- `paymentRequestEmail()`
- `paymentReminderEmail()`
- `paymentConfirmationEmail()`

**Firebase Functions (3 files):**
- `functions/src/index.ts`
- `functions/src/scheduledPayments.ts`
- `functions/package.json`
- `functions/tsconfig.json`

---

## Checklist Before Going Live

- [ ] Razorpay: enable international payments (for NRI USD)
- [ ] Razorpay: set webhook URL to `https://yourdomain.com/api/payments/webhook`
- [ ] Razorpay: copy webhook secret to `RAZORPAY_WEBHOOK_SECRET` env var
- [ ] Firebase: deploy Cloud Functions (`firebase deploy --only functions`)
- [ ] Resend: verify sending domain (emails from unverified domains go to spam)
- [ ] Test full flow with Razorpay test mode before switching to live keys
