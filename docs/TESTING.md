# Payment System Testing Guide (Phase 26)

## What Changed

Branch `fix/payment-system-overhaul` has 4 phases of fixes:

- **Phase A** — Fixed `RAZORPAY_KEY_SECRET` not being trimmed before HMAC. This was the root cause of ALL payments never auto-confirming. Also fixed: guardian lookup, idempotency, session logging, better error messages.
- **Phase B** — New Razorpay webhook at `/api/payments/razorpay-webhook` — confirms payments server-side if the browser callback fails.
- **Phase C** — Three cron routes for auto invoice generation, reminders, and overdue marking. New Automation section in Admin → Settings.
- **Phase D** — Admin can now edit invoice amount/due date/notes inline. Delete now soft-cancels (shows grey "Cancelled" badge) instead of permanently deleting.

---

## BEFORE YOU BEGIN: Add 2 Lines to .env.local

Open `.env.local` in the project root and add these at the bottom:

```
CRON_SECRET=test-cron-secret-local
RAZORPAY_WEBHOOK_SECRET=test-webhook-secret-local
```

These are placeholder values for local testing. You'll set real values in Secret Manager before production.

---

## PART 1: LOCAL TESTING

### Step 1 — Start the dev server

```bash
npm run dev
# → http://localhost:4028
```

---

### Step 2 — Razorpay Keys: Test vs Live

**Option A — Use test keys (recommended, no real charges):**

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Toggle to **Test Mode** in the top-left corner
3. Go to **Settings → API Keys → Generate Test Key**
4. Copy the Key ID (starts with `rzp_test_`) and Key Secret
5. Update `.env.local`:

   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_PASTE_YOUR_TEST_KEY_ID
   RAZORPAY_KEY_SECRET=PASTE_YOUR_TEST_KEY_SECRET
   ```

6. Restart the dev server (`Ctrl+C` → `npm run dev`)

**Test payment credentials (test mode only):**

| Method | Value | Outcome |
|--------|-------|---------|
| UPI ID | `success@razorpay` | Always succeeds |
| UPI ID | `failure@razorpay` | Always fails |
| Card number | `4111 1111 1111 1111` | Succeeds (any future expiry, any CVV) |

**Option B — Use live keys (if test keys give errors):**

Keep your existing `.env.local` live keys. Use ₹1 real invoices (Step 3). The payment will charge an actual ₹1 — Razorpay's minimum. All verify/email/webhook flows work identically. This is acceptable for initial testing given the ₹1 cost.

> Note: `success@razorpay` does NOT work with live keys — you must use a real UPI ID, card, or net banking to complete the payment.

---

### Step 3 — Create a ₹1 Test Invoice

Invoices are created from student fee settings — there is no "custom amount" field at creation time. The workflow is: **create → then edit to ₹1**.

**3a. Find a student's document ID:**
1. Go to [Firebase Console](https://console.firebase.google.com) → your project → Firestore
2. Click the `students` collection
3. Click any student document
4. The document ID appears in the URL after `/documents/students/` — copy it (it looks like `abc123XYZ`)

**3b. Create the invoice via browser DevTools:**
1. Log in as admin at `http://localhost:4028`
2. Press **F12** → click the **Console** tab
3. Paste this (replace the student ID):

```javascript
await fetch('/api/admin/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId: 'PASTE_STUDENT_DOC_ID_HERE' })
}).then(r => r.json())
```

4. Press Enter
5. Expected response: `{ created: 1, skipped: 0 }`
6. If you see `{ created: 0, skipped: 1 }` — the student already has an invoice this month. Use a past month instead:
   ```javascript
   body: JSON.stringify({ studentId: 'STUDENT_ID', month: '2026-04' })
   ```

**3c. Edit the invoice to ₹1:**
1. Go to **Admin → Payments → Invoices tab** (click the Invoices tab, not Analytics)
2. Find the newly created invoice — it's under the current month section
3. Click the **"Edit"** button (blue, appears on the right side of the row)
4. An inline form opens in the row — change **Amount** to `1`
5. Click **"Save"**
6. The invoice row now shows **₹1**

> Razorpay minimum is ₹1. Entering 0 will fail at checkout.

---

### Step 4 (Test A1) — Student Pays → Invoice Flips to Paid

1. Open a new incognito window → go to `http://localhost:4028`
2. Log in as the student whose ₹1 invoice you just created
3. Go to **Payments** in the sidebar
4. You should see the ₹1 invoice with a **"Pay now"** button
5. Click **"Pay now"** — Razorpay modal opens
6. Enter UPI ID: `success@razorpay` → complete the payment
7. ✅ **Expected:** Modal closes, invoice immediately shows **green "Paid"** badge (no page refresh needed)
8. **Check Firestore:** `payments` collection → find the doc → confirm `status: "paid"`, `razorpayPaymentId` is set, `paidAt` has a value
9. **Check emails:** admin inbox + student inbox should each have a payment confirmation from `noreply@raagdhara.com`

**If invoice does NOT flip to Paid:**
- Open DevTools → **Network tab** → look for a failed `POST /api/payments/verify` call (it will be red)
- Click it → check the **Response** tab for the error
- Check the **terminal** (where you ran `npm run dev`) for `[payments/verify]` log lines

---

### Step 5 (Test A2) — Parent Portal Payment

1. Log in as a parent (e.g. `pandeyudit@gmail.com`) at `http://localhost:4028/parent/payments`
2. Create a ₹1 invoice for one of their linked children (Step 3, using the child's student ID)
3. Click **"Pay now"** → use `success@razorpay`
4. ✅ **Expected:** Invoice flips to Paid; admin + student + parent all receive emails

---

### Step 6 (Test A3) — Idempotency Check

After a payment is paid (Step 4 or 5), verify calling the verify endpoint again doesn't double-charge or double-email:

Paste in DevTools console (replace with the actual paid invoice ID from Firestore):
```javascript
await fetch('/api/payments/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 'THE_PAID_INVOICE_ID',
    razorpayOrderId: 'order_fake',
    razorpayPaymentId: 'pay_fake',
    razorpaySignature: 'fake_sig'
  })
}).then(r => r.json())
```
✅ Expected: `{ success: true }` — no error, no duplicate email

---

### Step 7 (Test C) — Cron Routes

All cron endpoints need `Authorization: Bearer test-cron-secret-local` (the value you added to `.env.local`).

**C1 — generate-invoices:**

First, enable auto-generation:
1. Admin → **Settings** → scroll to **Automation** section → toggle **"Auto-generate invoices"** ON → Save

```bash
curl -X POST http://localhost:4028/api/cron/generate-invoices \
  -H "Authorization: Bearer test-cron-secret-local"
```
Expected: `{"created": 0, "skipped": N, "month": "2026-05"}` (created=0 is normal unless today matches a student's payment day)

Disable the toggle in Settings, run again:
```bash
curl -X POST http://localhost:4028/api/cron/generate-invoices \
  -H "Authorization: Bearer test-cron-secret-local"
```
Expected: `{"skipped": true, "reason": "autoGenerateInvoices is disabled"}`

**C2 — send-reminders:**

Setup: Create a ₹1 test invoice (Step 3). Then go to Admin → Payments → Invoices → click **Edit** on it → change the due date to **3 days from today** → Save.

```bash
curl -X POST http://localhost:4028/api/cron/send-reminders \
  -H "Authorization: Bearer test-cron-secret-local"
```
Expected: `{"sent": 1, "skipped": 0, "targetDate": "YYYY-MM-DD"}`

Run again immediately:
```bash
curl -X POST http://localhost:4028/api/cron/send-reminders \
  -H "Authorization: Bearer test-cron-secret-local"
```
Expected: `{"sent": 0, "skipped": 1}` — no duplicate (7-day throttle)

**C3 — mark-overdue:**

Setup: Create a ₹1 test invoice → Edit its due date to **4 days ago** (e.g. 2026-05-23).

```bash
curl -X POST http://localhost:4028/api/cron/mark-overdue \
  -H "Authorization: Bearer test-cron-secret-local"
```
Expected: `{"markedOverdue": 1, "alreadyOverdue": 0}`

Check:
- Invoice shows red **"Overdue"** badge in admin view
- Admin, student, and parent receive overdue notification emails
- Firestore: `status: "overdue"`

Run again immediately:
```bash
curl -X POST http://localhost:4028/api/cron/mark-overdue \
  -H "Authorization: Bearer test-cron-secret-local"
```
Expected: `{"markedOverdue": 0, "alreadyOverdue": 1}` — no duplicate email

**C4 — Unauthorized call (should return 401):**
```bash
curl -X POST http://localhost:4028/api/cron/generate-invoices
```
Expected: `{"error": "Unauthorized"}` with HTTP 401

---

### Step 8 (Test D) — Invoice Edit and Cancel

**D1 — Edit a pending invoice:**
1. Admin → Payments → Invoices tab → find any pending invoice → click **"Edit"** (blue button)
2. Inline form appears in the row — change Amount, Due Date, and Notes
3. Click **"Save"** → row updates immediately
4. Verify: Edit button is NOT visible on paid invoices or cancelled invoices

**D2 — Cancel an invoice:**
1. Admin → Payments → find a pending or overdue invoice → click **"Cancel invoice"** → confirm the dialog
2. ✅ Expected: row shows grey **"Cancelled"** badge, row is slightly dimmed
3. Check Firestore: `status: "cancelled"`, `cancelledAt` timestamp is set
4. No emails should arrive when cancelling

5. Click **"Cancel invoice"** again on the already-cancelled row → ✅ Expected: row disappears (hard-deleted)
6. Verify: "Cancel invoice" button is NOT visible on paid invoices

**D3 — Cancelled invoices have no Pay button:**
1. Log in as the student whose invoice was just cancelled
2. Go to `/student/payments`
3. ✅ Expected: cancelled invoice shows grey "Cancelled" badge with NO "Pay now" button

---

### Step 9 (Test E) — Manual Admin Operations

**E1 — Mark paid manually:**
1. Admin → Payments → find a pending invoice → click **"Mark paid"** → confirm
2. ✅ Expected: green "Paid" badge + "Manual" sub-label
3. Admin, student, and parent all receive payment confirmation emails
4. Firestore: `markedPaidManually: true`

**E2 — Send reminder manually:**
1. Admin → Payments → find a pending invoice → click **"Send reminder"**
2. ✅ Expected: `Sent to student@email.com, parent@email.com` appears below the button
3. Student and parent receive reminder emails

**E3 — Send overdue notice manually:**
1. Admin → Payments → find an overdue invoice → click **"Send overdue notice"**
2. ✅ Expected: student, parent, AND admin all receive overdue notice emails

---

### Step 10 (Test F) — Access Control

Log in as any student, open DevTools → Console, and try to pay a DIFFERENT student's invoice:

```javascript
await fetch('/api/payments/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentId: 'DIFFERENT_STUDENTS_PAYMENT_ID' })
}).then(r => r.json())
```
✅ Expected: HTTP 403 `{ "error": "Access denied" }`

---

## PART 2: DEPLOY TO PRODUCTION

### Step 11 — Set Secrets in Secret Manager

Run these commands from your terminal. Use `printf` NOT `echo` — `echo` adds a newline which breaks the HMAC (this was the original bug):

```bash
# MOST CRITICAL — re-set without trailing newline
# Get your live key secret from Razorpay Dashboard → Settings → API Keys → Live Mode
printf 'YOUR_LIVE_RAZORPAY_KEY_SECRET' | firebase apphosting:secrets:set RAZORPAY_KEY_SECRET

# Generate a cron secret
openssl rand -hex 32
# Copy the output, then:
printf 'OUTPUT_FROM_ABOVE' | firebase apphosting:secrets:set CRON_SECRET

# Webhook secret — generate in Razorpay Dashboard first (Step 13 below), then come back here:
printf 'YOUR_WEBHOOK_SECRET' | firebase apphosting:secrets:set RAZORPAY_WEBHOOK_SECRET
```

Verify no trailing newline:
```bash
firebase apphosting:secrets:access RAZORPAY_KEY_SECRET | cat -A
# Last character should NOT be a blank line or trailing $
```

---

### Step 12 — Merge and Deploy

```bash
git checkout main
git merge fix/payment-system-overhaul
git push origin main
```

Firebase App Hosting auto-deploys on push. Watch progress in Firebase Console → App Hosting.

---

## PART 3: PRODUCTION TESTING

### Step 13 — Set Up Razorpay Webhook (First Time, From Scratch)

No webhook exists yet. This is a one-time setup.

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Switch to **Test Mode** (top-left corner) first
3. Go to **Settings → Webhooks → Add New Webhook**
4. Enter:
   - **Webhook URL:** `https://raagdhara.com/api/payments/razorpay-webhook`
   - **Secret:** Run `openssl rand -hex 32` and paste the result here. **Copy this value** — you need to set it in Secret Manager (Step 11 above, the `RAZORPAY_WEBHOOK_SECRET` command)
   - **Active Events:** Check ONLY `payment.captured` — uncheck all others
5. Click **Create Webhook**
6. Go back to Step 11 and run the `RAZORPAY_WEBHOOK_SECRET` command with the secret you just chose

---

### Step 14 — Test Webhook is Reachable

1. Razorpay Dashboard → Settings → Webhooks → click your webhook
2. Click **"Send Test Event"** → select `payment.captured`
3. ✅ Expected: Razorpay shows HTTP 200 response
4. Check Cloud Run logs: GCP Console → Cloud Run → your service → Logs
5. Filter for `[razorpay-webhook]`
6. Expected log: `[razorpay-webhook] no payment doc found for orderId: xxx` — this is correct (test event has a fake order ID). HTTP 200 is what matters.

---

### Step 15 — Test Full Payment Flow on Production (Test Mode)

**15a. Switch production to test keys temporarily:**

Edit `apphosting.yaml`:
```yaml
- variable: NEXT_PUBLIC_RAZORPAY_KEY_ID
  value: rzp_test_YOUR_TEST_KEY_ID
```
Also update the secret:
```bash
printf 'YOUR_TEST_KEY_SECRET' | firebase apphosting:secrets:set RAZORPAY_KEY_SECRET
```
Commit and push. Wait for deploy.

**15b. Create ₹1 invoice on production:**

Log in as admin at `https://raagdhara.com`. Open DevTools → Console:
```javascript
await fetch('/api/admin/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId: 'STUDENT_DOC_ID' })
}).then(r => r.json())
```
Then Admin → Payments → Invoices → click **Edit** → set Amount to `1` → Save.

**15c. Pay as the student:**
1. Log in as student at `https://raagdhara.com/student/payments`
2. Click **"Pay now"** → use `success@razorpay`
3. ✅ Expected: invoice flips to Paid immediately, admin + student + parent emails arrive

**15d. Check Cloud Run logs:**
- Filter `[payments/verify]` → should see success, NO "signature mismatch" lines
- Filter `[razorpay-webhook]` → webhook fired; since verify ran first it will say invoice already paid (idempotent = correct)

---

### Step 16 — Test Cron Routes on Production

Get your CRON_SECRET:
```bash
firebase apphosting:secrets:access CRON_SECRET
```

Run each test:
```bash
curl -X POST https://raagdhara.com/api/cron/generate-invoices \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# For send-reminders: edit a test invoice's due date to 3 days from now first
curl -X POST https://raagdhara.com/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# For mark-overdue: edit a test invoice's due date to 4 days ago first
curl -X POST https://raagdhara.com/api/cron/mark-overdue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

### Step 17 — Switch Back to Live Mode

After all tests pass:

1. Edit `apphosting.yaml` — restore live key:
   ```yaml
   - variable: NEXT_PUBLIC_RAZORPAY_KEY_ID
     value: rzp_live_Sgc4y3b9qfk10Y
   ```

2. Restore live key secret:
   ```bash
   printf 'YOUR_LIVE_KEY_SECRET' | firebase apphosting:secrets:set RAZORPAY_KEY_SECRET
   ```

3. Commit and push.

4. In Razorpay Dashboard → switch to **Live Mode** → go to Settings → Webhooks → create the webhook again in Live Mode with the same URL and same secret.

---

### Step 18 — Set Up Cloud Scheduler (One-Time)

Do this only after Step 16 confirms all 3 cron routes work.

Go to **GCP Console → Cloud Scheduler → Create Job** and create 3 jobs:

**Job 1: generate-invoices-daily**
- Name: `generate-invoices-daily`
- Schedule: `30 3 * * *` (runs at 9:00am IST every day)
- Target URL: `https://raagdhara.com/api/cron/generate-invoices`
- HTTP Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Retry: 3 attempts, 5 min backoff

**Job 2: send-payment-reminders**
- Name: `send-payment-reminders`
- Schedule: `0 4 * * *` (9:30am IST)
- Target URL: `https://raagdhara.com/api/cron/send-reminders`
- HTTP Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Retry: 3 attempts, 5 min backoff

**Job 3: mark-overdue-daily**
- Name: `mark-overdue-daily`
- Schedule: `30 4 * * *` (10:00am IST)
- Target URL: `https://raagdhara.com/api/cron/mark-overdue`
- HTTP Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Retry: 3 attempts, 5 min backoff

After creating all 3 jobs, go to **Admin → Settings → Automation** and enable **"Auto-generate invoices"** toggle.

---

## Quick Reference: What Tests to Do Where

| Test | Local | Production |
|------|-------|------------|
| A1: Student pays, flips to Paid | ✅ Step 4 | ✅ Step 15 |
| A2: Parent portal payment | ✅ Step 5 | ✅ Step 15 |
| A3: Idempotency | ✅ Step 6 | optional |
| B: Webhook reachable | ❌ needs public URL | ✅ Step 14 |
| C1–C4: Cron routes | ✅ Step 7 | ✅ Step 16 |
| D1–D3: Edit / Cancel invoice | ✅ Step 8 | optional |
| E1–E3: Manual admin ops | ✅ Step 9 | optional |
| F1: Access control | ✅ Step 10 | optional |

---

## Emails: What Fires at Each Step

| Action | Admin | Student | Parent |
|--------|-------|---------|--------|
| Invoice created | — | ✓ | ✓ |
| Reminder (manual or cron) | — | ✓ | ✓ |
| Overdue notice (manual or cron) | ✓ | ✓ | ✓ |
| Paid via Razorpay | ✓ | ✓ | ✓ |
| Marked paid manually | ✓ | ✓ | ✓ |
| Cancelled | — | — | — |

---

## Cloud Run Log Filters

In GCP Console → Cloud Run → Logs, search for:

| Search term | What it shows |
|-------------|---------------|
| `[payments/verify]` | Verify route — check for "signature mismatch" (should be zero) |
| `[razorpay-webhook]` | Webhook events |
| `[cron/generate-invoices]` | Invoice generation |
| `[cron/send-reminders]` | Reminders |
| `[cron/mark-overdue]` | Overdue marking |
| `signature mismatch` | HMAC failures (should be zero after this fix) |
