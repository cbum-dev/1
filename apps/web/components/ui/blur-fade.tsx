"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const BlurFade = ({
    children,
    className,
    delay = 0,
    yOffset = 20,
    blur = "10px",
    duration = 0.8,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    yOffset?: number;
    blur?: string;
    duration?: number;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ max: 1, duration, delay, ease: "easeOut" }}
            className={cn("inline-block", className)}
        >
            {children}
        </motion.div>
    );
};
