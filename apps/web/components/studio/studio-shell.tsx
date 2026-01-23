"use client";

import { type ReactNode } from "react";
import Dither from "@/components/Dither";
import { cn } from "@/lib/utils";

interface StudioShellProps {
  children: ReactNode;
  className?: string;
  ambient?: ReactNode;
  overlay?: ReactNode;
}

export default function StudioShell({ children, className, ambient, overlay }: StudioShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <Dither
          waveSpeed={0.05}
          waveFrequency={3}
          waveAmplitude={0.3}
          waveColor={[0.45, 0.45, 0.55]}
          colorNum={5}
          pixelSize={2}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.25}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-black/85 to-[#080112]" />
      {ambient && <div className="pointer-events-none absolute inset-0 z-0">{ambient}</div>}

      <div className={cn("relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-10 md:px-8 lg:px-12", className)}>
        {children}
      </div>
      {overlay && <div className="pointer-events-none absolute inset-0 z-20 mix-blend-screen opacity-80">{overlay}</div>}
    </main>
  );
}
