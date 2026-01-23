"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
      <nav className="flex w-[min(920px,92vw)] items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">ManimFlow</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/" className="hover:text-white transition cursor-pointer">
            Home
          </Link>
          <Link href="/studio" className="hover:text-white transition cursor-pointer">
            Studio
          </Link>
          <Link href="/docs" className="hover:text-white transition cursor-pointer">
            Docs
          </Link>

          <Button size="sm" className="rounded-full cursor-pointer">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
