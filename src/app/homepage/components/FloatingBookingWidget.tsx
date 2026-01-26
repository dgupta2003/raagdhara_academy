'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FloatingBookingWidgetProps {
  onBookConsultation: () => void;
}

const FloatingBookingWidget = ({ onBookConsultation }: FloatingBookingWidgetProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show widget after scrolling 800px
      const shouldShowBasedOnScroll = scrollPosition > 800;
      
      // Hide widget when footer is approaching (within 600px of bottom)
      const distanceFromBottom = documentHeight - (scrollPosition + windowHeight);
      const shouldHideNearFooter = distanceFromBottom < 600;
      
      setIsVisible(shouldShowBasedOnScroll && !shouldHideNearFooter);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHydrated]);

  if (!isHydrated) return null;

  return (
    <>
      {/* Desktop Floating Widget */}
      <div
        className={`hidden lg:block fixed right-8 bottom-8 z-40 transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-card border-2 border-secondary rounded-lg shadow-warm-lg p-6 w-80">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <Icon name="CalendarIcon" size={24} className="text-secondary" />
              </div>
              <div>
                <p className="font-cta text-sm text-foreground">Free Consultation</p>
                <p className="font-body text-xs text-muted-foreground">30 Minutes</p>
              </div>
            </div>
          </div>

          <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed">
            Book your free consultation to discuss your musical goals and find the perfect learning path.
          </p>

          <button
            onClick={onBookConsultation}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground font-cta text-sm rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
          >
            Schedule Now
            <Icon name="ArrowRightIcon" size={16} className="ml-2" />
          </button>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Icon name="ClockIcon" size={14} />
                <span>Flexible Timing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Button */}
      <button
        onClick={onBookConsultation}
        className={`lg:hidden fixed right-4 bottom-4 z-40 w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-warm-lg flex items-center justify-center transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-75 pointer-events-none'
        }`}
        aria-label="Book consultation"
      >
        <Icon name="CalendarIcon" size={24} />
      </button>
    </>
  );
};

export default FloatingBookingWidget;