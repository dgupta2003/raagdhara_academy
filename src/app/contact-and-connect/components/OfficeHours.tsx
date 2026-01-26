import Icon from '@/components/ui/AppIcon';

interface OfficeHour {
  id: number;
  day: string;
  hours: string;
  isToday: boolean;
}

const officeHours: OfficeHour[] = [
  { id: 1, day: 'Monday - Saturday', hours: '9:00 AM - 6:00 PM IST', isToday: false },
  { id: 2, day: 'Sunday', hours: '9:00 AM - 9:00 PM IST', isToday: false }
];

interface OfficeHoursProps {
  className?: string;
}

const OfficeHours = ({ className = '' }: OfficeHoursProps) => {
  return (
    <section className={`py-16 lg:py-24 bg-muted/30 ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
              Office Hours & Availability
            </h2>
            <p className="font-body text-lg text-muted-foreground">
              We're here to assist you during the following hours (Indian Standard Time)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Office Hours Card */}
            <div className="bg-card rounded-lg shadow-warm p-8 border border-border">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mr-4">
                  <Icon name="ClockIcon" size={24} className="text-primary" />
                </div>
                <h3 className="font-headline text-2xl text-foreground">
                  Contact Hours
                </h3>
              </div>

              <div className="space-y-4">
                {officeHours.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`flex justify-between items-center py-3 border-b border-border last:border-b-0 ${schedule.isToday ? 'bg-secondary/5 -mx-4 px-4 rounded' : ''}`}
                  >
                    <span className="font-body text-foreground font-medium">
                      {schedule.day}
                    </span>
                    <span className="font-body text-muted-foreground">
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-md">
                <p className="font-body text-sm text-foreground flex items-start">
                  <Icon name="InformationCircleIcon" size={20} className="text-warning mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Response times may vary during festivals and holidays. We'll notify you of any schedule changes in advance.
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Response Info */}
            <div className="bg-card rounded-lg shadow-warm p-8 border border-border">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mr-4">
                  <Icon name="BoltIcon" size={24} className="text-success" />
                </div>
                <h3 className="font-headline text-2xl text-foreground">
                  Response Times
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <Icon name="ChatBubbleLeftEllipsisIcon" size={24} className="text-success mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-cta text-foreground mb-1">WhatsApp</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Instant to 15 minutes during office hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Icon name="PhoneIcon" size={24} className="text-primary mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-cta text-foreground mb-1">Phone</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Immediate response during office hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Icon name="EnvelopeIcon" size={24} className="text-secondary mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-cta text-foreground mb-1">Email</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Within 24 hours on business days
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Icon name="CalendarDaysIcon" size={24} className="text-accent mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-cta text-foreground mb-1">Consultation</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Scheduled within 48 hours of booking
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-md">
                <p className="font-body text-sm text-foreground flex items-start">
                  <Icon name="CheckCircleIcon" size={20} className="text-success mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    For urgent inquiries, WhatsApp is your fastest option for immediate assistance.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfficeHours;