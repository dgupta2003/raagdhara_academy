# Raagdhara Music Academy

Website and student management platform for Raagdhara Music Academy — an Indian classical vocal music school.

## What This Is

A Next.js web application combining a public-facing website with a private teacher/student portal:

- **Public website** — homepage, courses, free consultation booking
- **Admin dashboard** — student management, attendance tracking, fee settings, payment management
- **Student portal** — attendance history, payment invoices

## Tech Stack

- **Framework:** Next.js 14.2 (App Router), TypeScript
- **Styling:** Tailwind CSS with custom theme (brand brown, gold, parchment)
- **Auth & Database:** Firebase Auth + Firestore
- **Email:** Resend
- **Payments:** Razorpay *(Phase 5 — in progress)*
- **Deployment:** Netlify

## Courses Offered

- Hindustani Classical Vocal Music
- Popular and Film Music (Hindi)
- Devotional Music (Hindi)
- Ghazal
- Bhatkhande Sangeet Vidyapeeth — Full Course

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (Firestore + Firebase Auth enabled)
- Resend account with verified sending domain

### Environment Variables

Create `.env.local` with the following:

```
# Firebase Client (browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Email
RESEND_API_KEY=
ADMIN_EMAIL=
```

### Run Locally

```bash
npm install
npm run dev
```

Opens at [http://localhost:4028](http://localhost:4028)

### Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore
```

## Project Structure

```
src/
  app/
    admin/          # Teacher dashboard (auth-protected)
    student/        # Student portal (auth-protected)
    auth/           # Login & registration pages
    api/            # Server-side API routes
    homepage/       # Public homepage
    courses-and-offerings/
    free-consultation-booking/
  components/
    auth/           # Login and register forms
    dashboard/      # Admin and student sidebars
    common/         # Header, Footer
  contexts/         # AuthContext (Firebase Auth state)
  lib/
    firebase/       # Client SDK, Admin SDK, types, serialization
    email/          # Resend email templates
  middleware.ts     # Route protection for /admin/* and /student/*
```

## Available Scripts

```bash
npm run dev       # Start development server (port 4028)
npm run build     # Production build
npm run lint      # ESLint
```
