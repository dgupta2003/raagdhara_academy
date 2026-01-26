'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CourseFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  level: string[];
  duration: string[];
  searchQuery: string;
}

export default function CourseFilter({ onFilterChange }: CourseFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    level: [],
    duration: [],
    searchQuery: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const durations = ['1-3 months', '3-6 months', '6+ months'];

  const handleLevelToggle = (level: string) => {
    const newLevels = filters.level.includes(level)
      ? filters.level.filter((l) => l !== level)
      : [...filters.level, level];
    
    const newFilters = { ...filters, level: newLevels };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDurationToggle = (duration: string) => {
    const newDurations = filters.duration.includes(duration)
      ? filters.duration.filter((d) => d !== duration)
      : [...filters.duration, duration];
    
    const newFilters = { ...filters, duration: newDurations };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (query: string) => {
    const newFilters = { ...filters, searchQuery: query };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = { level: [], duration: [], searchQuery: '' };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = filters.level.length + filters.duration.length + (filters.searchQuery ? 1 : 0);

  return (
    <div className="bg-card rounded-lg shadow-warm border border-border p-6 mb-8">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Icon name="MagnifyingGlassIcon" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search courses, ragas, or topics..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter Toggle Button (Mobile) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-muted rounded-md mb-4"
      >
        <span className="font-cta text-sm text-foreground">
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </span>
        <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={20} />
      </button>

      {/* Filters */}
      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block space-y-6`}>
        {/* Level Filter */}
        <div>
          <h3 className="font-cta text-sm text-foreground mb-3 flex items-center gap-2">
            <Icon name="AcademicCapIcon" size={18} />
            Difficulty Level
          </h3>
          <div className="space-y-2">
            {levels.map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.level.includes(level)}
                  onChange={() => handleLevelToggle(level)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-contemplative">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Duration Filter */}
        <div>
          <h3 className="font-cta text-sm text-foreground mb-3 flex items-center gap-2">
            <Icon name="ClockIcon" size={18} />
            Course Duration
          </h3>
          <div className="space-y-2">
            {durations.map((duration) => (
              <label key={duration} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.duration.includes(duration)}
                  onChange={() => handleDurationToggle(duration)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-contemplative">
                  {duration}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 bg-error/10 text-error rounded-md hover:bg-error/20 transition-contemplative flex items-center justify-center gap-2"
          >
            <Icon name="XMarkIcon" size={16} />
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}