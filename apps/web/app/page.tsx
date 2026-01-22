import Homepage from '@/components/homepage';
import { InfiniteSliderText } from '@/components/infinite-scroll';

export default function Home() {
  return (
    <div className="flex flex-col">
      <Homepage />
      <InfiniteSliderText />
    </div>
  );
}