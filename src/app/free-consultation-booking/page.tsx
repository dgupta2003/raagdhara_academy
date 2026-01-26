import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import BookingInteractive from './components/BookingInteractive';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Consultation Booking - Raagdhara Academy',
  description: 'Book your free 30-minute consultation with Vaishnavi Gupta, a Visharad-certified vocalist. Discover personalized learning paths for Indian classical music training with flexible scheduling and timezone-smart booking.',
};

export default function FreeConsultationBookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="consultation-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#consultation-pattern)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-secondary/10 rounded-full mb-6">
              <Icon name="SparklesIcon" size={20} className="text-secondary mr-2" />
              <span className="font-cta text-sm text-secondary">100% Free • No Obligations</span>
            </div>

            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              Begin Your Musical Journey with a
              <span className="block text-primary mt-2">Free Consultation</span>
            </h1>

            <p className="font-body text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8">
              Connect with Vaishnavi Gupta for a personalized 30-minute session to discuss your musical aspirations, 
              assess your current level, and discover the perfect learning path tailored to your goals.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
              <div className="flex items-center space-x-2">
                <Icon name="ClockIcon" size={20} className="text-secondary" />
                <span className="font-body text-sm text-foreground/70">30 Minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="VideoCameraIcon" size={20} className="text-secondary" />
                <span className="font-body text-sm text-foreground/70">Google Meet</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="GlobeAltIcon" size={20} className="text-secondary" />
                <span className="font-body text-sm text-foreground/70">All Time Zones</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="CheckBadgeIcon" size={20} className="text-secondary" />
                <span className="font-body text-sm text-foreground/70">Visharad Certified</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#booking-form"
                className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground font-cta text-base rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
              >
                Book Your Free Session
                <Icon name="ArrowDownIcon" size={20} className="ml-2" />
              </a>
              <Link
                href="/courses-and-offerings"
                className="inline-flex items-center px-8 py-4 border-2 border-primary text-primary font-cta text-base rounded-md hover:bg-primary/5 transition-contemplative"
              >
                Explore Courses
                <Icon name="ArrowRightIcon" size={20} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-headline text-3xl font-semibold text-center text-foreground mb-4">
              What You'll Gain from Your Consultation
            </h2>
            <p className="font-body text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              This complimentary session is designed to give you clarity, confidence, and a clear roadmap for your musical journey
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: 'UserIcon',
                  title: 'Personalized Assessment',
                  description: 'Comprehensive evaluation of your current musical level, voice range, and learning style'
                },
                {
                  icon: 'MapIcon',
                  title: 'Custom Learning Path',
                  description: 'Tailored curriculum recommendations based on your goals, experience, and availability'
                },
                {
                  icon: 'AcademicCapIcon',
                  title: 'Expert Guidance',
                  description: 'Direct interaction with Vaishnavi Gupta to understand her teaching methodology'
                },
                {
                  icon: 'LightBulbIcon',
                  title: 'Clear Next Steps',
                  description: 'Actionable roadmap with course options, timelines, and enrollment information'
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-background rounded-lg p-6 shadow-warm hover:shadow-warm-lg transition-contemplative">
                  <div className="w-14 h-14 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon name={benefit.icon as any} size={28} className="text-secondary" />
                  </div>
                  <h3 className="font-headline text-lg font-semibold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="font-body text-sm text-foreground/70">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section id="booking-form" className="py-16 bg-background">
          <BookingInteractive />
        </section>

        {/* Trust Signals Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Icon name="UserGroupIcon" size={48} className="text-secondary" />
                </div>
                <h3 className="font-headline text-3xl font-semibold text-foreground">200+</h3>
                <p className="font-body text-sm text-muted-foreground">Students Worldwide</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Icon name="StarIcon" size={48} className="text-secondary" variant="solid" />
                </div>
                <h3 className="font-headline text-3xl font-semibold text-foreground">4.9/5</h3>
                <p className="font-body text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Icon name="ClockIcon" size={48} className="text-secondary" />
                </div>
                <h3 className="font-headline text-3xl font-semibold text-foreground">5,000+</h3>
                <p className="font-body text-sm text-muted-foreground">Hours of Teaching</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-semibold text-foreground mb-6">
              Ready to Start Your Musical Journey?
            </h2>
            <p className="font-body text-lg text-foreground/80 mb-8">
              Book your free consultation today and take the first step towards mastering Indian classical music
            </p>
            <a
              href="#booking-form"
              className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground font-cta text-base rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
            >
              Schedule Your Free Session
              <Icon name="CalendarDaysIcon" size={20} className="ml-2" />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-brown text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8Z"
                    stroke="var(--color-secondary)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M16 24C16 19.582 19.582 16 24 16C28.418 16 32 19.582 32 24"
                    stroke="var(--color-secondary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="24" cy="24" r="3" fill="var(--color-secondary)" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-devanagari text-xl font-medium text-secondary leading-none">
                    रागधारा
                  </span>
                  <span className="font-headline text-xs text-primary-foreground/80 tracking-wide">
                     Music Academy
                  </span>
                </div>
              </div>
              <p className="font-body text-sm text-primary-foreground/70 leading-relaxed">
                Where tradition meets innovation in Indian Classical Music education.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-headline text-lg text-secondary mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/homepage" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/courses-and-offerings" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Courses
                  </Link>
                </li>
                <li>
                  <Link href="/free-consultation-booking" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Book Consultation
                  </Link>
                </li>
                <li>
                  <Link href="/contact-and-connect" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-headline text-lg text-secondary mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2 text-sm text-primary-foreground/70">
                  <Icon name="EnvelopeIcon" size={16} className="mt-0.5 flex-shrink-0" />
                  <a href="mailto:raagdharamusic@gmail.com" className="font-body hover:text-secondary transition-colors">
                    raagdharamusic@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Social & Connect */}
            <div>
              <h3 className="font-headline text-lg text-secondary mb-4">Connect</h3>
              <div className="flex items-center space-x-3 mb-4">
                <a
                  href="https://www.instagram.com/raagdhara_music?igsh=MTFvcDA5MjhrYWU2eg%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="Instagram"
                >
                  <Icon name="CameraIcon" size={20} className="text-primary-foreground" />
                </a>
                <a
                  href="https://youtube.com/@raagdhara_music?si=4aZUxkL7MUvSzH2g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="YouTube"
                >
                  <Icon name="VideoCameraIcon" size={20} className="text-primary-foreground" />
                </a>
                <a
                  href="https://www.facebook.com/share/1D8ZEQjpKW/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="Facebook"
                >
                  <Icon name="UserGroupIcon" size={20} className="text-primary-foreground" />
                </a>
                <a
                  href="https://wa.me/message/A5LAV3JA5KIZM1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="WhatsApp"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-primary-foreground" />
                </a>
              </div>
              <p className="font-body text-xs text-primary-foreground/70 leading-relaxed">
                Follow us for daily practice tips, student performances, and classical music insights.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-primary-foreground/20">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <p className="font-body text-sm text-primary-foreground/60 text-center md:text-left">
                © {new Date().getFullYear()} Raagdhara Music Academy. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-primary-foreground/60">
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}