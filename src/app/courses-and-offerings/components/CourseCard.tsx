'use client';

import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    subtitle: string;
    level: string;
    duration: string;
    sessions: number;
    price: {
      inr: number;
      usd: number;
    };
    image: string;
    alt: string;
    features: string[];
    prerequisites: string[];
    outcomes: string[];
  };
  onEnroll: (courseId: number) => void;
  onPreview: (courseId: number) => void;
}

export default function CourseCard({ course, onEnroll, onPreview }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currency, setCurrency] = useState<'inr' | 'usd'>('inr');

  const formatPrice = (price: number, curr: 'inr' | 'usd') => {
    if (curr === 'inr') {
      return `₹${price.toLocaleString('en-IN')}`;
    }
    return `$${price.toLocaleString('en-US')}`;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-success/10 text-success border-success/30';
      case 'intermediate':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'advanced':
        return 'bg-error/10 text-error border-error/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-warm hover:shadow-warm-lg transition-meditative overflow-hidden border border-border group">
      {/* Course Image */}
      <div className="relative h-56 overflow-hidden">
        <AppImage
          src={course.image}
          alt={course.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-meditative"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <h3 className="font-headline text-2xl text-foreground mb-2">{course.title}</h3>
        <p className="font-body text-sm text-muted-foreground mb-4">{course.subtitle}</p>

        {/* Course Meta */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="ClockIcon" size={16} />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="AcademicCapIcon" size={16} />
            <span>{course.sessions} Sessions</span>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-4">
          <h4 className="font-cta text-sm text-foreground mb-2">Key Features:</h4>
          <ul className="space-y-1">
            {course.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Icon name="CheckCircleIcon" size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mb-4 space-y-3 animate-pulse-gentle">
            <div>
              <h4 className="font-cta text-sm text-foreground mb-2">Prerequisites:</h4>
              <ul className="space-y-1">
                {course.prerequisites.map((prereq, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon name="ArrowRightIcon" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-cta text-sm text-foreground mb-2">Learning Outcomes:</h4>
              <ul className="space-y-1">
                {course.outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon name="StarIcon" size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-contemplative mb-4"
        >
          <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
          <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} />
        </button>

        {/* Price and Actions */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setCurrency('inr')}
                  className={`text-xs px-2 py-1 rounded ${currency === 'inr' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  INR
                </button>
                <button
                  onClick={() => setCurrency('usd')}
                  className={`text-xs px-2 py-1 rounded ${currency === 'usd' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  USD
                </button>
              </div>
              <p className="font-headline text-3xl text-foreground">
                {formatPrice(course.price[currency], currency)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onPreview(course.id)}
              className="flex-1 px-4 py-3 bg-muted text-foreground font-cta text-sm rounded-md hover:bg-muted/80 transition-contemplative flex items-center justify-center gap-2"
            >
              <Icon name="PlayIcon" size={16} />
              Preview
            </button>
            <button
              onClick={() => onEnroll(course.id)}
              className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground font-cta text-sm rounded-md hover:scale-105 shadow-warm hover:shadow-warm-lg transition-contemplative flex items-center justify-center gap-2"
            >
              <Icon name="AcademicCapIcon" size={16} />
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}