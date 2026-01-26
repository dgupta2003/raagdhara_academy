'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface LearningPathConfiguratorProps {
  onConfigurationComplete: (config: PathConfiguration) => void;
}

interface PathConfiguration {
  experience: string;
  goals: string[];
  timeCommitment: string;
  preferredStyle: string;
}

export default function LearningPathConfigurator({ onConfigurationComplete }: LearningPathConfiguratorProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<PathConfiguration>({
    experience: '',
    goals: [],
    timeCommitment: '',
    preferredStyle: '',
  });

  const experiences = [
    { value: 'complete-beginner', label: 'Complete Beginner', description: 'No prior music training' },
    { value: 'some-experience', label: 'Some Experience', description: '1-2 years of learning' },
    { value: 'intermediate', label: 'Intermediate', description: '3-5 years of practice' },
    { value: 'advanced', label: 'Advanced', description: '5+ years of dedicated training' },
  ];

  const goals = [
    { value: 'performance', label: 'Performance Skills', icon: 'MusicalNoteIcon' },
    { value: 'theory', label: 'Music Theory', icon: 'BookOpenIcon' },
    { value: 'composition', label: 'Composition', icon: 'PencilIcon' },
    { value: 'teaching', label: 'Teaching Others', icon: 'AcademicCapIcon' },
    { value: 'personal', label: 'Personal Growth', icon: 'HeartIcon' },
    { value: 'certification', label: 'Certification', icon: 'TrophyIcon' },
  ];

  const timeCommitments = [
    { value: '2-3-hours', label: '2-3 hours/week', description: 'Casual learning pace' },
    { value: '4-6-hours', label: '4-6 hours/week', description: 'Steady progress' },
    { value: '7-10-hours', label: '7-10 hours/week', description: 'Intensive training' },
    { value: '10-plus-hours', label: '10+ hours/week', description: 'Professional dedication' },
  ];

  const styles = [
    { value: 'hindustani', label: 'Hindustani Classical', description: 'North Indian tradition' },
    { value: 'carnatic', label: 'Carnatic Classical', description: 'South Indian tradition' },
    { value: 'both', label: 'Both Styles', description: 'Comprehensive approach' },
  ];

  const handleGoalToggle = (goal: string) => {
    const newGoals = config.goals.includes(goal)
      ? config.goals.filter((g) => g !== goal)
      : [...config.goals, goal];
    setConfig({ ...config, goals: newGoals });
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onConfigurationComplete(config);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return config.experience !== '';
      case 2:
        return config.goals.length > 0;
      case 3:
        return config.timeCommitment !== '';
      case 4:
        return config.preferredStyle !== '';
      default:
        return false;
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-warm border border-border p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-cta text-muted-foreground">Step {step} of 4</span>
          <span className="text-sm font-cta text-muted-foreground">{Math.round((step / 4) * 100)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Experience Level */}
        {step === 1 && (
          <div>
            <h3 className="font-headline text-2xl text-foreground mb-2">What's your experience level?</h3>
            <p className="text-muted-foreground mb-6">Help us understand your current musical journey</p>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <button
                  key={exp.value}
                  onClick={() => setConfig({ ...config, experience: exp.value })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-contemplative ${
                    config.experience === exp.value
                      ? 'border-secondary bg-secondary/10' :'border-border hover:border-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cta text-foreground mb-1">{exp.label}</h4>
                      <p className="text-sm text-muted-foreground">{exp.description}</p>
                    </div>
                    {config.experience === exp.value && (
                      <Icon name="CheckCircleIcon" size={24} className="text-secondary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Learning Goals */}
        {step === 2 && (
          <div>
            <h3 className="font-headline text-2xl text-foreground mb-2">What are your learning goals?</h3>
            <p className="text-muted-foreground mb-6">Select all that apply (multiple selections allowed)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => handleGoalToggle(goal.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-contemplative ${
                    config.goals.includes(goal.value)
                      ? 'border-secondary bg-secondary/10' :'border-border hover:border-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon name={goal.icon as any} size={24} className="text-primary" />
                    <span className="font-cta text-foreground">{goal.label}</span>
                    {config.goals.includes(goal.value) && (
                      <Icon name="CheckCircleIcon" size={20} className="text-secondary ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Time Commitment */}
        {step === 3 && (
          <div>
            <h3 className="font-headline text-2xl text-foreground mb-2">How much time can you dedicate?</h3>
            <p className="text-muted-foreground mb-6">Choose your weekly practice commitment</p>
            <div className="space-y-3">
              {timeCommitments.map((time) => (
                <button
                  key={time.value}
                  onClick={() => setConfig({ ...config, timeCommitment: time.value })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-contemplative ${
                    config.timeCommitment === time.value
                      ? 'border-secondary bg-secondary/10' :'border-border hover:border-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cta text-foreground mb-1">{time.label}</h4>
                      <p className="text-sm text-muted-foreground">{time.description}</p>
                    </div>
                    {config.timeCommitment === time.value && (
                      <Icon name="CheckCircleIcon" size={24} className="text-secondary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Preferred Style */}
        {step === 4 && (
          <div>
            <h3 className="font-headline text-2xl text-foreground mb-2">Which style interests you?</h3>
            <p className="text-muted-foreground mb-6">Choose your preferred classical music tradition</p>
            <div className="space-y-3">
              {styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setConfig({ ...config, preferredStyle: style.value })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-contemplative ${
                    config.preferredStyle === style.value
                      ? 'border-secondary bg-secondary/10' :'border-border hover:border-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cta text-foreground mb-1">{style.label}</h4>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                    {config.preferredStyle === style.value && (
                      <Icon name="CheckCircleIcon" size={24} className="text-secondary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-muted text-foreground font-cta rounded-md hover:bg-muted/80 transition-contemplative flex items-center gap-2"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!isStepValid()}
          className={`flex-1 px-6 py-3 font-cta rounded-md transition-contemplative flex items-center justify-center gap-2 ${
            isStepValid()
              ? 'bg-secondary text-secondary-foreground hover:scale-105 shadow-warm hover:shadow-warm-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {step === 4 ? 'Get My Learning Path' : 'Continue'}
          <Icon name="ArrowRightIcon" size={16} />
        </button>
      </div>
    </div>
  );
}