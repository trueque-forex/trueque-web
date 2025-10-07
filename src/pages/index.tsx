import Hero from '@/components/Hero';
import CorridorSelector from '@/components/CorridorSelector';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between">
      <div>
        <Hero />
        <CorridorSelector onSelect={(value) => console.log('Selected corridor:', value)} />
      </div>
      <Footer />
    </main>
  );
}