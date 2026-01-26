import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const AboutPreview = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Section */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg shadow-warm-lg aspect-[4/5]">
              <AppImage
                src="/assets/images/Untitled_design_1_-1769147732176.png"
                alt="Indian classical music teacher Vaishnavi Gupta in traditional attire holding tanpura in music studio"
                className="object-cover w-full h-full"
                priority />

            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-cta text-sm rounded-full">
              Meet Your Guru
            </div>
            
            <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary leading-tight">
              Vaishnavi Gupta
            </h2>
            
            <p className="font-headline text-xl md:text-2xl text-secondary">
              Visharad-Certified Vocalist
            </p>
            
            <div className="space-y-4 text-muted-foreground font-body text-lg leading-relaxed">
              <p>
                With over 20 years of dedicated training, practice, and teaching experience, Vaishnavi Gupta brings the authentic tradition of Indian Classical Music to students worldwide. Her journey from the guru-shishya parampara to modern online pedagogy creates a structured yet deeply rooted learning experience.
              </p>
              <p>
                As a Visharad-certified Hindustani classical vocalist, she specializes in Khayal, Thumri, and Bhajan forms, guiding students from foundational swar practice to advanced raga exploration with clarity, discipline, and artistic sensitivity.
              </p>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-start space-x-3">
                <Icon name="AcademicCapIcon" size={24} className="text-secondary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-cta text-sm text-foreground">Visharad Certified</p>
                  <p className="text-xs text-muted-foreground">Bhatkhande University</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Icon name="UserGroupIcon" size={24} className="text-secondary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-cta text-sm text-foreground">200+ Students</p>
                  <p className="text-xs text-muted-foreground">Across 5 Countries</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Icon name="MusicalNoteIcon" size={24} className="text-secondary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-cta text-sm text-foreground">50+ Performances</p>
                  <p className="text-xs text-muted-foreground">National & International</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Icon name="ClockIcon" size={24} className="text-secondary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-cta text-sm text-foreground">20+ Years</p>
                  <p className="text-xs text-muted-foreground">Music Expertise</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6">
              <Link
                href="/courses-and-offerings"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-cta text-base rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative">

                Learn More About Teaching
                <Icon name="ArrowRightIcon" size={18} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default AboutPreview;