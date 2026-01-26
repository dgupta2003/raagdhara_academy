import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface FooterProps {
  className?: string;
}

const Footer = ({ className = '' }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Home', href: '/homepage' },
    { label: 'Courses', href: '/courses-and-offerings' },
    { label: 'Book Consultation', href: '/free-consultation-booking' },
    { label: 'Contact', href: '/contact-and-connect' }
  ];

  const socialLinks = [
    { platform: 'Instagram', icon: 'CameraIcon', link: 'https://www.instagram.com/raagdhara_music?igsh=MTFvcDA5MjhrYWU2eg%3D%3D' },
    { platform: 'YouTube', icon: 'VideoCameraIcon', link: 'https://youtube.com/@raagdhara_music?si=4aZUxkL7MUvSzH2g' },
    { platform: 'Facebook', icon: 'UserGroupIcon', link: 'https://www.facebook.com/share/1D8ZEQjpKW/' }
  ];

  return (
    <footer className={`bg-brand-brown text-background border-t border-border ${className}`}>
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4Z"
                    fill="var(--color-secondary)"
                    opacity="0.2"
                  />
                  <path
                    d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8Z"
                    stroke="var(--color-secondary)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="24" cy="24" r="3" fill="var(--color-secondary)" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-devanagari text-xl font-medium text-secondary leading-none">
                  रागधारा
                </span>
                <span className="font-headline text-xs text-background/80 tracking-wide">
                  Music Academy
                </span>
              </div>
            </div>
            <p className="font-body text-sm text-background/70 leading-relaxed">
              Where tradition meets innovation in Indian classical music education.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-headline text-lg text-secondary mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-background/70 hover:text-secondary transition-colors inline-flex items-center"
                  >
                    <Icon name="ChevronRightIcon" size={14} className="mr-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-headline text-lg text-secondary mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Icon name="EnvelopeIcon" size={18} className="text-secondary mr-2 flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:raagdharamusic@gmail.com"
                  className="font-body text-sm text-background/70 hover:text-secondary transition-colors"
                >
                  raagdharamusic@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
            <div>
              <h3 className="font-headline text-lg text-secondary mb-4">Connect</h3>
              <div className="flex items-center space-x-3 mb-4">
                <a
                  href="https://www.instagram.com/raagdhara_music?igsh=MTFvcDA5MjhrYWU2eg%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="Instagram"
                >
                  <Icon name="CameraIcon" size={20} className="text-primary-foreground" />
                </a>
                <a
                  href="https://youtube.com/@raagdhara_music?si=4aZUxkL7MUvSzH2g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="YouTube"
                >
                  <Icon name="VideoCameraIcon" size={20} className="text-primary-foreground" />
                </a>
                <a
                  href="https://www.facebook.com/share/1D8ZEQjpKW/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="Facebook"
                >
                  <Icon name="UserGroupIcon" size={20} className="text-primary-foreground" />
                </a>
                <a
                  href="https://wa.me/message/A5LAV3JA5KIZM1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="WhatsApp"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-primary-foreground" />
                </a>
              </div>
              <p className="font-body text-xs text-primary-foreground/70 leading-relaxed">
                Follow us for daily practice tips, student performances, and classical music insights.
              </p>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="font-body text-sm text-background/60 text-center">
              © {currentYear} Raagdhara Music Academy. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;