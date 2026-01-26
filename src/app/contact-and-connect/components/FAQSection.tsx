'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: 'How do I book a free consultation?',
    answer: 'You can book a free 30-minute consultation by clicking the "Book Free Consultation" button on any page, or by visiting our dedicated booking page. Simply select your preferred date and time, and you\'ll receive a confirmation email with the meeting link.',
    category: 'Booking'
  },
  {
    id: 2,
    question: 'What are your response times for different contact methods?',
    answer: 'WhatsApp queries are typically answered within 15 minutes during office hours. Phone calls receive immediate response during business hours. Email inquiries are responded to within 24 hours on business days. Consultation bookings are confirmed within 48 hours.',
    category: 'Response Times'
  },
  {
    id: 3,
    question: 'Can I contact you outside office hours?',
    answer: 'While our official office hours are Monday-Friday 10 AM - 7 PM IST and Saturday 10 AM - 5 PM IST, you can send us messages via WhatsApp or email anytime. We\'ll respond as soon as we\'re available. For urgent matters, please mention "Urgent" in your message.',
    category: 'Availability'
  },
  {
    id: 4,
    question: 'Do you offer consultations for international students?',
    answer: 'Absolutely! We work with students from around the world. Our consultation scheduling system is timezone-smart, making it easy to find a convenient time regardless of your location. We have experience teaching students from USA, UK, Canada, Australia, and many other countries.',
    category: 'International'
  },
  {
    id: 5,
    question: 'What information should I include in my inquiry?',
    answer: 'Please include your name, contact details, your current level of musical experience (beginner/intermediate/advanced), your learning goals, and any specific questions you have about our courses. This helps us provide you with the most relevant information.',
    category: 'Inquiries'
  },
  {
    id: 6,
    question: 'How can I join your social media community?',
    answer: 'You can follow us on Instagram (@raagdhara), YouTube (@raagdhara), Facebook (Raagdhara Academy), and Twitter (@raagdhara). We regularly share student performances, practice tips, and cultural insights. Join our growing community of classical music enthusiasts!',
    category: 'Community'
  },
  {
    id: 7,
    question: 'Is there a way to speak with current students?',
    answer: 'Yes! We can arrange for you to speak with our current students or alumni during your free consultation. Many of our students are happy to share their experiences and answer questions about their learning journey with us.',
    category: 'Student Connect'
  },
  {
    id: 8,
    question: 'What if I need to reschedule my consultation?',
    answer: 'You can reschedule your consultation by contacting us via WhatsApp or email at least 24 hours before your scheduled time. We\'ll be happy to find a new time that works better for you. Please note that last-minute cancellations may require rebooking.',
    category: 'Booking'
  }
];

interface FAQSectionProps {
  className?: string;
}

const FAQSection = ({ className = '' }: FAQSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section className={`py-16 lg:py-24 bg-background ${className}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="h-10 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-lg p-6 shadow-warm animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className={`py-16 lg:py-24 bg-background ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="font-body text-lg text-muted-foreground">
              Find quick answers to common questions about contacting us and our services
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-card rounded-lg shadow-warm border border-border overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                  aria-expanded={openId === faq.id}
                >
                  <div className="flex-1 pr-4">
                    <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-cta rounded-full mb-2">
                      {faq.category}
                    </span>
                    <h3 className="font-cta text-lg text-foreground">
                      {faq.question}
                    </h3>
                  </div>
                  <Icon
                    name={openId === faq.id ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                    size={24}
                    className="text-primary flex-shrink-0 transition-transform duration-300"
                  />
                </button>

                {openId === faq.id && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <p className="font-body text-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still Have Questions CTA */}
          <div className="mt-12 text-center p-8 bg-card rounded-lg shadow-warm border border-border">
            <Icon name="QuestionMarkCircleIcon" size={48} className="text-secondary mx-auto mb-4" />
            <h3 className="font-headline text-2xl text-foreground mb-3">
              Still Have Questions?
            </h3>
            <p className="font-body text-muted-foreground mb-6">
              We're here to help! Reach out to us through any of our contact channels.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/message/A5LAV3JA5KIZM1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-success text-success-foreground font-cta text-sm rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
              >
                <Icon name="ChatBubbleLeftEllipsisIcon" size={18} className="mr-2" />
                WhatsApp Us
              </a>
              <a
                href="#contact-form"
                className="inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground font-cta text-sm rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
              >
                <Icon name="EnvelopeIcon" size={18} className="mr-2" />
                Send Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;