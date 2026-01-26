'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const socialLinks = [
  { 
    platform: 'Instagram', 
    icon: 'CameraIcon', 
    link: 'https://www.instagram.com/raagdhara_music?igsh=MTFvcDA5MjhrYWU2eg%3D%3D', 
    description: 'Daily inspiration, student performances, and musical moments'
  },
  { 
    platform: 'YouTube', 
    icon: 'PlayIcon', 
    link: 'https://youtube.com/@raagdhara_music?si=4aZUxkL7MUvSzH2g', 
    description: 'Full-length tutorials, performances, and learning resources'
  },
  { 
    platform: 'Facebook', 
    icon: 'UserGroupIcon', 
    link: 'https://www.facebook.com/share/1D8ZEQjpKW/', 
    description: 'Community discussions, events, and announcements'
  }
];

interface SocialMediaHubProps {
  className?: string;
}

const SocialMediaHub = ({ className = '' }: SocialMediaHubProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section className={`py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30 ${className}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-10 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30 ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
            Join Our Musical Community
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow music enthusiasts, stay updated with our latest content, and be part of a vibrant community dedicated to Indian classical music
          </p>
        </div>

        {/* Social Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {socialLinks.map((social) => (
            <a
              key={social.platform}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card p-6 rounded-lg shadow-warm hover:shadow-warm-lg transition-contemplative border border-border hover:border-primary"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon name={social.icon as any} size={32} className="text-primary" />
                </div>
                <h3 className="font-cta text-xl text-foreground mb-2">{social.platform}</h3>
                <p className="font-body text-sm text-muted-foreground mb-3">
                  {social.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMediaHub;