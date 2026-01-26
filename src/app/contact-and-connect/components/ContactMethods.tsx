import Icon from '@/components/ui/AppIcon';

interface ContactMethod {
  id: number;
  icon: string;
  title: string;
  description: string;
  action: string;
  link: string;
  color: string;
}

const contactMethods: ContactMethod[] = [
  {
    id: 1,
    icon: 'ChatBubbleLeftEllipsisIcon',
    title: 'WhatsApp',
    description: 'Quick queries and instant responses',
    action: 'Message Now',
    link: 'https://wa.me/message/A5LAV3JA5KIZM1',
    color: 'success'
  },
  {
    id: 3,
    icon: 'EnvelopeIcon',
    title: 'Email',
    description: 'Detailed inquiries and information',
    action: 'Email Us',
    link: 'mailto:raagdharamusic@gmail.com',
    color: 'secondary'
  },
  {
    id: 4,
    icon: 'CalendarDaysIcon',
    title: 'Book Consultation',
    description: 'Free 30-minute session with Vaishnavi',
    action: 'Schedule Now',
    link: '/free-consultation-booking',
    color: 'accent'
  }
];

interface ContactMethodsProps {
  className?: string;
}

const ContactMethods = ({ className = '' }: ContactMethodsProps) => {
  return (
    <section className={`py-16 lg:py-24 bg-background ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl text-primary mb-4">
            Choose Your Preferred Way to Connect
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            We offer multiple channels to ensure you can reach us in the way that's most convenient for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {contactMethods.map((method) => (
            <a
              key={method.id}
              href={method.link}
              target={method.link.startsWith('http') ? '_blank' : '_self'}
              rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group bg-card rounded-lg p-6 shadow-warm hover:shadow-warm-lg transition-contemplative border border-border hover:border-primary"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-${method.color}/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon name={method.icon as any} size={28} className={`text-${method.color}`} />
              </div>
              <h3 className="font-headline text-xl text-foreground mb-2">
                {method.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground mb-4">
                {method.description}
              </p>
              <span className={`inline-flex items-center font-cta text-sm text-${method.color} group-hover:translate-x-1 transition-transform duration-300`}>
                {method.action}
                <Icon name="ArrowRightIcon" size={16} className="ml-2" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactMethods;