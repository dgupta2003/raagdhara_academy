export default function AdminPaymentsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-semibold text-foreground">Payments</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Payment management and Razorpay integration.</p>
      </div>
      <div className="bg-white rounded-lg border border-border shadow-warm p-12 text-center">
        <svg className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="font-headline text-lg text-foreground mb-2">Coming in Phase 5</p>
        <p className="font-body text-sm text-muted-foreground max-w-sm mx-auto">
          Razorpay integration for automated monthly payments, manual triggers, and overdue reminders will be built in Phase 5.
        </p>
      </div>
    </div>
  );
}
