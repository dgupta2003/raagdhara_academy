import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface Course {
  id: number;
  title: string;
  level: string;
  duration: string;
  description: string;
  features: string[];
  icon: string;
}

const CoursesPreview = () => {
  const courses: Course[] = [
    {
      id: 1,
      title: "Hindustani Classical Vocal Music",
      level: "All Levels",
      duration: "Flexible",
      description: "Master the art of Hindustani classical vocal music with comprehensive training in ragas, taals, and traditional compositions.",
      features: ["Raga Theory", "Swar Practice", "Bandish & Compositions", "Performance Training"],
      icon: "SparklesIcon"
    },
    {
      id: 2,
      title: "Popular and Film Music - Hindi",
      level: "All Levels",
      duration: "Flexible",
      description: "Learn to sing popular Bollywood and Hindi film songs with proper technique, expression, and contemporary style.",
      features: ["Film Song Techniques", "Modern Vocal Styles", "Expression & Emotion", "Playback Singing"],
      icon: "FireIcon"
    },
    {
      id: 3,
      title: "Hindi Devotional",
      level: "All Levels",
      duration: "Flexible",
      description: "Explore the spiritual dimension of music through bhajans, kirtans, and devotional songs with authentic rendition.",
      features: ["Bhajan Singing", "Kirtan Practice", "Devotional Expression", "Traditional Compositions"],
      icon: "StarIcon"
    },
    {
      id: 4,
      title: "Ghazal",
      level: "Intermediate to Advanced",
      duration: "Flexible",
      description: "Delve into the poetic and melodic world of ghazals, learning the nuances of Urdu poetry and classical presentation.",
      features: ["Urdu Pronunciation", "Ghazal Gayaki", "Poetic Expression", "Classical Fusion"],
      icon: "SparklesIcon"
    },
    {
      id: 5,
      title: "Bhatkhande Sangeet Vidyapeeth Course",
      level: "Structured Certification",
      duration: "Multi-Year Program",
      description: "Pursue formal certification through the prestigious Bhatkhande Sangeet Vidyapeeth curriculum with structured examinations.",
      features: ["Formal Curriculum", "Exam Preparation", "Certification Path", "Theory & Practical"],
      icon: "AcademicCapIcon"
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-cta text-sm rounded-full mb-6">
            Learning Paths
          </div>
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary mb-6">
            Courses & Offerings
          </h2>
          <p className="font-body text-lg text-muted-foreground leading-relaxed">
            Structured learning paths designed to guide you from foundational practice to advanced mastery, tailored to your musical journey.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-card rounded-lg p-8 shadow-warm hover:shadow-warm-lg transition-contemplative border border-border group"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-contemplative">
                <Icon name={course.icon as any} size={32} className="text-secondary" />
              </div>

              {/* Level Badge */}
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-cta text-xs rounded-full mb-4">
                {course.level}
              </div>

              {/* Title */}
              <h3 className="font-headline text-2xl text-foreground mb-2">
                {course.title}
              </h3>

              {/* Duration */}
              <p className="font-body text-sm text-muted-foreground mb-4 flex items-center">
                <Icon name="ClockIcon" size={16} className="mr-2" />
                {course.duration}
              </p>

              {/* Description */}
              <p className="font-body text-base text-muted-foreground mb-6 leading-relaxed">
                {course.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {course.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-foreground">
                    <Icon name="CheckCircleIcon" size={18} className="text-success mr-2 flex-shrink-0 mt-0.5" />
                    <span className="font-body">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/courses-and-offerings"
                className="inline-flex items-center text-secondary font-cta text-sm hover:text-primary transition-contemplative"
              >
                Learn More
                <Icon name="ArrowRightIcon" size={16} className="ml-2" />
              </Link>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Link
            href="/courses-and-offerings"
            className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground font-cta text-lg rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative"
          >
            View All Courses
            <Icon name="AcademicCapIcon" size={20} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CoursesPreview;