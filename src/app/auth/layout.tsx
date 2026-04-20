import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding above the card */}
        <Link href="/homepage" className="flex items-center justify-center gap-3 mb-8 group">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4Z"
              fill="var(--color-primary)"
              opacity="0.1"
            />
            <path
              d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8Z"
              stroke="var(--color-primary)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M16 24C16 19.582 19.582 16 24 16C28.418 16 32 19.582 32 24"
              stroke="var(--color-secondary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M20 28C20 25.791 21.791 24 24 24C26.209 24 28 25.791 28 28"
              stroke="var(--color-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="24" cy="24" r="3" fill="var(--color-primary)" />
          </svg>
          <div className="flex flex-col">
            <span className="font-devanagari text-2xl font-medium text-primary leading-none">रागधारा</span>
            <span className="font-headline text-sm text-muted-foreground tracking-wide">Music Academy</span>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-warm p-8">
          {children}
        </div>

      </div>
    </div>
  );
}
