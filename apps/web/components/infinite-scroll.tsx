import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import ScrollVelocity from "./ScrollVelocity";

const items = [
  { icon: Sparkles, text: "PROMPT TO 2D ANIMATION" },
  { icon: ShieldCheck, text: "SCROLL TO GENERATE" },
];

export function InfiniteSliderText() {
  return (
    <section className="relative z-10 w-full py-14">
      <div className="w-full">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Badge
            variant="secondary"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Pipeline Highlights
          </Badge>

          <p className="text-sm ">
            Everything you need to generate clean, deterministic 2D animations.
          </p>
        </div>

 <ScrollVelocity texts={items.map((item) => item.text)} />
      </div>
    </section>
  );
}
