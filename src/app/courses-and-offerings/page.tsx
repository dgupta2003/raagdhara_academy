import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import CoursesInteractive from './components/CoursesInteractive';
import Footer from '@/components/common/Footer';

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

      <Footer />
    </div>
  );
}