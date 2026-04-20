# Phase 3 — Admin Dashboard

**Status: ✅ Complete — verified in browser**

This is the teacher-facing side of the app. Your sister uses this to manage students, mark attendance, and handle payments.

---

## Route Structure

We used flat routes under `src/app/admin/` — not the `(admin)` route group originally planned. Both achieve the same result (all admin pages share one layout). The flat approach is simpler: the layout at `src/app/admin/layout.tsx` naturally wraps every page under `/admin/*`.

```
src/app/
  admin/
    layout.tsx          ← admin shell (sidebar + auth check)
    page.tsx            → /admin        (overview dashboard)
    students/
      page.tsx          → /admin/students
      new/page.tsx      → /admin/students/new
      [studentId]/
        page.tsx        → /admin/students/abc123
    attendance/
      page.tsx          → /admin/attendance
    payments/
      page.tsx          → /admin/payments (Phase 5 placeholder)
    settings/
      page.tsx          → /admin/settings
```

**When would you use a route group instead?**
Route groups (`(admin)`) are useful when you want multiple folder-level layouts that don't add a path segment — for example, if you had both `/dashboard` and `/reports` that should share an admin shell but live at the root URL level. Since all our admin pages live under `/admin`, flat routes work perfectly and are easier to understand.

---

## The Admin Layout — First Line of Defense

`src/app/(admin)/layout.tsx` is a **Server Component** that runs on every admin page load. It:
1. Reads the session cookie
2. Calls `adminAuth.verifySessionCookie()` to cryptographically verify it
3. Checks that the user's role is `'admin'` in Firestore
4. If either check fails → redirects to `/auth/login`
5. If both pass → renders the admin sidebar + page content

```typescript
// Rough shape
export default async function AdminLayout({ children }) {
  const session = cookies().get('session')
  if (!session) redirect('/auth/login')

  const decoded = await adminAuth.verifySessionCookie(session.value)
  const userDoc = await adminDb.collection('users').doc(decoded.uid).get()
  if (userDoc.data()?.role !== 'admin') redirect('/homepage')

  return (
    <div className="flex">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  )
}
```

**Mentor note — Server Components vs Client Components:**
In Next.js App Router, components are **Server Components by default**. They run on the server, can use `async/await`, and can access server-only resources (Admin SDK, cookies, env vars). They never send their JavaScript to the browser.

Add `'use client'` at the top of a file to make it a **Client Component** — it runs in the browser, can use React hooks (`useState`, `useEffect`), and can respond to user interactions.

The admin layout is a Server Component because it needs the Admin SDK (server-only). The sidebar is a Client Component because it needs `usePathname()` to highlight the active link.

---

## Pages Breakdown

### Overview (`/admin`)
- Server Component
- Fetches quick stats: active student count, pending approvals, unpaid invoices
- Displays `<StatsCard>` components — quick at-a-glance numbers

### Students (`/admin/students`)
- Server Component fetches student list → passes to Client Component `<StudentTable>`
- Why split? The table needs client-side filtering/sorting (useState). But the initial data fetch should happen server-side for speed.
- Filter by: category (India/NRI), status (pending/active/inactive), course

### Student Detail (`/admin/students/[studentId]`)
- `[studentId]` in the folder name = dynamic route. Next.js passes the actual ID as a prop.
- Admin can edit: category, fee override, payment day override, course, batch type
- Approve button → calls `POST /api/admin/students/{id}/approve` → sets status='active' + sends welcome email
- Deactivate button → sets status='inactive' (does NOT delete the Firebase Auth user or their data)

### Attendance (`/admin/attendance`)
- Client Component (needs live interaction — toggling present/absent)
- Date picker + batch/course selector
- Renders a grid: each student row has Present / Absent / Excused toggle buttons
- "Save" batch-writes all records to Firestore at once (Firestore batch writes are atomic — all succeed or all fail)
- History tab: past records filterable by date range

**Mentor note — why batch writes?**
If you save attendance one student at a time and the network drops halfway through, you get partial data (some students marked, others not). A batch write is all-or-nothing. Either every student's attendance is saved, or none of it is. Always use batch writes for operations that should be treated as a single unit.

### Payments (`/admin/payments`)
- Lists all payment records with status badges
- Manual trigger: "Send Payment Request" button → calls `/api/admin/payments/manual-trigger`
- Filter by status: pending / sent / paid / overdue

### Settings (`/admin/settings`)
- Form to configure: default payment day, fee structure (India INR, NRI USD, NRI INR-equivalent), reminder schedule
- On save: writes to Firestore `settings/global` document
- These values are read by the payment system when generating invoices

---

## API Routes for Admin Actions

These are server-side endpoints the admin dashboard calls. They all verify the admin session first.

| Route | Method | What it does |
|---|---|---|
| `/api/admin/students` | POST | Create a student directly (admin-only onboarding) |
| `/api/admin/students/[id]` | PUT | Update student fields |
| `/api/admin/students/[id]` | DELETE | Set status=inactive |
| `/api/admin/students/[id]/approve` | POST | Approve pending student + send welcome email |
| `/api/admin/attendance` | POST | Batch-write attendance records for a session |
| `/api/email/student-welcome` | POST | Send welcome email via Resend |

---

## Shared Dashboard Components

All live in `src/components/dashboard/`:

**`AdminSidebar.tsx`** — `'use client'`. Navigation links. Uses `usePathname()` to know which link to highlight. Logo at top, sign-out button at bottom.

**`StatsCard.tsx`** — reusable card showing a metric (title, value, optional icon, optional trend). Used on the overview page.

**`DataTable.tsx`** — generic sortable/filterable table. Props: columns definition + data array. Used by the student list and payment list.

**`AttendanceGrid.tsx`** — student rows with toggle buttons. Holds local state with `useReducer` before the admin clicks Save.

**`PaymentStatusBadge.tsx`** — color-coded badge: green=paid, yellow=pending/sent, red=overdue. Maps to existing Tailwind color tokens.

**`StudentTypeTag.tsx`** — shows "India" or "NRI" label with styling.

**Mentor note — why `useReducer` for attendance instead of `useState`?**
`useState` works fine for simple values (a string, a boolean). When state is a complex object (like an attendance map: `{ studentA: 'present', studentB: 'absent', ... }`) that gets updated in many different ways, `useReducer` is cleaner — it centralizes all the update logic in one place (the reducer function) instead of scattering it across multiple `setState` calls.

---

## Files Actually Created in Phase 3

**Layout + sidebar:**
- `src/app/admin/layout.tsx` — server component, verifies session + role
- `src/components/dashboard/AdminSidebar.tsx` — client component, `usePathname()` for active link

**Pages + client components (paired):**
- `src/app/admin/page.tsx` — overview stats
- `src/app/admin/students/page.tsx` + `StudentsClient.tsx`
- `src/app/admin/students/new/page.tsx` + `NewStudentClient.tsx`
- `src/app/admin/students/[studentId]/page.tsx` + `StudentEditClient.tsx`
- `src/app/admin/attendance/page.tsx` + `AttendanceClient.tsx`
- `src/app/admin/payments/page.tsx` (placeholder)
- `src/app/admin/settings/page.tsx` + `SettingsClient.tsx`

**API routes:**
- `src/app/api/admin/students/route.ts` — POST create
- `src/app/api/admin/students/[studentId]/route.ts` — PUT update
- `src/app/api/admin/students/[studentId]/approve/route.ts` — POST approve + welcome email
- `src/app/api/admin/attendance/route.ts` — POST batch-write
- `src/app/api/email/student-welcome/route.ts` — POST send welcome email

**Emails:**
- `studentWelcomeEmail()` added to `src/lib/email/templates.ts`

**Key patterns:**
- `serializeDoc()` called on all Firestore data before passing to client components
- Attendance doc ID = `{studentId}_{date}` (deterministic, prevents duplicates)
- Email failures non-blocking (`Promise.allSettled` / `.catch()`)
- `verifyAdmin()` helper used in every API route before any Firestore operation
