import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import CoursesInteractive from './components/CoursesInteractive';

export const metadata: Metadata = {
  title: 'Courses & Offerings - Raagdhara Academy',
  description: 'Explore comprehensive Hindustani classical vocal courses from beginner to advanced levels. Personalized learning paths, expert instruction, and authentic classical music education with Vaishnavi Gupta.',
};

export default function CoursesAndOfferingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <CoursesInteractive />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-brown text-primary-foreground border-t border-border">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
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
                <li>
                  <a href="/homepage" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/courses-and-offerings" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="/free-consultation-booking" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Book Consultation
                  </a>
                </li>
                <li>
                  <a href="/contact-and-connect" className="font-body text-sm text-primary-foreground/70 hover:text-secondary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-headline text-lg text-secondary mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2 text-sm text-primary-foreground/70">
                  <a href="mailto:raagdharamusic@gmail.com" className="font-body hover:text-secondary transition-colors">
                    raagdharamusic@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-headline text-lg text-secondary mb-4">Follow Us</h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.instagram.com/raagdhara_music?igsh=MTFvcDA5MjhrYWU2eg%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com/@raagdhara_music?si=4aZUxkL7MUvSzH2g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="YouTube"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/share/1D8ZEQjpKW/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary hover:scale-110 transition-all"
                  aria-label="Facebook"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-primary-foreground/20">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <p className="font-body text-sm text-primary-foreground/60 text-center md:text-left">
                © {new Date().getFullYear()} Raagdhara Music Academy. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-primary-foreground/60">
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}