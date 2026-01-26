import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import HomepageInteractive from './components/HomepageInteractive';

export const metadata: Metadata = {
  title: 'Homepage - Raagdhara Academy',
  description: 'Embark on a transformative journey through Indian Classical Music with Raagdhara Academy. Learn authentic vocal techniques under expert guidance with personalized online classes.',
};

export default function Homepage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <HomepageInteractive />
      </main>
    </>
  );
}