# Raagdhara Academy — Student & Parent Portal Setup Guide

Hi Vaishnavi! This guide walks you through setting up the portal so your students and their parents can log in. Follow the steps in order — the whole thing should take about 20–30 minutes.

---

## Before you start

Make sure you're logged in to the academy website as admin:
- Go to **[raagdhara.com/auth/login](https://raagdhara.com/auth/login)**
- Log in with your admin account
- You'll land on the admin dashboard

---

## Step 1 — Set the correct fee rates

The system needs to know your current monthly fees so it can generate accurate invoices.

1. In the admin sidebar, click **Settings**
2. Update the fee amounts. Amounts for Indian students must be entered in **paise** (multiply rupees × 100):
   - ₹1,500 → type `150000`
   - ₹2,000 → type `200000`
3. For NRI USD fees, enter the dollar amount directly (e.g. `100` for $100/month)
4. Click **Save settings**

> If a student has a special negotiated rate, you can override it on their individual profile (see Step 2).

---

## Step 2 — Set up each student's profile

Go to **Admin → Students** and click on each student's name to open their profile. You'll need to set two things:

### 2a. Sub-batch / Group label (for attendance)

This is how the attendance page knows which session a student belongs to. Without this, all Normal Batch students show up together.

Set the "Sub-batch / Group" field based on which class session each student attends:

| Student | Sub-batch label |
|---|---|
| Lavanya Pandey | `Kids` |
| Abhisht Pandey | `Kids` |
| Anjali Daksh | `Normal A` *(confirm with your records)* |
| Divyanshu | `Normal A` *(confirm)* |
| Chaitanya Kasi | `Normal A` *(confirm)* |
| Aryan Sawhney | `Normal A` *(confirm)* |
| Shreedhar Mahendra Raut | `Normal A` *(confirm)* |
| Shubha S Kini | `Normal A` *(confirm)* |
| Mahendra Raut | `Normal A` *(confirm)* |
| Navya Shrivastava | `Normal A` *(confirm)* |
| Ashutosh Singh | `Normal A` *(confirm)* |
| Srishti Sharma | `Normal A` *(confirm)* |
| Abhishek | `Normal A` *(confirm)* |

> If any of the above are in Normal B instead, type `Normal B` for them. Personal class students (Shasvat, Rajendra, Hriday) don't need a label.

### 2b. Custom fee for Shasvat Tripathi

Shasvat has a negotiated rate of ₹9,000/month. Open his profile and in the **"Custom fee override"** field, enter `900000` (₹9,000 in paise). This means his invoices will always use this amount instead of the global rate.

Hit **Save changes** after updating each student.

---

## Step 3 — Send parent portal invites

These students are minors, so their parents need access. Go to each student's profile page and click **"Send portal invite to parent"**.

| Student | Parent who will receive the invite |
|---|---|
| Lavanya Pandey | `pandeyudit@gmail.com` (also covers Abhisht) |
| Abhisht Pandey | *(skip — already covered above)* |
| Shreedhar Mahendra Raut | `rautmanswi86@gmail.com` |
| Srishti Sharma | `ksharmasantosh89@gmail.com` |
| Shasvat Tripathi | `bhawani.tripathi@gmail.com` |
| Hriday | `salvi.snehbhar@gmail.com` |

Each parent will receive an email from `noreply@raagdhara.com` with a link to set their password and access the parent portal.

---

## Step 4 — Send student portal invites

Go to **Admin → Students** and click the **"Invite All"** button at the top of the page. This sends a welcome email to every adult student with their own email address — they'll get a link to set a password and log in.

**Important — do NOT send individual student invites to these students** (they access via the parent portal instead):
- Lavanya Pandey
- Abhisht Pandey
- Srishti Sharma
- Shasvat Tripathi
- Hriday

**After Invite All finishes**, go to Mahendra Raut's profile and click **"Send Invite"** for him individually. (He shares an email with his son Shreedhar, so Invite All would skip him — invite him separately.)

---

## Step 5 — Verify everything is working

Test at least one login from each role before announcing to everyone:

**Admin (you):**
- [x] Log in at raagdhara.com — lands on admin dashboard ✓

**Student:**
1. Pick any adult student who was just invited
2. Ask them to check their email for the invite from `noreply@raagdhara.com`
3. They click the link, set a password, log in
4. They should see their attendance history and payment invoices

**Parent:**
1. Pick any parent who was just invited
2. They check email, set password, log in
3. They should see their child's attendance and payments
4. If they have two children (Lavanya & Abhisht's parent), they should see a dropdown to switch between children

---

## Step 6 — Generate April invoices

The portal already has fee history from February and March loaded in. For April:

1. Go to **Admin → Payments**
2. Click **"Generate this month's invoices"** to create April invoices for all active students at once
3. Or go to individual student profiles to generate one at a time if you prefer

---

## How to mark attendance going forward

1. Go to **Admin → Attendance**
2. Pick today's date
3. Select the **Batch** (Normal Batch, Personal Classes)
4. If you selected Normal Batch, a second **Group** dropdown appears — select Kids, Normal A, or Normal B
5. Click **"All present"** to mark everyone, then flip any absent students individually
6. Click **Save attendance**

That's it! Each session is saved with the date, and students can see their history in their portal.

---

## Forgot password link

If any student or parent forgets their password, direct them to:
**raagdhara.com/auth/forgot-password**

They enter their email and get a reset link instantly.

---

## Questions?

Contact Devansh for any technical issues.
