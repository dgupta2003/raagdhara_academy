import Icon from '@/components/ui/AppIcon';

export default function PreparationGuide() {
  const preparationSteps = [
    {
      icon: 'ComputerDesktopIcon',
      title: 'Technical Setup',
      description: 'Ensure you have a stable internet connection, working camera, and microphone. Test your Google Meet access beforehand.'
    },
    {
      icon: 'HomeModernIcon',
      title: 'Quiet Environment',
      description: 'Choose a peaceful space free from distractions where you can focus completely on the consultation.'
    },
    {
      icon: 'DocumentTextIcon',
      title: 'Prepare Questions',
      description: 'Write down your musical goals, questions about the curriculum, and any specific ragas or techniques you want to learn.'
    },
    {
      icon: 'MusicalNoteIcon',
      title: 'Musical Background',
      description: 'Be ready to discuss your previous musical training, if any, and what inspired you to pursue classical music.'
    }
  ];

  return (
    <div className="bg-card rounded-lg p-8 shadow-warm">
      <h2 className="font-headline text-2xl font-semibold text-foreground mb-6">
        Preparation Guidelines
      </h2>
      
      <p className="font-body text-foreground/80 mb-8">
        To make the most of your free consultation, please review these preparation guidelines. 
        This will help us understand your needs better and provide personalized guidance.
      </p>

      <div className="space-y-6">
        {preparationSteps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Icon name={step.icon as any} size={24} className="text-secondary" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="font-body text-sm text-foreground/70">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-start space-x-3">
          <Icon name="ClockIcon" size={24} className="text-secondary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-headline text-base font-semibold text-foreground mb-2">
              Duration & Format
            </h4>
            <p className="font-body text-sm text-foreground/70">
              The consultation typically lasts 30 minutes and will be conducted via Google Meet. 
              Vaishnavi Gupta will personally assess your current level, discuss your goals, 
              and recommend a personalized learning path tailored to your needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}