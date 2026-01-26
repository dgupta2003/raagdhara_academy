import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface CTASectionProps {
  onBookConsultation: () => void;
}

const CTASection = ({ onBookConsultation }: CTASectionProps) => {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-brand-brown-grey relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Heading */}
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight">
            Begin Your Musical Journey Today
          </h2>

          {/* Description */}
          <p className="font-body text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-amber-200">
            Take the first step towards mastering Indian Classical Music. Book your free consultation and discover how Raagdhara Academy can transform your musical aspirations into reality.
          </p>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="flex flex-col items-center space-y-3 text-primary-foreground">
              <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Icon name="UserGroupIcon" size={32} className="text-primary-foreground" />
              </div>
              <p className="font-cta text-sm">Personalized Learning</p>
            </div>
            <div className="flex flex-col items-center space-y-3 text-primary-foreground">
              <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Icon name="VideoCameraIcon" size={32} className="text-primary-foreground" />
              </div>
              <p className="font-cta text-sm">Live Online Classes</p>
            </div>
            <div className="flex flex-col items-center space-y-3 text-primary-foreground">
              <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Icon name="AcademicCapIcon" size={32} className="text-primary-foreground" />
              </div>
              <p className="font-cta text-sm">Expert Guidance</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button
              onClick={onBookConsultation}
              className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground font-cta text-lg rounded-md shadow-warm-lg hover:scale-105 transition-contemplative w-full sm:w-auto"
            >
              Book Free Consultation
              <Icon name="CalendarIcon" size={20} className="ml-2" />
            </button>
            <Link
              href="/contact-and-connect"
              className="inline-flex items-center px-8 py-4 bg-primary-foreground text-primary border-2 border-primary-foreground font-cta text-lg rounded-md hover:bg-transparent hover:text-primary-foreground transition-contemplative w-full sm:w-auto"
            >
              Contact Us
              <Icon name="ChatBubbleLeftRightIcon" size={20} className="ml-2" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-primary-foreground/80 text-sm font-body border-orange-50">
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;