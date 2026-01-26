import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import ContactHero from './components/ContactHero';
import ContactMethods from './components/ContactMethods';
// import ContactFormSection from './components/ContactFormSection';
import OfficeHours from './components/OfficeHours';
import SocialMediaHub from './components/SocialMediaHub';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
// import LocationSection from './components/LocationSection';
import Footer from './components/Footer';
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
      
      {/* Contact Form */}
      {/* <ContactFormSection /> */}
      
      {/* Office Hours */}
      <OfficeHours />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* FAQ Section */}
      <FAQSection />
      
      {/* Location */}
      {/* <LocationSection /> */}
      
      {/* Footer */}
      <Footer />
      
      {/* Floating Actions */}
      <FloatingActions />
    </main>
  );
}