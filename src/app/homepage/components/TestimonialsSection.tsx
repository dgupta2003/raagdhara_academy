'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  course: string;
}

const TestimonialsSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya S.",
    location: "Mumbai, India",
    rating: 5,
    text: "I've been learning for 6 months and honestly, my voice has improved so much! Vaishnavi ma'am breaks down complex ragas in a way that actually makes sense. She's patient and really knows her stuff. Best decision I made this year!",
    course: "Hindustani Classical Vocal Music"
  },
  {
    id: 2,
    name: "Rajesh K.",
    location: "London, UK",
    rating: 5,
    text: "As an NRI, I always wanted to learn classical music but never found the right teacher. The online classes work perfectly with my schedule and the personal attention is amazing. Finally reconnecting with my roots through music!",
    course: "Hindustani Classical Vocal Music"
  },
  {
    id: 3,
    name: "Ananya D.",
    location: "Bangalore, India",
    rating: 5,
    text: "Started from absolute basics and now I can sing full bandish compositions! The structured approach really helps. Practice sessions are challenging but so rewarding. If you're serious about learning, this is the place.",
    course: "Ghazal"
  },
  {
    id: 4,
    name: "Vikram P.",
    location: "Toronto, Canada",
    rating: 5,
    text: "Love the mix of traditional teaching with modern tools. The practice resources are super helpful and the feedback after each class is detailed. My progress has been faster than I expected. Totally worth it!",
    course: "Popular and Film Music - Hindi"
  }];


  const handlePrevious = () => {
    setActiveIndex((prev) => prev === 0 ? testimonials.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setActiveIndex((prev) => prev === testimonials.length - 1 ? 0 : prev + 1);
  };

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-cta text-sm rounded-full mb-6">
            Student Stories
          </div>
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary mb-6">
            Voices of Transformation
          </h2>
          <p className="font-body text-lg text-muted-foreground leading-relaxed">
            Hear from students across the globe about their musical journey with Raagdhara Academy.
          </p>
        </div>

        {/* Testimonial Display */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-background rounded-lg shadow-warm-lg p-8 lg:p-12">
            <div className="space-y-6">
              {/* Rating */}
              <div className="flex items-center space-x-1">
                {[...Array(activeTestimonial.rating)].map((_, i) =>
                  <Icon key={i} name="StarIcon" size={20} className="text-secondary" variant="solid" />
                )}
              </div>

              {/* Quote */}
              <blockquote className="font-body text-lg lg:text-xl text-foreground leading-relaxed italic">
                "{activeTestimonial.text}"
              </blockquote>

              {/* Student Info */}
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="font-headline text-xl text-primary">
                  {activeTestimonial.name}
                </p>
                <p className="font-body text-sm text-muted-foreground flex items-center">
                  <Icon name="MapPinIcon" size={16} className="mr-2" />
                  {activeTestimonial.location}
                </p>
                <p className="inline-block px-3 py-1 bg-secondary/10 text-secondary font-cta text-xs rounded-full">
                  {activeTestimonial.course}
                </p>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-2 text-primary hover:text-secondary transition-contemplative font-cta text-sm"
                aria-label="Previous testimonial">

                <Icon name="ChevronLeftIcon" size={20} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Dots Indicator */}
              {isHydrated &&
              <div className="flex items-center space-x-2">
                  {testimonials.map((_, index) =>
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-secondary w-8' : 'bg-border'}`
                  }
                  aria-label={`Go to testimonial ${index + 1}`} />

                )}
                </div>
              }

              <button
                onClick={handleNext}
                className="flex items-center space-x-2 text-primary hover:text-secondary transition-contemplative font-cta text-sm"
                aria-label="Next testimonial">

                <span className="hidden sm:inline">Next</span>
                <Icon name="ChevronRightIcon" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default TestimonialsSection;