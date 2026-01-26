'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isHydrated]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-warm-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="font-headline text-2xl text-primary mb-1">
              Book Free Consultation
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              30-minute session to discuss your musical journey
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-contemplative"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" size={24} className="text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Calendly Embed Placeholder */}
          <div className="bg-muted rounded-lg p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Icon name="CalendarIcon" size={40} className="text-secondary" />
            </div>
            <div className="space-y-2">
              <p className="font-headline text-xl text-foreground">
                Calendly Integration
              </p>
              <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
                In production, this area will display the Calendly booking widget with available time slots, timezone detection, and automated confirmations.
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-cta text-xs rounded-full">
                API Integration: Calendly
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <p className="font-cta text-sm text-foreground uppercase tracking-wide">
              What to Expect
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-cta text-sm text-foreground">Personalized Assessment</p>
                  <p className="font-body text-xs text-muted-foreground">Discuss your current level and goals</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-cta text-sm text-foreground">Course Recommendations</p>
                  <p className="font-body text-xs text-muted-foreground">Find the perfect learning path</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-cta text-sm text-foreground">Q&A Session</p>
                  <p className="font-body text-xs text-muted-foreground">Ask any questions about learning</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-cta text-sm text-foreground">No Obligation</p>
                  <p className="font-body text-xs text-muted-foreground">Completely free with no commitment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Alternative */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <p className="font-cta text-sm text-foreground">
              Prefer to connect directly?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/message/A5LAV3JA5KIZM1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-success text-success-foreground font-cta text-sm rounded-md hover:scale-105 transition-contemplative"
              >
                <Icon name="ChatBubbleLeftRightIcon" size={18} className="mr-2" />
                WhatsApp Us
              </a>
              <a
                href="mailto:info@raagdhara.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-muted text-foreground font-cta text-sm rounded-md hover:bg-muted/80 transition-contemplative"
              >
                <Icon name="EnvelopeIcon" size={18} className="mr-2" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;