'use client';

import HeroSection from './HeroSection';
import AboutPreview from './AboutPreview';
import CoursesPreview from './CoursesPreview';
import TestimonialsSection from './TestimonialsSection';
import CTASection from './CTASection';
import StudentPortalAnnouncement from './StudentPortalAnnouncement';
import Footer from '@/components/common/Footer';
import FloatingBookingWidget from './FloatingBookingWidget';

const HomepageInteractive = () => {
  return (
    <>
      <HeroSection />
      <AboutPreview />
      <CoursesPreview />
      <StudentPortalAnnouncement />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <FloatingBookingWidget />
    </>
  );
};

export default HomepageInteractive;
