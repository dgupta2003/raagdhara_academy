'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FormData {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const inquiryTypes = [
  'Course Information',
  'Consultation Booking',
  'Technical Support',
  'Collaboration Inquiry',
  'General Question',
  'Other'
];

const ContactFormSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section id="contact-form" className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-background rounded-lg shadow-warm p-8 animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-full mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiryType: '',
        message: ''
      });
      setErrors({});

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <section id="contact-form" className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
              Send Us a Message
            </h2>
            <p className="font-body text-lg text-muted-foreground">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>

          <div className="bg-background rounded-lg shadow-warm p-6 lg:p-10">
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-success/10 border border-success rounded-md flex items-start">
                <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-cta text-success mb-1">Message Sent Successfully!</p>
                  <p className="font-body text-sm text-foreground">
                    Thank you for reaching out. We'll respond to your inquiry within 24 hours.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block font-body text-sm font-medium text-foreground mb-2">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-input border ${errors.name ? 'border-error' : 'border-border'} rounded-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error flex items-center">
                    <Icon name="ExclamationCircleIcon" size={16} className="mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block font-body text-sm font-medium text-foreground mb-2">
                  Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-input border ${errors.email ? 'border-error' : 'border-border'} rounded-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error flex items-center">
                    <Icon name="ExclamationCircleIcon" size={16} className="mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block font-body text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-input border ${errors.phone ? 'border-error' : 'border-border'} rounded-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
                  placeholder="9876543210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-error flex items-center">
                    <Icon name="ExclamationCircleIcon" size={16} className="mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Inquiry Type */}
              <div>
                <label htmlFor="inquiryType" className="block font-body text-sm font-medium text-foreground mb-2">
                  Inquiry Type
                </label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-input border border-border rounded-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                >
                  <option value="">Select inquiry type</option>
                  {inquiryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block font-body text-sm font-medium text-foreground mb-2">
                  Message <span className="text-error">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full px-4 py-3 bg-input border ${errors.message ? 'border-error' : 'border-border'} rounded-md font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none`}
                  placeholder="Tell us about your inquiry or questions..."
                ></textarea>
                {errors.message && (
                  <p className="mt-1 text-sm text-error flex items-center">
                    <Icon name="ExclamationCircleIcon" size={16} className="mr-1" />
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-secondary text-secondary-foreground font-cta text-base rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="ArrowPathIcon" size={20} className="mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon name="PaperAirplaneIcon" size={20} className="mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactFormSection;