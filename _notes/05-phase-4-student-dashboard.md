# Phase 4 — Student Dashboard

**Status: ✅ Complete — verified in browser**

This is what students see after logging in — their attendance history, payment invoices, and enrollment info.

---

## Route Structure

Flat routes under `src/app/student/`, same decision as Phase 3 admin.

```
src/app/
  student/
    layout.tsx          ← student shell (sidebar + auth check)
    page.tsx            → /student        (overview)
    attendance/
      page.tsx          → /student/attendance
      AttendanceHistoryClient.tsx
    payments/
      page.tsx          → /student/payments
      PaymentsClient.tsx
src/components/dashboard/
  StudentSidebar.tsx
```

---

## Files Created in Phase 4

- `src/app/student/layout.tsx` — server layout, verifies session + `role === 'student'`
- `src/app/student/page.tsx` — server component overview (replaced the Phase 2 stub)
- `src/app/student/attendance/page.tsx` + `AttendanceHistoryClient.tsx`
- `src/app/student/payments/page.tsx` + `PaymentsClient.tsx`
- `src/components/dashboard/StudentSidebar.tsx`
- `firestore.indexes.json` — composite indexes for attendance + payments queries

---

## Concept: Why No API Routes for the Student Dashboard?

The admin dashboard needed API routes for *mutations* — approving a student, saving attendance, updating settings. The student dashboard is *read-only* — students just view their own data. That changes the architecture.

**Server components can read Firestore directly.** Each page function:
1. Reads the `session` cookie with `cookies()`
2. Calls `adminAuth.verifySessionCookie()` to get the user's `uid`
3. Queries Firestore for only that student's records (`where('studentId', '==', uid)`)
4. Renders the data directly to HTML on the server

This is strictly better than adding an API route:
- One less HTTP round-trip (page fetch → data, not page fetch → API call → data)
- Session is verified before any database query, not after
- Less code to maintain

The mental model: an API route is a bridge between the browser and the server. Server Components already *are* the server — there's no bridge needed. Only use API routes when the browser needs to talk to the server after the page has loaded (mutations, forms, actions).

---

## Concept: When Does `serializeDoc()` Apply?

This is a subtle but important distinction about where data "lives" at render time.

**Rule:** `serializeDoc()` is needed when Firestore data is *passed as props from a Server Component to a Client Component*.

Why? Firestore's Admin SDK returns `Timestamp` objects (a custom class with `.toDate()` method). When Next.js serializes props to send across the server→client boundary, it uses `JSON.stringify`. Class instances with methods don't survive `JSON.stringify` — they lose their methods and Next.js throws: *"Only plain objects can be passed from Server to Client Components."*

`serializeDoc()` converts `Timestamp` → ISO string (a plain string, fully JSON-safe).

**In Phase 4:**
- `attendance/page.tsx` → passes records to `AttendanceHistoryClient` → needs `serializeDoc()` ✓
- `payments/page.tsx` → passes records to `PaymentsClient` → needs `serializeDoc()` ✓
- `student/page.tsx` → renders entirely server-side (no client component receives props) → no `serializeDoc()` needed ✓

The overview page fetches and renders everything in one server function. No data crosses a component boundary, so there's nothing to serialize.

---

## Concept: Why Does the Layout Re-Verify the Session?

The `student/layout.tsx` verifies the session cookie with Firebase Admin. But `middleware.ts` already checks the cookie. Isn't that redundant?

No. They serve different purposes:

**Middleware (Edge Runtime):**
- Runs in a V8 isolate at the CDN edge — extremely fast, close to the user
- Can only check *whether* the cookie exists (name + value present)
- Cannot use Firebase Admin SDK (requires Node.js APIs not available in Edge Runtime)
- **What it catches:** requests with no session cookie at all (logged-out users)

**Server Layout (Node.js Runtime):**
- Runs in a full Node.js environment
- Can call `adminAuth.verifySessionCookie(cookie, true)` — cryptographically verifies the JWT signature, expiry, revocation status
- Also checks the user's Firestore role document
- **What it catches:** expired cookies, revoked sessions, the wrong role (an admin trying to access `/student/*`)

Think of middleware as a bouncer checking IDs at the door (fast, bulk check), and the layout as the manager verifying the ID is real and the person is actually on the guest list (slower, but definitive).

Both are necessary.

---

## Concept: Firestore Composite Indexes — and When to Avoid Them

Firestore is very fast at simple single-field queries. But when a query filters on one field *and* sorts/filters on another, Firestore needs a **composite index** — a pre-built data structure that already has the combined sort order computed.

**Example of a composite query:**
```typescript
where('studentId', '==', uid).orderBy('sessionDate', 'desc')
// or
where('studentId', '==', uid).where('sessionDate', '>=', thirtyDaysAgo)
```

Firestore can't just scan all records, filter, then sort on the fly — that would get slow as data grows. A composite index pre-computes the combined sort so queries are fast regardless of dataset size.

**Without the index:** Firestore returns `Error: 9 FAILED_PRECONDITION: The query requires an index` and helpfully includes a URL to create it.

**Important nuance:** A range filter (`>=`) and an `orderBy` on the same field need *different* composite index definitions. We initially deployed an index for `orderBy('sessionDate', 'desc')` but the overview page used `where('sessionDate', '>=', ...)` — these are treated as separate index requirements by Firestore.

**Build time:** After deploying via `firebase deploy --only firestore:indexes`, Firestore scans all existing documents to build the index. Takes **2–5 minutes** for small datasets, longer as data grows. Queries fail with `FAILED_PRECONDITION` during this window.

### The decision we made: filter in JavaScript instead

For the student dashboard, all three pages query `where('studentId', '==', uid)` only — a single-field equality query that uses Firestore's automatic single-field indexing (always available, no deployment needed). Date filtering and date sorting happen in JavaScript after fetching.

```typescript
// Instead of: .where('sessionDate', '>=', thirtyDaysAgo)
const recent = allRecords.filter(r => r.sessionDate >= thirtyDaysAgoStr);

// Instead of: .orderBy('sessionDate', 'desc')
records.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
```

**When is this acceptable?**
A music school student accumulates maybe 200–300 attendance records over their entire enrollment. Fetching all and filtering in JS takes milliseconds. The JS approach is fine.

**When would you use composite indexes instead?**
If you were building a platform with thousands of records per user, filtering on the server (Firestore) is essential — you don't want to fetch 50,000 records to find the 20 you need. At that scale, the index build wait and the maintenance overhead are worth it.

`firestore.indexes.json` still has the composite indexes defined. They'll build in the background and are available if we ever need server-side pagination in the future.

---

## Pending/Active State Handling

The student overview handles both states in one server component:
- **Pending:** Shows waiting-for-approval card. No stats fetched (no parallel queries run).
- **Active:** Fetches 30-day attendance + latest payment in parallel (`Promise.all`), renders stat cards + quick links.

The attendance and payments *sub-pages* redirect to `/student` if the student is still pending (`redirect('/student')`). This means a pending student can't navigate to those pages even if they type the URL directly — they just get bounced back to the overview.

The sidebar always renders (it's part of the layout). Pending students see the nav links but get redirected if they click attendance/payments. This is acceptable UX for now — Phase 5 could add greyed-out nav items.

---

## Mentor Notes: Server vs Client Component Decision Guide

A simple mental checklist for every new component you write:

| Need | Use |
|---|---|
| `useState`, `useEffect`, `useRef` | Client Component (`'use client'`) |
| Click handlers, form submissions | Client Component |
| Firebase Admin SDK, `cookies()`, `headers()` | Server Component |
| Direct Firestore query on page load | Server Component |
| `usePathname`, `useRouter` | Client Component |
| Purely display — no interaction | Server Component (default) |

When in doubt, start with a Server Component. Add `'use client'` only when you hit a specific hook or interaction that requires it. Client Components are not "bad" — they're just more expensive (their JavaScript ships to the browser). Use them deliberately.
