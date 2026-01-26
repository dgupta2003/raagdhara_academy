# Edge Function Setup Instructions

## Problem
The booking form is trying to send emails via a Supabase Edge Function, but the function is not deployed yet.

## Solution

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
supabase link --project-ref ovnoiilpoypjyklgdjcw
```

### Step 4: Set RESEND_API_KEY Secret
```bash
supabase secrets set RESEND_API_KEY=your_actual_resend_api_key_here
```

To get a Resend API key:
1. Go to https://resend.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and use it in the command above

### Step 5: Deploy the Edge Function
```bash
supabase functions deploy send-booking-notification
```

### Step 6: Verify Deployment
```bash
supabase functions list
```

You should see `send-booking-notification` in the list.

## Alternative: Manual Deployment via Supabase Dashboard

1. Go to https://ovnoiilpoypjyklgdjcw.supabase.co
2. Click **Edge Functions** in the left sidebar
3. Click **Create a new function**
4. Name it: `send-booking-notification`
5. Copy the contents of `supabase/functions/send-booking-notification/index.ts`
6. Paste into the editor
7. Click **Deploy**
8. Go to **Project Settings** → **Edge Functions** → **Secrets**
9. Add secret: `RESEND_API_KEY` with your actual Resend API key

## Testing

After deployment, test the booking form. The emails should now be sent successfully.

## Current Status

✅ Booking form saves data to database (working)
❌ Email notifications (Edge Function not deployed)

**Note**: The booking form will continue to work even if emails fail. Email sending is non-critical and wrapped in try-catch blocks.