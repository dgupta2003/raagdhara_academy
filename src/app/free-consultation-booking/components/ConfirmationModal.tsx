'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    name: string;
    email: string;
    date: string;
    time: string;
    type: string;
  };
}

export default function ConfirmationModal({ isOpen, onClose, bookingDetails }: ConfirmationModalProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isOpen || !isHydrated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-warm-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
              <Icon name="CheckCircleIcon" size={48} className="text-success" variant="solid" />
            </div>
          </div>

          <h2 className="font-headline text-3xl font-semibold text-center text-foreground mb-4">
            Consultation Booked Successfully!
          </h2>
          
          <p className="font-body text-center text-muted-foreground mb-8">
            Your free consultation has been confirmed. We're excited to begin your musical journey!
          </p>

          <div className="bg-muted/30 rounded-lg p-6 space-y-4 mb-8">
            <div className="flex items-start space-x-3">
              <Icon name="UserIcon" size={20} className="text-secondary mt-1 flex-shrink-0" />
              <div>
                <p className="font-body text-sm text-muted-foreground">Student Name</p>
                <p className="font-body text-base font-medium text-foreground">{bookingDetails.name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Icon name="EnvelopeIcon" size={20} className="text-secondary mt-1 flex-shrink-0" />
              <div>
                <p className="font-body text-sm text-muted-foreground">Email Address</p>
                <p className="font-body text-base font-medium text-foreground">{bookingDetails.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Icon name="CalendarDaysIcon" size={20} className="text-secondary mt-1 flex-shrink-0" />
              <div>
                <p className="font-body text-sm text-muted-foreground">Consultation Date & Time</p>
                <p className="font-body text-base font-medium text-foreground">
                  {bookingDetails.date} at {bookingDetails.time}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Icon name="AcademicCapIcon" size={20} className="text-secondary mt-1 flex-shrink-0" />
              <div>
                <p className="font-body text-sm text-muted-foreground">Consultation Type</p>
                <p className="font-body text-base font-medium text-foreground">{bookingDetails.type}</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-6 mb-8">
            <h3 className="font-headline text-lg font-semibold text-foreground mb-4 flex items-center">
              <Icon name="InformationCircleIcon" size={24} className="text-secondary mr-2" />
              What Happens Next?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success mt-0.5 flex-shrink-0" />
                <span className="font-body text-sm text-foreground/80">
                  You'll receive a confirmation email with Google Meet link within 5 minutes
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success mt-0.5 flex-shrink-0" />
                <span className="font-body text-sm text-foreground/80">
                  A reminder will be sent 24 hours before your consultation
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success mt-0.5 flex-shrink-0" />
                <span className="font-body text-sm text-foreground/80">
                  Prepare any questions about your musical journey and learning goals
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success mt-0.5 flex-shrink-0" />
                <span className="font-body text-sm text-foreground/80">
                  Ensure you're in a quiet space with stable internet connection
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-cta text-sm rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
            >
              Return to Homepage
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-secondary text-secondary font-cta text-sm rounded-md hover:bg-secondary/5 transition-contemplative"
            >
              Book Another Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}