'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { trackCourseInteraction } from '@/lib/analytics';

interface BatchType {
  name: string;
  sessionsPerWeek: number;
  duration: string;
  price: number;
  priceUSD: number;
  description: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  batches: BatchType[];
  image: string;
  alt: string;
  specialNote?: string;
  externalLink?: string;
}

export default function CoursesInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showUSD, setShowUSD] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const standardBatches: BatchType[] = [
  {
    name: 'Normal',
    sessionsPerWeek: 2,
    duration: '10 months',
    price: 1500,
    priceUSD: 60,
    description: '2 sessions per week for comprehensive learning'
  },
  {
    name: 'Special',
    sessionsPerWeek: 3,
    duration: '6 months',
    price: 3000,
    priceUSD: 90,
    description: '3 sessions per week for accelerated progress'
  },
  {
    name: 'Personal',
    sessionsPerWeek: 2,
    duration: '10 months',
    price: 4000,
    priceUSD: 120,
    description: '1-on-1 personalized sessions'
  }];


  const bhatkhandeBatches: BatchType[] = [
  {
    name: 'Normal',
    sessionsPerWeek: 2,
    duration: 'Level-based',
    price: 3000,
    priceUSD: 120,
    description: '2 sessions per week for exam preparation'
  },
  {
    name: 'Special',
    sessionsPerWeek: 3,
    duration: 'Level-based',
    price: 6000,
    priceUSD: 180,
    description: '3 sessions per week for intensive preparation'
  },
  {
    name: 'Personal',
    sessionsPerWeek: 2,
    duration: 'Level-based',
    price: 8000,
    priceUSD: 240,
    description: '1-on-1 personalized exam coaching'
  }];


  const courses: Course[] = [
  {
    id: 1,
    title: 'Hindustani Classical Vocal Music',
    description: 'Master the art of Hindustani classical vocals with traditional training in ragas, taals, and classical compositions.',
    batches: standardBatches,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1ca63a40b-1767776619740.png",
    alt: 'Student practicing Hindustani classical vocal music'
  },
  {
    id: 2,
    title: 'Popular and Film Music - Hindi',
    description: 'Learn popular Bollywood songs and Hindi film music with proper technique and expression.',
    batches: standardBatches,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_107fd39f9-1767776619731.png",
    alt: 'Student learning popular Hindi film music'
  },
  {
    id: 3,
    title: 'Devotional - Hindi',
    description: 'Explore the spiritual dimension of music through Hindi devotional songs, bhajans, and kirtans.',
    batches: standardBatches,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b8b5bc42-1768113619584.png",
    alt: 'Traditional Indian devotional music with diya lamps and spiritual atmosphere'
  },
  {
    id: 4,
    title: 'Ghazal',
    description: 'Delve into the poetic world of Ghazals with proper pronunciation, expression, and classical nuances.',
    batches: standardBatches,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_15f306bf2-1769237280296.png",
    alt: 'Urdu poetry and Ghazal performance with traditional ambiance'
  },
  {
    id: 5,
    title: 'Bhatkhande Sangeet Vidyapeeth - Full Course',
    description: 'Complete certification course with level-based curriculum and examination preparation for Bhatkhande Sangeet Vidyapeeth.',
    batches: bhatkhandeBatches,
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_11bc0df0e-1769237283341.png",
    alt: 'Classical Indian music education and certification course materials',
    specialNote: 'Level-based course with examinations',
    externalLink: 'http://www.bsvidyapith.org/course.htm'
  }];


  const handleEnroll = () => {
    if (!isHydrated) return;
    
    // Track enrollment button click
    const courseName = selectedCourse 
      ? courses.find(c => c.id === selectedCourse)?.title || 'Unknown' :'General';
    trackCourseInteraction('enroll_clicked', courseName);
    
    window.location.href = '/free-consultation-booking';
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) =>
              <div key={i} className="h-96 bg-muted rounded"></div>
              )}
            </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="font-headline text-5xl md:text-6xl text-foreground animate-breathing">
          Courses & Offerings
        </h1>
        <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose from our diverse range of vocal music courses with flexible batch options
        </p>
      </section>

      {/* Currency Toggle and Fee Note */}
      <section className="flex flex-col items-center gap-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-2xl">
          <p className="text-sm text-foreground text-center font-medium">
            <Icon name="InformationCircleIcon" size={16} className="inline mr-1" />
            All fees listed are per month
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 shadow-warm">
          <span className="font-body text-sm text-muted-foreground">INR (Indian Students)</span>
          <button
            onClick={() => setShowUSD(!showUSD)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            showUSD ? 'bg-secondary' : 'bg-muted'}`
            }
            role="switch"
            aria-checked={showUSD}>

            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showUSD ? 'translate-x-6' : 'translate-x-1'}`
              } />

          </button>
          <span className="font-body text-sm text-muted-foreground">USD (NRI Students)</span>
        </div>
      </section>

      {/* Batch Types Overview */}
      <section className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg p-8">
        <h2 className="font-headline text-3xl text-foreground mb-6 text-center">Batch Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="UserGroupIcon" size={24} className="text-primary" />
              <h3 className="font-cta text-xl text-foreground">Normal</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-2">2 sessions per week</p>
            <p className="text-muted-foreground text-sm">10 months duration</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="SparklesIcon" size={24} className="text-secondary" />
              <h3 className="font-cta text-xl text-foreground">Special</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-2">3 sessions per week</p>
            <p className="text-muted-foreground text-sm">6 months duration</p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="UserIcon" size={24} className="text-accent" />
              <h3 className="font-cta text-xl text-foreground">Personal</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-2">1-on-1 personalized</p>
            <p className="text-muted-foreground text-sm">Flexible structure</p>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section>
        <h2 className="font-headline text-3xl text-foreground mb-8 text-center">Our Courses</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course) =>
          <div
            key={course.id}
            className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-warm-lg transition-contemplative"
            onClick={() => {
              setSelectedCourse(course.id);
              trackCourseInteraction('course_viewed', course.title);
            }}>
              {/* Course Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                src={course.image}
                alt={course.alt}
                className="w-full h-full object-cover hover:scale-105 transition-contemplative" />

              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="font-headline text-2xl text-foreground mb-3">{course.title}</h3>
                <p className="font-body text-muted-foreground mb-4">{course.description}</p>

                {course.specialNote && (
                  <div className="bg-accent/10 border border-accent/30 rounded-md p-3 mb-4">
                    <p className="text-sm text-accent font-medium">{course.specialNote}</p>
                  </div>
                )}

                {course.externalLink && (
                  <a
                    href={course.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackCourseInteraction('external_link_clicked', course.title);
                    }}
                    className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 text-sm mb-4 transition-contemplative">

                    <Icon name="ArrowTopRightOnSquareIcon" size={16} />
                    View Course Details
                  </a>
                )}

                {/* Batch Options */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-cta text-sm text-muted-foreground uppercase tracking-wide">Batch Options</h4>
                  {course.batches.map((batch, index) =>
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background rounded-md border border-border">

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-cta text-foreground">{batch.name}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{batch.sessionsPerWeek} sessions/week</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{batch.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-headline text-xl text-foreground">
                          {showUSD ? `$${batch.priceUSD}` : `₹${batch.price.toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </div>
                )}
                </div>

                {/* CTA Button */}
                <button
                onClick={handleEnroll}
                className="w-full px-6 py-3 bg-secondary text-secondary-foreground font-cta rounded-md hover:scale-105 shadow-warm hover:shadow-warm-lg transition-contemplative flex items-center justify-center gap-2">

                  <Icon name="AcademicCapIcon" size={20} />
                  Book Free Consultation
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>);

}