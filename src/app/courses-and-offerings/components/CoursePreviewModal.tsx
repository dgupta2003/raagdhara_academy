'use client';

import { useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface CoursePreviewModalProps {
  course: {
    id: number;
    title: string;
    subtitle: string;
    level: string;
    duration: string;
    sessions: number;
    image: string;
    alt: string;
    previewVideo: string;
    curriculum: string[];
    instructor: {
      name: string;
      credentials: string;
      image: string;
      alt: string;
    };
  } | null;
  onClose: () => void;
}

export default function CoursePreviewModal({ course, onClose }: CoursePreviewModalProps) {
  useEffect(() => {
    if (course) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [course]);

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-warm-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="font-headline text-2xl text-foreground">Course Preview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-contemplative"
            aria-label="Close preview"
          >
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={course.previewVideo}
              title={`${course.title} Preview`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            ></iframe>
          </div>

          {/* Course Info */}
          <div>
            <h3 className="font-headline text-3xl text-foreground mb-2">{course.title}</h3>
            <p className="font-body text-muted-foreground mb-4">{course.subtitle}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">{course.level}</span>
              <div className="flex items-center gap-1">
                <Icon name="ClockIcon" size={16} />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="AcademicCapIcon" size={16} />
                <span>{course.sessions} Sessions</span>
              </div>
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <h4 className="font-cta text-lg text-foreground mb-3 flex items-center gap-2">
              <Icon name="BookOpenIcon" size={20} />
              Course Curriculum
            </h4>
            <ul className="space-y-2">
              {course.curriculum.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary/20 text-secondary rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructor */}
          <div className="border-t border-border pt-6">
            <h4 className="font-cta text-lg text-foreground mb-4">Your Instructor</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <AppImage
                  src={course.instructor.image}
                  alt={course.instructor.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h5 className="font-cta text-foreground">{course.instructor.name}</h5>
                <p className="text-sm text-muted-foreground">{course.instructor.credentials}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-muted text-foreground font-cta rounded-md hover:bg-muted/80 transition-contemplative"
            >
              Close Preview
            </button>
            <a
              href="/free-consultation-booking"
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground font-cta rounded-md hover:scale-105 shadow-warm hover:shadow-warm-lg transition-contemplative text-center"
            >
              Book Free Consultation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}