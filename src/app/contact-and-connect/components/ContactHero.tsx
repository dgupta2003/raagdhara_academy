import Icon from '@/components/ui/AppIcon';

interface ContactHeroProps {
  className?: string;
}

const ContactHero = ({ className = '' }: ContactHeroProps) => {
  return (
    <section className={`relative bg-gradient-to-br from-background via-card to-muted py-20 lg:py-32 overflow-hidden ${className}`}>
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary/10 rounded-full mb-8 animate-pulse-gentle">
            <Icon name="ChatBubbleLeftRightIcon" size={40} className="text-secondary" />
          </div>

          {/* Main Heading */}
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary mb-6 animate-breathing">
            Connect with Raagdhara
          </h1>

          {/* Devanagari Subtitle */}
          <p className="font-devanagari text-2xl md:text-3xl text-secondary mb-6">
            संगीत की यात्रा में हमारे साथ जुड़ें
          </p>

          {/* Description */}
          <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Whether you are ready to begin your musical journey, have questions about our courses, or simply wish to connect with the Raagdhara community, we are here to guide you at every step.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactHero;