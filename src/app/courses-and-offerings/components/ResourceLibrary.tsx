'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Resource {
  id: number;
  title: string;
  type: 'pdf' | 'audio' | 'video';
  category: string;
  description: string;
  downloadUrl: string;
  duration?: string;
  size?: string;
}

export default function ResourceLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const resources: Resource[] = [
    {
      id: 1,
      title: "Beginner's Guide to Swar Practice",
      type: 'pdf',
      category: 'practice-guides',
      description: 'Comprehensive guide covering basic swar exercises and vocal warm-ups',
      downloadUrl: '#',
      size: '2.5 MB',
    },
    {
      id: 2,
      title: 'Tanpura Track - C# (Kharaj Pancham)',
      type: 'audio',
      category: 'tanpura-tracks',
      description: 'High-quality tanpura accompaniment for practice sessions',
      downloadUrl: '#',
      duration: '30:00',
      size: '45 MB',
    },
    {
      id: 3,
      title: 'Raga Yaman - Alaap Demonstration',
      type: 'video',
      category: 'tutorials',
      description: 'Step-by-step breakdown of Raga Yaman alaap with detailed explanations',
      downloadUrl: '#',
      duration: '18:45',
      size: '120 MB',
    },
    {
      id: 4,
      title: 'Understanding Taal Systems',
      type: 'pdf',
      category: 'theory',
      description: 'Detailed explanation of common taals in Hindustani classical music',
      downloadUrl: '#',
      size: '3.8 MB',
    },
    {
      id: 5,
      title: 'Daily Practice Schedule Template',
      type: 'pdf',
      category: 'practice-guides',
      description: 'Customizable practice routine for consistent progress',
      downloadUrl: '#',
      size: '1.2 MB',
    },
    {
      id: 6,
      title: 'Tanpura Track - D (Madhya Saptak)',
      type: 'audio',
      category: 'tanpura-tracks',
      description: 'Perfect for mid-range vocal practice and riyaz',
      downloadUrl: '#',
      duration: '30:00',
      size: '45 MB',
    },
  ];

  const categories = [
    { value: 'all', label: 'All Resources', icon: 'FolderIcon' },
    { value: 'practice-guides', label: 'Practice Guides', icon: 'BookOpenIcon' },
    { value: 'tanpura-tracks', label: 'Tanpura Tracks', icon: 'MusicalNoteIcon' },
    { value: 'tutorials', label: 'Video Tutorials', icon: 'PlayIcon' },
    { value: 'theory', label: 'Music Theory', icon: 'AcademicCapIcon' },
  ];

  const filteredResources = selectedCategory === 'all'
    ? resources
    : resources.filter((r) => r.category === selectedCategory);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'DocumentTextIcon';
      case 'audio':
        return 'MusicalNoteIcon';
      case 'video':
        return 'PlayCircleIcon';
      default:
        return 'DocumentIcon';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-error/10 text-error';
      case 'audio':
        return 'bg-warning/10 text-warning';
      case 'video':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-warm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-2xl text-foreground">Practice Resources</h3>
        <span className="text-sm text-muted-foreground">{filteredResources.length} resources</span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-cta transition-contemplative flex items-center gap-2 ${
              selectedCategory === cat.value
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Icon name={cat.icon as any} size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="p-4 border border-border rounded-lg hover:shadow-warm transition-meditative"
          >
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-lg ${getTypeColor(resource.type)}`}>
                <Icon name={getTypeIcon(resource.type) as any} size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-cta text-foreground mb-1">{resource.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {resource.duration && (
                    <div className="flex items-center gap-1">
                      <Icon name="ClockIcon" size={14} />
                      <span>{resource.duration}</span>
                    </div>
                  )}
                  {resource.size && (
                    <div className="flex items-center gap-1">
                      <Icon name="ArrowDownTrayIcon" size={14} />
                      <span>{resource.size}</span>
                    </div>
                  )}
                </div>
                <button className="text-sm text-primary hover:text-primary/80 transition-contemplative flex items-center gap-1">
                  <Icon name="ArrowDownTrayIcon" size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}