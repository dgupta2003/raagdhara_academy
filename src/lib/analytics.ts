'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export function useGoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // gtag is now loaded via Script component in layout.tsx
    // Just track page views when route changes
    if (typeof window.gtag === 'function') {
      const url = pathname + (searchParams.toString() ? `?${searchParams}` : '');
      window.gtag('event', 'page_view', { page_path: url });
    }
  }, [pathname, searchParams]);
}

export function trackEvent(eventName: string, eventParams: Record<string, any> = {}) {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// Conversion tracking helpers
export function trackBookingConversion(bookingData: {
  consultationType: string;
  course: string;
  value?: number;
}) {
  trackEvent('booking_conversion', {
    event_category: 'Conversion',
    event_label: bookingData.consultationType,
    course: bookingData.course,
    value: bookingData.value || 0,
  });
}

export function trackCourseInteraction(action: string, courseTitle: string) {
  trackEvent('course_interaction', {
    event_category: 'Course Funnel',
    event_label: action,
    course_title: courseTitle,
  });
}

export function trackFormStep(step: string, formType: string) {
  trackEvent('form_step', {
    event_category: 'Form Progress',
    event_label: step,
    form_type: formType,
  });
}