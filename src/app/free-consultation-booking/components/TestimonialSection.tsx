import Icon from '@/components/ui/AppIcon';

export default function TestimonialSection() {
  const testimonials = [
  {
    name: 'Priya S.',
    role: 'Software Engineer, USA',
    quote: 'The free consultation was super helpful! I wasn\'t sure if I could commit to learning classical music with my work schedule, but Vaishnavi ji explained everything clearly. Now I\'m 3 months into Hindustani Classical Vocal Music and loving it!',
    rating: 5
  },
  {
    name: 'Rajesh P.',
    role: 'Business Analyst, UK',
    quote: 'I\'m 35 and thought I was too old to start, but the consultation really put me at ease. No pressure, just genuine advice. Started with Popular and Film Music - Hindi and it\'s been amazing. Wish I\'d done this sooner!',
    rating: 5
  },
  {
    name: 'Ananya R.',
    role: 'Parent of 12-year-old student',
    quote: 'We had so many questions about the curriculum and timing. The consultation answered everything. My daughter has been learning Devotional - Hindi for 6 months now and we can see real progress. Very happy with our decision!',
    rating: 5
  }];


  return (
    <div className="bg-muted/30 rounded-lg p-8">
      <h2 className="font-headline text-2xl font-semibold text-foreground mb-2 text-center">
        What Students Say About Their Consultation
      </h2>
      <p className="font-body text-center text-muted-foreground mb-8">
        Hear from students who started their journey with a free consultation
      </p>
      <div className="space-y-6">
        {testimonials?.map((testimonial, index) =>
        <div key={index} className="bg-card rounded-lg p-6 shadow-warm">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-headline text-lg font-semibold text-foreground">
                    {testimonial?.name}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    {testimonial?.role}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial?.rating)]?.map((_, i) =>
                    <Icon key={i} name="StarIcon" size={16} className="text-secondary" variant="solid" />
                  )}
                </div>
              </div>
            </div>
            <p className="font-body text-sm text-foreground/80 italic">
              "{testimonial?.quote}"
            </p>
          </div>
        )}
      </div>
    </div>);

}