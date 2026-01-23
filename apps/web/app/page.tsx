import Homepage from '@/components/homepage';
import { InfiniteSliderText } from '@/components/infinite-scroll';
import Header from '@/components/header';
import FeaturesSection from '@/components/landing/features-section';
import PricingSection from '@/components/landing/pricing-section';
import Footer from '@/components/landing/footer';
import CtaSection from '@/components/landing/cta-section';
import HeroImage from '@/components/landing/hero-image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />

      <main className="flex-1">
        <Homepage />
        <HeroImage />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
        <InfiniteSliderText />

      </main>

      <Footer />
    </div>
  );
}