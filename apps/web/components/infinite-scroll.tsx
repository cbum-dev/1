import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ShieldCheck,
  Code2,
  Video,
  Layers,
  Download,
} from "lucide-react";

const items = [
  { icon: Sparkles, text: "Prompt → Animation IR" },
  { icon: ShieldCheck, text: "Strict JSON Validation" },
  { icon: Code2, text: "IR → Manim Code" },
  { icon: Video, text: "Render MP4 with Manim" },
  { icon: Layers, text: "Chunk Long Videos" },
  { icon: Download, text: "Instant Download (No S3)" },
];

export function InfiniteSliderText() {
  return (
    <section className="relative z-10 w-full py-14">
      <div className="mx-auto w-[min(1100px,92vw)]">
        {/* Heading */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Badge
            variant="secondary"
            className="rounded-full border border-white/10 bg-white/10 text-white/80 backdrop-blur-xl"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Pipeline Highlights
          </Badge>

          <p className="text-sm text-white/60">
            Everything you need to generate clean, deterministic 2D animations.
          </p>
        </div>

        {/* Slider */}
        <InfiniteSlider gap={16} reverse>
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-xl shadow-sm hover:bg-white/15 transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-4 w-4 text-white/80" />
                </span>
                <span>{item.text}</span>
              </div>
            );
          })}
        </InfiniteSlider>
      </div>
    </section>
  );
}
