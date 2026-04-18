import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const quickLinks = [
  { label: 'Home', href: '/homepage' },
  { label: 'Courses', href: '/courses-and-offerings' },
  { label: 'Book Consultation', href: '/free-consultation-booking' },
  { label: 'Contact', href: '/contact-and-connect' },
];

const socialLinks = [
  { name: 'Instagram', icon: 'CameraIcon', href: 'https://www.instagram.com/raagdhara_music?igsh=MTFvcDA5MjhrYWU2eg%3D%3D' },
  { name: 'YouTube', icon: 'VideoCameraIcon', href: 'https://youtube.com/@raagdhara_music?si=4aZUxkL7MUvSzH2g' },
  { name: 'Facebook', icon: 'UserGroupIcon', href: 'https://www.facebook.com/share/1D8ZEQjpKW/' },
];

// Server Component — no 'use client' needed. Year is rendered server-side, no hydration mismatch.
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-brown text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8Z"
                  stroke="var(--color-secondary)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M16 24C16 19.582 19.582 16 24 16C28.418 16 32 19.582 32 24"
                  stroke="var(--color-secondary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="24" r="3" fill="var(--color-secondary)" />
              </svg>
              <div className="flex flex-col">
                <span className="font-devanagari text-xl font-medium text-secondary leading-none">
                  रागधारा
                </span>
                <span className="font-headline text-xs text-primary-foreground/80 tracking-wide">
                  Music Academy
                </span>
              </div>
            </div>
            <p className="font-body text-sm text-primary-foreground/70 leading-relaxed">
              Where tradition meets innovation in Indian Classical Music education.
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
                    className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-contemplative inline-flex items-center group"
                  >
                    <Icon name="ChevronRightIcon" size={14} className="mr-1 opacity-0 group-hover:opacity-100 transition-contemplative" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-headline text-lg text-secondary mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm text-primary-foreground/70">
                <Icon name="EnvelopeIcon" size={16} className="mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:raagdharamusic@gmail.com"
                  className="font-body hover:text-secondary transition-colors"
                >
                  raagdharamusic@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-headline text-lg text-secondary mb-4">Connect</h3>
            <div className="flex items-center space-x-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-contemplative"
                  aria-label={social.name}
                >
                  <Icon name={social.icon as any} size={20} className="text-primary-foreground" />
                </a>
              ))}
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
              Follow us for daily practice tips, and classical music insights.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <p className="font-body text-sm text-primary-foreground/60 text-center">
            © {currentYear} Raagdhara Music Academy. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
