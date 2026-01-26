import Icon from '@/components/ui/AppIcon';

interface LocationSectionProps {
  className?: string;
}

const LocationSection = ({ className = '' }: LocationSectionProps) => {
  return (
    <section className={`py-16 lg:py-24 bg-muted/30 ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
              Our Location
            </h2>
            <p className="font-body text-lg text-muted-foreground">
              While we primarily operate online, we're based in the heart of India's cultural capital
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map */}
            <div className="bg-card rounded-lg shadow-warm overflow-hidden border border-border">
              <div className="w-full h-96">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  title="Raagdhara Academy Location"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=19.0760,72.8777&z=14&output=embed"
                  className="border-0"
                ></iframe>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg shadow-warm p-6 border border-border">
                <div className="flex items-start">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mr-4 flex-shrink-0">
                    <Icon name="MapPinIcon" size={24} className="text-primary" />
                  </div>
                  // <div>
                  //   <h3 className="font-cta text-lg text-foreground mb-2">
                  //     Registered Office
                  //   </h3>
                  //   <p className="font-body text-foreground leading-relaxed">
                  //     Raagdhara Academy<br />
                  //     Cultural Arts Complex<br />
                  //     Andheri West, Mumbai - 400053<br />
                  //     Maharashtra, India
                  //   </p>
                  // </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-warm p-6 border border-border">
                <div className="flex items-start">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mr-4 flex-shrink-0">
                    <Icon name="GlobeAltIcon" size={24} className="text-success" />
                  </div>
                  <div>
                    <h3 className="font-cta text-lg text-foreground mb-2">
                      Online Classes
                    </h3>
                    <p className="font-body text-foreground leading-relaxed">
                      We conduct all our classes online via Zoom, making quality classical music education accessible to students worldwide. No matter where you are, you can learn from the comfort of your home.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-warm p-6 border border-border">
                <div className="flex items-start">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-full mr-4 flex-shrink-0">
                    <Icon name="ClockIcon" size={24} className="text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-cta text-lg text-foreground mb-2">
                      Timezone Flexibility
                    </h3>
                    <p className="font-body text-foreground leading-relaxed">
                      We accommodate students across all timezones. Our scheduling system automatically adjusts to your local time, ensuring convenient class timings whether you're in India, USA, UK, or anywhere else.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/10 rounded-lg p-6 border border-secondary/30">
                <div className="flex items-start">
                  <Icon name="InformationCircleIcon" size={24} className="text-secondary mr-3 flex-shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-foreground">
                    <strong>Note:</strong> We do not conduct in-person classes at this location. All teaching is done through our comprehensive online platform with high-quality video and audio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;