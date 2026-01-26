'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  className?: string;
}

const Header = ({ className = '' }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConsultationButton, setShowConsultationButton] = useState(true);
  const pathname = usePathname();
  const isHomepage = pathname === '/homepage';

  useEffect(() => {
    if (!isHomepage) {
      setShowConsultationButton(true);
      return;
    }

    const handleScroll = () => {
      const heroSectionHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      // Show button only after scrolling past hero section
      setShowConsultationButton(scrollPosition > heroSectionHeight * 0.8);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomepage]);

  const navigationItems = [
    { label: 'Home', href: '/homepage' },
    { label: 'Courses', href: '/courses-and-offerings' },
    { label: 'Book Consultation', href: '/free-consultation-booking' },
    { label: 'Contact', href: '/contact-and-connect' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-warm ${className}`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20 px-4 lg:px-8">
          {/* Logo Section */}
          <Link href="/homepage" className="flex items-center space-x-3 group">
            <div className="relative">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300 group-hover:scale-105"
              >
                <path
                  d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4Z"
                  fill="var(--color-primary)"
                  opacity="0.1"
                />
                <path
                  d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8Z"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M16 24C16 19.582 19.582 16 24 16C28.418 16 32 19.582 32 24"
                  stroke="var(--color-secondary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-float"
                />
                <path
                  d="M20 28C20 25.791 21.791 24 24 24C26.209 24 28 25.791 28 28"
                  stroke="var(--color-secondary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="24" r="3" fill="var(--color-primary)" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-devanagari text-2xl font-medium text-primary leading-none">
                रागधारा
              </span>
              <span className="font-headline text-sm text-muted-foreground tracking-wide">
                Music Academy
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-body text-base text-foreground hover:text-primary transition-contemplative relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden lg:block">
            <Link
              href="/free-consultation-booking"
              className={`inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground font-cta text-sm rounded-md shadow-warm hover:shadow-warm-lg hover:scale-105 transition-all duration-300 ${
                showConsultationButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              Free Consultation
              <Icon name="ArrowRightIcon" size={16} className="ml-2" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-foreground hover:text-primary transition-contemplative"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={28} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-sm">
            <nav className="flex flex-col py-4 px-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-body text-base text-foreground hover:text-primary hover:bg-muted px-4 py-3 rounded-md transition-contemplative"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/free-consultation-booking"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground font-cta text-sm rounded-md shadow-warm hover:shadow-warm-lg transition-contemplative mt-4 ${
                  showConsultationButton ? 'opacity-100' : 'opacity-50'
                }`}
              >
                Free Consultation
                <Icon name="ArrowRightIcon" size={16} className="ml-2" />
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;