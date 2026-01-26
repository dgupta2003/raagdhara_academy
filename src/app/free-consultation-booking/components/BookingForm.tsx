'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import { trackBookingConversion, trackFormStep } from '@/lib/analytics';

interface BookingFormProps {
  selectedType: string;
  onSubmit: (formData: FormData) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  ageGroup: string;
  course: string;
  timezone: string;
  experience: string;
  goals: string;
  hearAbout: string;
}

// Declare Calendly global type
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement; prefill?: any; utm?: any }) => void;
    };
  }
}

export default function BookingForm({ selectedType, onSubmit }: BookingFormProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    ageGroup: '',
    course: '',
    timezone: 'Asia/Kolkata',
    experience: '',
    goals: '',
    hearAbout: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCalendly, setShowCalendly] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize Calendly inline widget when showCalendly becomes true
  useEffect(() => {
    if (showCalendly && window.Calendly) {
      const calendlyContainer = document.getElementById('calendly-inline-widget');
      if (calendlyContainer) {
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/raagdharamusic/30min',
          parentElement: calendlyContainer,
          prefill: {
            name: formData.name,
            email: formData.email,
            customAnswers: {
              a1: formData.phone,
              a2: formData.course,
              a3: formData.experience
            }
          }
        });
      }
    }
  }, [showCalendly]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!formData.ageGroup) newErrors.ageGroup = 'Please select an age group';
    if (!formData.course) newErrors.course = 'Please select a course';
    if (!formData.experience) newErrors.experience = 'Please select your experience level';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitError('Please fix the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Track form submission attempt
    trackFormStep('form_submitted', 'consultation_booking');

    try {
      const supabase = createClient();

      // Save booking to Supabase
      const { data: bookingData, error: dbError } = await supabase
        .from('consultation_bookings')
        .insert({
          student_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          country_code: formData.countryCode,
          age_group: formData.ageGroup,
          course_selection: formData.course,
          timezone: formData.timezone,
          experience_level: formData.experience,
          goals: formData.goals || null,
          hear_about: formData.hearAbout || null,
          consultation_type: selectedType
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save booking. Please try again.');
      }

      // Track successful booking conversion
      trackBookingConversion({
        consultationType: selectedType,
        course: formData.course,
        value: 0, // Free consultation
      });

      // Trigger emails in background (fire and forget - don't wait)
      supabase.functions.invoke('send-booking-notification', {
        body: {
          bookingData: {
            studentName: formData.name,
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
            ageGroup: formData.ageGroup,
            course: formData.course,
            timezone: formData.timezone,
            experience: formData.experience,
            goals: formData.goals
          },
          type: 'customer_confirmation'
        }
      }).then(response => {
        if (response.error) {
          console.warn('Customer email failed:', response.error);
        } else {
          console.log('Customer email sent successfully');
        }
      });
      
      supabase.functions.invoke('send-booking-notification', {
        body: {
          bookingData: {
            studentName: formData.name,
            email: formData.email,
            phone: formData.phone,
            countryCode: formData.countryCode,
            ageGroup: formData.ageGroup,
            course: formData.course,
            timezone: formData.timezone,
            experience: formData.experience,
            goals: formData.goals,
            hearAbout: formData.hearAbout
          },
          type: 'admin_notification'
        }
      }).then(response => {
        if (response.error) {
          console.warn('Admin email failed:', response.error);
        } else {
          console.log('Admin email sent successfully');
        }
      });

      // Success - show Calendly inline widget immediately
      onSubmit(formData);
      setShowCalendly(true);

    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit booking. Please try again.');
    } finally {
      // Always reset submitting state immediately to prevent freezing
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Track key form field interactions for funnel analysis
    if (field === 'course') {
      trackFormStep('course_selected', 'consultation_booking');
    } else if (field === 'experience') {
      trackFormStep('experience_selected', 'consultation_booking');
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg p-8 shadow-warm">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Show Calendly inline widget after successful form submission
  if (showCalendly) {
    return (
      <>
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
        <div className="bg-card rounded-lg p-8 shadow-warm space-y-6">
          <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-md flex items-start space-x-3">
            <Icon name="CheckCircleIcon" size={24} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body font-semibold">Form Submitted Successfully!</p>
              <p className="font-body text-sm mt-1">Now select your preferred consultation time below:</p>
            </div>
          </div>
          
          <div 
            id="calendly-inline-widget" 
            className="calendly-inline-widget" 
            style={{ minWidth: '320px', height: '700px' }}
          ></div>

          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
            <Icon name="InformationCircleIcon" size={20} className="text-secondary mt-0.5 flex-shrink-0" />
            <p className="font-body text-sm text-foreground/80">
              After booking your time slot, you'll receive a confirmation email with the Google Meet link and preparation guidelines.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      
      <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 shadow-warm space-y-8">
        {/* Error Message */}
        {submitError && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-md">
            <p className="font-body text-sm">{submitError}</p>
          </div>
        )}

        {/* Student Information Section */}
        <div>
          <h3 className="font-headline text-xl font-semibold text-foreground mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block font-body text-sm font-medium text-foreground mb-2">
                Student Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.name ? 'border-error' : 'border-border'
                } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
                placeholder="Enter student's full name"
              />
              {errors.name && <p className="mt-1 text-sm text-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block font-body text-sm font-medium text-foreground mb-2">
                Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.email ? 'border-error' : 'border-border'
                } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block font-body text-sm font-medium text-foreground mb-2">
                Phone Number <span className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="countryCode"
                  value={formData.countryCode}
                  onChange={(e) => handleChange('countryCode', e.target.value)}
                  className="w-28 px-2 py-3 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative"
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+971">+971 (AE)</option>
                  <option value="+65">+65 (SG)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+81">+81 (JP)</option>
                  <option value="+86">+86 (CN)</option>
                  <option value="+33">+33 (FR)</option>
                  <option value="+49">+49 (DE)</option>
                </select>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-md border ${
                    errors.phone ? 'border-error' : 'border-border'
                  } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
                  placeholder="98765 43210"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-error">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="ageGroup" className="block font-body text-sm font-medium text-foreground mb-2">
                Age Group <span className="text-error">*</span>
              </label>
              <select
                id="ageGroup"
                value={formData.ageGroup}
                onChange={(e) => handleChange('ageGroup', e.target.value)}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.ageGroup ? 'border-error' : 'border-border'
                } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
              >
                <option value="">Select age group</option>
                <option value="6-12">6-12</option>
                <option value="13-21">13-21</option>
                <option value="22-30">22-30</option>
                <option value="31-40">31-40</option>
                <option value="40+">40+</option>
              </select>
              {errors.ageGroup && <p className="mt-1 text-sm text-error">{errors.ageGroup}</p>}
            </div>
          </div>
        </div>

        {/* Course Selection Section */}
        <div>
          <h3 className="font-headline text-xl font-semibold text-foreground mb-4">Course Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="course" className="block font-body text-sm font-medium text-foreground mb-2">
                Select Course <span className="text-error">*</span>
              </label>
              <select
                id="course"
                value={formData.course}
                onChange={(e) => handleChange('course', e.target.value)}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.course ? 'border-error' : 'border-border'
                } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
              >
                <option value="">Select a course</option>
                <option value="hindustani-classical">Hindustani Classical Vocal Music</option>
                <option value="popular-film-music">Popular and Film Music - Hindi</option>
                <option value="hindi-devotional">Hindi Devotional</option>
                <option value="ghazal">Ghazal</option>
                <option value="bhatkhande-course">Bhatkhande Sangeet Vidyapeeth Course</option>
              </select>
              {errors.course && <p className="mt-1 text-sm text-error">{errors.course}</p>}
            </div>

            <div>
              <label htmlFor="timezone" className="block font-body text-sm font-medium text-foreground mb-2">
                Timezone
              </label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative"
              >
                <option value="Asia/Kolkata">IST (India Standard Time)</option>
                <option value="America/New_York">EST (Eastern Time)</option>
                <option value="America/Los_Angeles">PST (Pacific Time)</option>
                <option value="Europe/London">GMT (London)</option>
                <option value="Asia/Dubai">GST (Dubai)</option>
                <option value="Asia/Singapore">SGT (Singapore)</option>
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="block font-body text-sm font-medium text-foreground mb-2">
                Musical Experience Level <span className="text-error">*</span>
              </label>
              <select
                id="experience"
                value={formData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.experience ? 'border-error' : 'border-border'
                } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
              >
                <option value="">Select your experience level</option>
                <option value="complete-beginner">Complete Beginner (No prior training)</option>
                <option value="some-basics">Some Basics (1-2 years informal learning)</option>
                <option value="intermediate">Intermediate (3-5 years training)</option>
                <option value="advanced">Advanced (5+ years, seeking refinement)</option>
                <option value="professional">Professional (Performance experience)</option>
              </select>
              {errors.experience && <p className="mt-1 text-sm text-error">{errors.experience}</p>}
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div>
          <h3 className="font-headline text-xl font-semibold text-foreground mb-4">Additional Information</h3>
          <div className="space-y-6">
            <div>
              <label htmlFor="goals" className="block font-body text-sm font-medium text-foreground mb-2">
                Learning Goals & Expectations
              </label>
              <textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => handleChange('goals', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative resize-none"
                placeholder="Tell us about your musical aspirations, specific ragas you're interested in, or any particular goals you have..."
              />
            </div>

            <div>
              <label htmlFor="hearAbout" className="block font-body text-sm font-medium text-foreground mb-2">
                How did you hear about Raagdhara Academy?
              </label>
              <select
                id="hearAbout"
                value={formData.hearAbout}
                onChange={(e) => handleChange('hearAbout', e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative"
              >
                <option value="">Select an option</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
                <option value="google-search">Google Search</option>
                <option value="friend-referral">Friend/Family Referral</option>
                <option value="student-referral">Current Student Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold py-4 px-6 rounded-md transition-contemplative focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Icon name="CalendarIcon" size={20} />
                <span>Submit & Book Consultation</span>
              </>
            )}
          </button>

          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
            <Icon name="InformationCircleIcon" size={20} className="text-secondary mt-0.5 flex-shrink-0" />
            <p className="font-body text-sm text-foreground/80">
              After submitting this form, you'll see the calendar below to select your preferred date and time. You'll receive a confirmation email with a Google Meet link and preparation guidelines.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}