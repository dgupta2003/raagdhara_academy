'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      question: 'Is the consultation really free?',
      answer: 'Yes, absolutely! The 30-minute consultation is completely free with no obligations. It\'s our way of helping you understand if classical music training is right for you and how we can support your musical journey.'
    },
    {
      question: 'What happens during the consultation?',
      answer: 'During the consultation, Vaishnavi Gupta will assess your current musical level, discuss your goals and aspirations, answer your questions about the curriculum, and recommend a personalized learning path. You\'ll also get to experience her teaching style firsthand.'
    },
    {
      question: 'Do I need any prior musical knowledge?',
      answer: 'Not at all! The consultation is designed for students of all levels—from complete beginners to advanced learners seeking refinement. We\'ll tailor the discussion to your current experience level.'
    },
    {
      question: 'How soon can I schedule my consultation?',
      answer: 'You can typically schedule a consultation within 2-3 days of booking. We offer flexible time slots to accommodate different time zones, especially for our international students.'
    },
    {
      question: 'What if I need to reschedule?',
      answer: 'We understand that schedules change. You can reschedule your consultation up to 24 hours before the scheduled time by contacting us via email or WhatsApp. We\'ll do our best to accommodate your new preferred time.'
    },
    {
      question: 'Will I receive course materials during consultation?',
      answer: 'The consultation is primarily for assessment and discussion. However, you\'ll receive a personalized learning roadmap via email after the session, along with information about course enrollment and next steps.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-card rounded-lg p-8 shadow-warm">
      <h2 className="font-headline text-2xl font-semibold text-foreground mb-2">
        Frequently Asked Questions
      </h2>
      <p className="font-body text-muted-foreground mb-8">
        Common questions about the free consultation process
      </p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-contemplative"
            >
              <span className="font-headline text-base font-semibold text-foreground pr-4">
                {faq.question}
              </span>
              <Icon
                name="ChevronDownIcon"
                size={20}
                className={`text-secondary flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="p-5 pt-0 font-body text-sm text-foreground/80">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-secondary/5 border border-secondary/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="QuestionMarkCircleIcon" size={24} className="text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-headline text-base font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="font-body text-sm text-foreground/70 mb-4">
              Feel free to reach out via WhatsApp or email. We're here to help you begin your musical journey with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://wa.me/message/A5LAV3JA5KIZM1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-success text-white font-cta text-sm rounded-md hover:bg-success/90 transition-contemplative"
              >
                <Icon name="ChatBubbleLeftRightIcon" size={16} className="mr-2" />
                WhatsApp Us
              </a>
              <a
                href="mailto:info@raagdhara.com"
                className="inline-flex items-center px-4 py-2 border-2 border-secondary text-secondary font-cta text-sm rounded-md hover:bg-secondary/5 transition-contemplative"
              >
                <Icon name="EnvelopeIcon" size={16} className="mr-2" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}