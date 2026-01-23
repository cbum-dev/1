"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function HeroImage() {
    return (
        <section className="relative w-full pb-20 pt-5 px-6 flex justify-center overflow-visible z-30 -mt-20 md:-mt-32 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="relative mx-auto w-full max-w-6xl rounded-xl border border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl pointer-events-auto"
            >
                <div className="absolute -top-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-20" />
                <div className="absolute -bottom-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-20" />

                <div className="rounded-xl backdrop-blur-2xl overflow-hidden p-2 bg-white/5 ring-1 ring-white/10">
                    <div className="rounded-lg overflow-hidden relative aspect-video bg-black/50 border border-white/10">
                        <Image
                            src="/studio.png"
                            alt="Manimflow Studio Dashboard"
                            fill
                            className="object-cover object-top"
                        />
                    </div>
                </div>

                {/* Glow effect under the image */}
                <div className="absolute -inset-1 -z-10 rounded-xl bg-indigo-500/20 opacity-20 blur-3xl" />
            </motion.div>
        </section>
    );
}
