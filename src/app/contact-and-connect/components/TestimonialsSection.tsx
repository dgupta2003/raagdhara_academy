'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  course: string;
  rating: number;
  testimonial: string;
  date: string;
}

const testimonials: Testimonial[] = [
{
  id: 1,
  name: 'Priya S.',
  location: 'Mumbai',
  course: 'Hindustani Classical Vocal Music',
  rating: 5,
  testimonial: 'Honestly, I was skeptical about online classes at first, but wow! The way Vaishnavi ji explains ragas makes so much sense. I finally understand what my previous teachers were trying to tell me for years. My practice sessions are actually enjoyable now!',
  date: 'Nov 2025'
},
{
  id: 2,
  name: 'Rajesh K.',
  location: 'Bangalore',
  course: 'Hindustani Classical Vocal Music',
  rating: 5,
  testimonial: 'I work full-time and was worried I wouldn\'t be able to keep up, but the flexible timings are a lifesaver. Been learning for 6 months now and I can actually sing a proper bandish! My family is shocked lol',
  date: 'Oct 2025'
},
{
  id: 3,
  name: 'Anjali D.',
  location: 'London',
  course: 'Devotional - Hindi',
  rating: 5,
  testimonial: 'As someone who grew up in the UK, I always felt disconnected from this part of my culture. Learning classical music has been so fulfilling. The classes work perfectly with my timezone too. Highly recommend if you\'re abroad!',
  date: 'Sep 2025'
},
{
  id: 4,
  name: 'Arjun P.',
  location: 'Delhi',
  course: 'Hindustani Classical Vocal Music',
  rating: 5,
  testimonial: 'The level of detail in each class is incredible. We spend entire sessions just on one raga and I love it. If you\'re serious about learning classical music properly, this is the place. No shortcuts, just pure learning.',
  date: 'Nov 2025'
},
{
  id: 5,
  name: 'Meera T.',
  location: 'Chennai',
  course: 'Bhatkhande Sangeet Vidyapeeth',
  rating: 5,
  testimonial: 'My daughter is 10 and she looks forward to her classes every week! Vaishnavi ji is so patient with kids. She\'s learned so much in just a year - from basic swaras to singing small compositions. Worth every penny.',
  date: 'Oct 2025'
},
{
  id: 6,
  name: 'Vikram S.',
  location: 'Toronto',
  course: 'Ghazal',
  rating: 5,
  testimonial: 'The personalized feedback after each class really helps. I record my practice and get detailed notes on what to improve. It\'s like having a guru who actually cares about your progress. The community of students is great too!',
  date: 'Sep 2025'
}];


interface TestimonialsSectionProps {
  className?: string;
}

const TestimonialsSection = ({ className = '' }: TestimonialsSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section className={`py-16 lg:py-24 bg-card ${className}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-10 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) =>
            <div key={i} className="bg-background rounded-lg p-6 shadow-warm animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full mr-4"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>);

  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + Math.ceil(testimonials.length / 3)) % Math.ceil(testimonials.length / 3));
  };

  const visibleTestimonials = testimonials.slice(activeIndex * 3, activeIndex * 3 + 3);

  return (
    <section className={`py-16 lg:py-24 bg-card ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
            Student Success Stories
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from our students about their transformative journey with classical music at Raagdhara Academy
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visibleTestimonials.map((testimonial) =>
          <div
            key={testimonial.id}
            className="bg-background rounded-lg p-6 shadow-warm hover:shadow-warm-lg transition-contemplative border border-border">

              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cta text-lg text-foreground">
                    {testimonial.name}
                  </h3>
                  <div className="flex items-center">
                    {[...Array(testimonial.rating)].map((_, i) =>
                      <Icon key={i} name="StarIcon" size={16} className="text-warning fill-current" />
                    )}
                  </div>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  {testimonial.location}
                </p>
                <p className="font-body text-xs text-secondary mt-1">
                  {testimonial.course}
                </p>
              </div>

              {/* Testimonial Text */}
              <p className="font-body text-sm text-foreground leading-relaxed mb-4 italic">
                "{testimonial.testimonial}"
              </p>

              {/* Date */}
              <p className="font-body text-xs text-muted-foreground">
                {testimonial.date}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePrev}
            className="p-3 bg-secondary text-secondary-foreground rounded-full shadow-warm hover:shadow-warm-lg hover:scale-110 transition-contemplative"
            aria-label="Previous testimonials">

            <Icon name="ChevronLeftIcon" size={24} />
          </button>
          <div className="flex space-x-2">
            {[...Array(Math.ceil(testimonials.length / 3))].map((_, i) =>
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'bg-secondary w-8' : 'bg-border'}`
              }
              aria-label={`Go to testimonial set ${i + 1}`}>
            </button>
            )}
          </div>
          <button
            onClick={handleNext}
            className="p-3 bg-secondary text-secondary-foreground rounded-full shadow-warm hover:shadow-warm-lg hover:scale-110 transition-contemplative"
            aria-label="Next testimonials">

            <Icon name="ChevronRightIcon" size={24} />
          </button>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="font-body text-lg text-muted-foreground mb-6">
            Ready to start your own musical journey?
          </p>
          <a
            href="/free-consultation-booking"
            className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground font-cta text-base rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative">

            Book Free Consultation
            <Icon name="ArrowRightIcon" size={20} className="ml-2" />
          </a>
        </div>
      </div>
    </section>);

};

export default TestimonialsSection;