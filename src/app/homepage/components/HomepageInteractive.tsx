'use client';

import { useState } from 'react';
import HeroSection from './HeroSection';
import AboutPreview from './AboutPreview';
import CoursesPreview from './CoursesPreview';
import TestimonialsSection from './TestimonialsSection';
// import RagaVisualization from './RagaVisualization';
import CTASection from './CTASection';
import StudentPortalAnnouncement from './StudentPortalAnnouncement';
import Footer from '@/components/common/Footer';
import FloatingBookingWidget from './FloatingBookingWidget';
import BookingModal from './BookingModal';

const HomepageInteractive = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  return (
    <>
      <HeroSection onBookConsultation={handleOpenBookingModal} />
      <AboutPreview />
      <CoursesPreview />
      {/* <RagaVisualization /> */}
      <StudentPortalAnnouncement onBookConsultation={handleOpenBookingModal} />
      <TestimonialsSection />
      <CTASection onBookConsultation={handleOpenBookingModal} />
      <Footer />
      <FloatingBookingWidget onBookConsultation={handleOpenBookingModal} />
      <BookingModal isOpen={isBookingModalOpen} onClose={handleCloseBookingModal} />
    </>
  );
};

export default HomepageInteractive;