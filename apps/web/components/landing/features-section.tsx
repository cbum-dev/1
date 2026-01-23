"use client";

import MagicBento, { BentoCardProps } from "@/components/MagicBento";
import { motion } from "motion/react";
import { Sparkles, Code2, Zap, History, Music, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 6 Features: 4 Existing + 2 New (Coming Soon)
const features: BentoCardProps[] = [
    {
        title: "AI Logic",
        description: "Gemini-powered scene understanding and motion timing.",
        label: "Core",
        icon: <Sparkles className="h-5 w-5 text-amber-400" />,
        color: "#0a0a0a",
    },
    {
        title: "Python Export",
        description: "Get raw Manim code for infinite flexibility.",
        label: "Dev",
        icon: <Code2 className="h-5 w-5 text-blue-400" />,
        color: "#0a0a0a",
    },
    {
        title: "Instant Preview",
        description: "Real-time rendering feedback loop.",
        label: "Speed",
        icon: <Zap className="h-5 w-5 text-purple-400" />,
        color: "#0a0a0a",
    },
    {
        title: "Audio Addition",
        description: "Sync voiceovers and sound effects automatically.",
        label: "Coming Soon",
        icon: <Music className="h-5 w-5 text-pink-400" />,
        color: "#110020", // Slightly different bg to highlight
    },
    {
        title: "Time Travel",
        description: "Version history and branching for every project.",
        label: "Safety",
        icon: <History className="h-5 w-5 text-green-400" />,
        color: "#0a0a0a",
    },
    {
        title: "Teams",
        description: "Real-time collaboration and shared asset libraries.",
        label: "Pro",
        icon: <Users className="h-5 w-5 text-cyan-400" />,
        color: "#061020",
    }
];

export default function FeaturesSection() {
    return (
        <section className="relative z-10 w-full bg-black py-24">
            <div className="container mx-auto px-6">
                <div className="mb-16 flex flex-col items-center text-center">
                    <Badge
                        variant="secondary"
                        className="mb-2"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Features Highlights
                    </Badge>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl"
                    >
                        Powerful Features
                    </motion.h2>
                    <p className="mt-4 max-w-2xl text-lg text-white/60">
                        Everything needed for production-grade animation.
                    </p>
                </div>

                <div className="flex justify-center">
                    <MagicBento
                        cards={features}
                        textAutoHide={true}
                        enableStars={true}
                        enableSpotlight={true}
                        enableBorderGlow={true}
                        enableTilt={false}
                        enableMagnetism={false} // User requested false
                        clickEffect={true}
                        spotlightRadius={400}
                        particleCount={12}
                        glowColor="132, 0, 255"
                        disableAnimations={false}
                    />
                </div>
            </div>
        </section>
    );
}
