'use client';

import { useState } from 'react';
import ConsultationTypeCard from './ConsultationTypeCard';
import BookingForm from './BookingForm';
import PreparationGuide from './PreparationGuide';
import TestimonialSection from './TestimonialSection';
import FAQSection from './FAQSection';

interface ConsultationType {
  id: string;
  title: string;
  duration: string;
  description: string;
  icon: string;
  features: string[];
}

export default function BookingInteractive() {
  const [selectedType, setSelectedType] = useState<string>('beginner');

  const consultationTypes: ConsultationType[] = [
    {
      id: 'beginner',
      title: 'Beginner Assessment',
      duration: '30 minutes',
      description: 'Perfect for those new to Indian classical music or with minimal prior training',
      icon: 'AcademicCapIcon',
      features: [
        'Introduction to classical music fundamentals',
        'Voice assessment and range evaluation',
        'Personalized learning path recommendation',
        'Course structure and curriculum overview'
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Coaching Discussion',
      duration: '30 minutes',
      description: 'For experienced students seeking refinement and advanced training',
      icon: 'MusicalNoteIcon',
      features: [
        'Current skill level assessment',
        'Advanced raga and taal discussion',
        'Performance preparation guidance',
        'Specialized training recommendations'
      ]
    },
    {
      id: 'parent',
      title: 'Parent Consultation',
      duration: '30 minutes',
      description: 'Discuss your child\'s musical education journey and learning needs',
      icon: 'UserGroupIcon',
      features: [
        'Age-appropriate curriculum discussion',
        'Child development through music',
        'Flexible scheduling options',
        'Progress tracking and parental involvement'
      ]
    }
  ];

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleFormSubmit = () => {
    // Calendly handles the booking directly, no form submission needed
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">
              Choose Your Consultation Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {consultationTypes.map((type) => (
                <ConsultationTypeCard
                  key={type.id}
                  type={type}
                  isSelected={selectedType === type.id}
                  onSelect={handleTypeSelect}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">
              Book Your Free Consultation
            </h2>
            <BookingForm selectedType={selectedType} onSubmit={handleFormSubmit} />
          </div>

          <FAQSection />
        </div>

        <div className="space-y-8">
          <PreparationGuide />
          <TestimonialSection />
        </div>
      </div>
    </div>
  );
}