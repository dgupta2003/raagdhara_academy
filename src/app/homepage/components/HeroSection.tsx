'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
  onBookConsultation: () => void;
}

const HeroSection = ({ onBookConsultation }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f5f3f0]">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Header Label */}
          <div className="mb-12 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
            <p className="text-[#6b4423] text-sm md:text-base tracking-[0.3em] font-medium uppercase">
              INDIAN MUSIC ACADEMY
            </p>
          </div>

          {/* Main Hero Typography */}
          <div className="mb-6 relative">
            {/* Devanagari Text - Positioned Top Right */}
            <div className="absolute -top-8 right-0 md:right-12 lg:right-24 opacity-0 animate-[fadeInRight_1s_ease-out_0.4s_forwards]">
              <p className="text-[#d4a574] text-4xl md:text-5xl lg:text-6xl font-light opacity-80">
                रागधारा
              </p>
            </div>
            
            {/* Main Raagdhara Typography */}
            <h1 className="font-serif text-7xl md:text-8xl lg:text-9xl font-normal text-[#2d1810] tracking-tight leading-none opacity-0 animate-[fadeInUp_1s_ease-out_0.6s_forwards]">
              Raagdhara
            </h1>
          </div>

          {/* Tagline */}
          <div className="mb-12 opacity-0 animate-[fadeInUp_1s_ease-out_0.8s_forwards]">
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#5a4a3a] italic font-light">
              Where Melodies Flow Eternal
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 opacity-0 animate-[fadeInUp_1s_ease-out_1s_forwards]">
            <Link
              href="/free-consultation-booking"
              className="inline-flex items-center px-8 py-4 bg-[#3d2817] text-white font-medium text-base rounded-full hover:bg-[#2d1810] hover:scale-105 transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-xl"
            >
              BOOK FREE SESSION
              <Icon name="ArrowRightIcon" size={18} className="ml-2" />
            </Link>
            <Link
              href="/courses-and-offerings"
              className="inline-flex items-center px-8 py-4 bg-transparent text-[#3d2817] border-2 border-[#3d2817] font-medium text-base rounded-full hover:bg-[#3d2817] hover:text-white hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              EXPLORE COURSES
            </Link>
          </div>

          {/* Instructor Details Section */}
          <div className="pt-12 border-t border-[#d4a574]/30 opacity-0 animate-[fadeInUp_1s_ease-out_1.2s_forwards]">
            <p className="text-[#6b4423] text-xs md:text-sm tracking-[0.2em] uppercase mb-3">
              FOUNDED & GUIDED BY
            </p>
            <h3 className="font-serif text-2xl md:text-3xl text-[#2d1810] font-medium mb-1">
              Vaishnavi Gupta
            </h3>
            <p className="text-[#5a4a3a] text-sm md:text-base">
              Visharad (Bhatkhande)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;