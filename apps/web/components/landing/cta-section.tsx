"use client";

import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CtaSection() {
    return (
        <section className="w-full py-24 bg-background flex justify-center items-center overflow-hidden">
            <div className="container px-6 flex justify-center">
                <SpotlightCard
                    className="w-full max-w-4xl border-neutral-200 bg-white/50 dark:border-white/10 dark:bg-white/5 backdrop-blur-3xl"
                    spotlightColor="rgba(120, 119, 198, 0.1)"
                >
                    <div className="relative z-10 flex flex-col items-center text-center space-y-8 py-8">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <div className="flex items-center justify-center gap-2 text-indigo-500 dark:text-indigo-400 mb-4">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-sm font-mono tracking-widest uppercase">Start Creating</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                                Ready to Animate?
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                                Join thousands of developers creating stunning animations with code.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="rounded-full px-8 cursor-pointer shadow-lg shadow-indigo-500/20">
                                Get Started Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button size="lg" variant="ghost" className="rounded-full px-8 hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer text-foreground">
                                Read Documentation
                            </Button>
                        </div>
                    </div>
                </SpotlightCard>
            </div>
        </section>
    );
}
