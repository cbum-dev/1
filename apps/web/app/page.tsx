import Homepage from '@/components/homepage';
import { InfiniteSliderText } from '@/components/infinite-scroll';
import Header from '@/components/header';
import FeaturesSection from '@/components/landing/features-section';
import PricingSection from '@/components/landing/pricing-section';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />

      <main className="flex-1">
        <Homepage />
        <InfiniteSliderText />
        <FeaturesSection />
        <PricingSection />
      </main>

      <Footer />
    </div>
  );
}