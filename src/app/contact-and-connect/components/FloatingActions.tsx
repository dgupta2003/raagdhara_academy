'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FloatingActionsProps {
  className?: string;
}

const FloatingActions = ({ className = '' }: FloatingActionsProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isHydrated) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`fixed bottom-6 right-6 z-40 flex flex-col space-y-3 ${className}`}>
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/message/A5LAV3JA5KIZM1"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center w-14 h-14 bg-success text-success-foreground rounded-full shadow-warm-lg hover:scale-110 transition-transform duration-300"
        aria-label="Contact via WhatsApp"
      >
        <Icon name="ChatBubbleLeftEllipsisIcon" size={28} />
        <span className="absolute right-16 bg-success text-success-foreground px-3 py-2 rounded-md font-cta text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Chat with us
        </span>
      </a>

      {/* Book Consultation Button */}
      <a
        href="/free-consultation-booking"
        className="group flex items-center justify-center w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-warm-lg hover:scale-110 transition-transform duration-300"
        aria-label="Book free consultation"
      >
        <Icon name="CalendarDaysIcon" size={28} />
        <span className="absolute right-16 bg-secondary text-secondary-foreground px-3 py-2 rounded-md font-cta text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Book Now
        </span>
      </a>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-warm-lg hover:scale-110 transition-transform duration-300 animate-fade-in"
          aria-label="Scroll to top"
        >
          <Icon name="ArrowUpIcon" size={28} />
        </button>
      )}
    </div>
  );
};

export default FloatingActions;