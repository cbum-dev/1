"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 z-0 flex h-full w-full flex-col items-end justify-center overflow-hidden bg-transparent",
                className
            )}
        >
            <div className="absolute inset-0 m-auto h-[400px] w-[400px] rounded-full bg-indigo-500/20 opacity-50 blur-[80px]" />
            <div className="absolute inset-0 m-auto h-[300px] w-[300px] translate-x-32 translate-y-32 rounded-full bg-purple-500/20 opacity-50 blur-[80px]" />

            {/* Moving beams simulation */}
            <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[50%] -left-[50%] h-[200%] w-[200%] opacity-[0.08]"
                style={{
                    background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, white 60deg, transparent 120deg)",
                }}
            />
        </div>
    );
};
