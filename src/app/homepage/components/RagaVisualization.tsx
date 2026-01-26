'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Raga {
  id: number;
  name: string;
  nameHindi: string;
  time: string;
  mood: string;
  description: string;
  color: string;
}

const RagaVisualization = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedRaga, setSelectedRaga] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const ragas: Raga[] = [
    {
      id: 1,
      name: "Yaman",
      nameHindi: "यमन",
      time: "Evening (6 PM - 9 PM)",
      mood: "Devotional & Peaceful",
      description: "One of the most fundamental ragas, Yaman evokes feelings of devotion and tranquility. Perfect for beginners to understand the essence of classical music.",
      color: "from-amber-400 to-orange-500"
    },
    {
      id: 2,
      name: "Bhairav",
      nameHindi: "भैरव",
      time: "Early Morning (5 AM - 8 AM)",
      mood: "Serious & Contemplative",
      description: "A morning raga that creates an atmosphere of seriousness and contemplation. Known for its majestic and powerful character.",
      color: "from-blue-400 to-indigo-500"
    },
    {
      id: 3,
      name: "Darbari Kanada",
      nameHindi: "दरबारी कानड़ा",
      time: "Late Night (12 AM - 3 AM)",
      mood: "Deep & Meditative",
      description: "A profound midnight raga that expresses deep emotions and meditative states. Considered one of the most sophisticated ragas.",
      color: "from-purple-400 to-pink-500"
    },
    {
      id: 4,
      name: "Bhupali",
      nameHindi: "भूपाली",
      time: "Evening (6 PM - 9 PM)",
      mood: "Joyful & Uplifting",
      description: "A pentatonic raga that brings joy and positivity. Its simple structure makes it accessible while maintaining classical depth.",
      color: "from-green-400 to-teal-500"
    }
  ];

  const currentRaga = ragas[selectedRaga];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M0,100 Q50,80 100,100 T200,100" stroke="var(--color-primary)" strokeWidth="3" fill="none" />
              <path d="M0,120 Q50,100 100,120 T200,120" stroke="var(--color-secondary)" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-cta text-sm rounded-full mb-6">
            Musical Exploration
          </div>
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary mb-6">
            Discover the Ragas
          </h2>
          <p className="font-body text-lg text-muted-foreground leading-relaxed">
            Each raga is a unique musical framework with its own time, mood, and emotional expression. Explore the diversity of Indian Classical Music.
          </p>
        </div>

        {/* Interactive Raga Display */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Visualization */}
            <div className="relative">
              <div className={`aspect-square rounded-full bg-gradient-to-br ${currentRaga.color} p-1 shadow-warm-lg`}>
                <div className="w-full h-full rounded-full bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 space-y-6">
                  {/* Raga Name */}
                  <div className="text-center space-y-2">
                    <h3 className="font-devanagari text-5xl md:text-6xl text-primary">
                      {currentRaga.nameHindi}
                    </h3>
                    <p className="font-headline text-3xl md:text-4xl text-secondary">
                      {currentRaga.name}
                    </p>
                  </div>

                  {/* Time & Mood */}
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Icon name="ClockIcon" size={20} />
                      <span className="font-body text-sm">{currentRaga.time}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Icon name="HeartIcon" size={20} />
                      <span className="font-body text-sm">{currentRaga.mood}</span>
                    </div>
                  </div>

                  {/* Animated Sound Waves */}
                  <div className="flex items-center justify-center space-x-2 border-orange-50">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 bg-secondary rounded-full animate-pulse`}
                        style={{
                          height: `${20 + i * 8}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Controls */}
            <div className="space-y-8">
              <p className="font-body text-lg text-foreground leading-relaxed">
                {currentRaga.description}
              </p>

              {/* Raga Selection */}
              <div className="space-y-4">
                <p className="font-cta text-sm text-muted-foreground uppercase tracking-wide">
                  Select a Raga
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {ragas.map((raga, index) => (
                    <button
                      key={raga.id}
                      onClick={() => setSelectedRaga(index)}
                      className={`p-4 rounded-lg border-2 transition-contemplative text-left ${
                        selectedRaga === index
                          ? 'border-secondary bg-secondary/10' :'border-border bg-card hover:border-primary'
                      }`}
                    >
                      <p className="font-headline text-lg text-foreground mb-1">
                        {raga.name}
                      </p>
                      <p className="font-devanagari text-sm text-muted-foreground">
                        {raga.nameHindi}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Learn More CTA */}
              <div className="pt-4">
                <button className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-cta text-base rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-contemplative">
                  Learn This Raga
                  <Icon name="MusicalNoteIcon" size={18} className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RagaVisualization;