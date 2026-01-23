import Homepage from '@/components/homepage';
import { InfiniteSliderText } from '@/components/infinite-scroll';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col">
                <Header />

      <Homepage />
      <InfiniteSliderText />
    </div>
  );
}