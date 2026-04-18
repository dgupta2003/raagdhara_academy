import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import ContactHero from './components/ContactHero';
import ContactMethods from './components/ContactMethods';
import OfficeHours from './components/OfficeHours';
import SocialMediaHub from './components/SocialMediaHub';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
import Footer from '@/components/common/Footer';
import FloatingActions from './components/FloatingActions';

export const metadata: Metadata = {
  title: 'Contact & Connect - Raagdhara Academy',
  description: 'Connect with Raagdhara Academy through multiple channels. Book free consultations, join our musical community, and start your classical music journey with expert guidance from Vaishnavi Gupta.',
};

export default function ContactAndConnectPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <ContactHero className="mt-20" />
      
      {/* Social Media Hub - Join our musical community */}
      <SocialMediaHub />
      
      {/* Contact Methods - Choose your preferred way to connect */}
      <ContactMethods />
      
      {/* Office Hours */}
      <OfficeHours />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
      
      {/* Floating Actions */}
      <FloatingActions />
    </main>
  );
}