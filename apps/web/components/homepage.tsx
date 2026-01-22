"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import Dither from "@/components/Dither";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute z-10 inset-0">
        <Dither
          waveSpeed={0.05}
          waveFrequency={3}
          waveAmplitude={0.3}
          waveColor={[0.6, 0.6, 0.6]}
          colorNum={4}
          pixelSize={2}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
        />
      </div>


      <div className="pointer-events-none absolute inset-0 bg-black/35" />

      <section className="relative z-20 flex min-h-[calc(100vh-90px)] items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="mx-auto mb-6 z-20 rounded-full border border-white/10 bg-white/10 text-white/80 backdrop-blur-xl"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            New Background + IR Pipeline
          </Badge>

          <h1 className="text-4xl z-20 md:text-6xl font-bold tracking-tight text-white">
            Text → 2D Animations
            <br />
            powered by Gemini + Manim
          </h1>

          <p className="mt-5 z-20 text-base md:text-lg text-white/70">
            Generate an animation plan (IR), validate it, convert it into Manim code, and render a video — end to end.
          </p>

          <div className="mt-8 z-20 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full cursor-pointer px-8">
              Generate Animation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="rounded-full cursor-pointer px-8 bg-white/15 text-white hover:bg-white/25"
            >
              View Docs
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
