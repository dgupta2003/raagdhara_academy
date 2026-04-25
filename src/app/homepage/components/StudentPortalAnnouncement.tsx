'use client';

import Link from 'next/link';

interface Props {
  onBookConsultation: () => void;
}

export default function StudentPortalAnnouncement({ onBookConsultation }: Props) {
  return (
    <section className="border-y border-[#D4AF37]/30 bg-[#FDF5E6] py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Label */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 text-[#8B4513] text-sm font-medium tracking-wide">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Now Live
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-headline text-center text-4xl md:text-5xl font-semibold text-[#8B4513] mb-4">
          The Raagdhara Student Portal
        </h2>
        <p className="font-body text-center text-lg text-gray-600 max-w-2xl mx-auto mb-12">
          We&apos;ve built a dedicated online portal so students and parents can stay on top of learning — no more WhatsApp follow-ups.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          <div className="bg-white rounded-xl border border-[#D4AF37]/25 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-[#8B4513]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#8B4513]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-headline text-lg font-semibold text-[#8B4513] mb-2">Track Attendance</h3>
            <p className="font-body text-sm text-gray-600 leading-relaxed">
              See your full session history, attendance percentage, and present / absent count — all in one view.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#D4AF37]/25 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#8B4513]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-headline text-lg font-semibold text-[#8B4513] mb-2">Pay Fees Online</h3>
            <p className="font-body text-sm text-gray-600 leading-relaxed">
              Secure Razorpay payments in INR or USD. NRI students see live exchange rates at checkout.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#D4AF37]/25 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-headline text-lg font-semibold text-[#8B4513] mb-2">Always Up to Date</h3>
            <p className="font-body text-sm text-gray-600 leading-relaxed">
              Invoice history, due dates, and attendance records updated in real time — no calls needed.
            </p>
          </div>

        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B4513] text-white text-sm font-medium rounded-md hover:bg-[#8B4513]/90 transition-colors"
          >
            Already a student? Sign in
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <button
            onClick={onBookConsultation}
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#8B4513] text-[#8B4513] text-sm font-medium rounded-md hover:bg-[#8B4513]/5 transition-colors"
          >
            New student? Book a free consultation
          </button>
        </div>

      </div>
    </section>
  );
}
