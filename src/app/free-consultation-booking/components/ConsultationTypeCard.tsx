'use client';


import Icon from '@/components/ui/AppIcon';

interface ConsultationTypeCardProps {
  type: {
    id: string;
    title: string;
    duration: string;
    description: string;
    icon: string;
    features: string[];
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function ConsultationTypeCard({ type, isSelected, onSelect }: ConsultationTypeCardProps) {
  return (
    <button
      onClick={() => onSelect(type.id)}
      className={`w-full text-left p-6 rounded-lg border-2 transition-all duration-300 ${
        isSelected
          ? 'border-secondary bg-secondary/5 shadow-warm-lg'
          : 'border-border bg-card hover:border-secondary/50 hover:shadow-warm'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${isSelected ? 'bg-secondary' : 'bg-muted'}`}>
            <Icon 
              name={type.icon as any} 
              size={24} 
              className={isSelected ? 'text-secondary-foreground' : 'text-foreground'}
            />
          </div>
          <div>
            <h3 className="font-headline text-lg font-semibold text-foreground">{type.title}</h3>
            <p className="font-body text-sm text-muted-foreground">{type.duration}</p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected ? 'border-secondary bg-secondary' : 'border-border'
        }`}>
          {isSelected && <Icon name="CheckIcon" size={16} className="text-secondary-foreground" />}
        </div>
      </div>
      
      <p className="font-body text-sm text-foreground/80 mb-4">{type.description}</p>
      
      <ul className="space-y-2">
        {type.features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-2">
            <Icon name="CheckCircleIcon" size={16} className="text-secondary mt-0.5 flex-shrink-0" />
            <span className="font-body text-sm text-foreground/70">{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}