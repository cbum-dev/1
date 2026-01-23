"use client";

import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Starter",
        price: "$0",
        description: "Perfect for hobbyists and learning Manim.",
        features: [
            "5 Animations / month",
            "720p Render Quality",
            "Standard Speed",
            "Community Support",
        ],
        highlight: false,
        buttonVariant: "outline" as const,
    },
    {
        name: "Pro",
        price: "$29",
        description: "For creators who need power and speed.",
        features: [
            "Unlimited Animations",
            "1080p & 4K Render Quality",
            "Fast GPU Rendering",
            "Priority Support",
            "Export directly to React",
        ],
        highlight: true,
        buttonVariant: "default" as const,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For teams and high-volume needs.",
        features: [
            "Custom Compute Instances",
            "SSO & Team Management",
            "Dedicated API Access",
            "SLA Support",
            "White-labeling",
        ],
        highlight: false,
        buttonVariant: "outline" as const,
    },
];

import { BackgroundBeams } from "@/components/ui/background-beams";

export default function PricingSection() {
    return (
        <section className="relative w-full bg-black py-24 border-t border-white/5 overflow-hidden">
            {/* Background Beams */}
            <BackgroundBeams className="opacity-40" />

            <div className="container relative z-10 mx-auto px-6">

                <div className="mb-16 flex flex-col items-center text-center">
                    <Badge
                        variant="secondary"
                        className="mb-2"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Pricing Highlights
                    </Badge>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl"
                    >
                        Simple, Transparent Pricing
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 max-w-2xl text-lg text-white/60"
                    >
                        Start for free, scale as you grow. No hidden fees.
                    </motion.p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className={cn(
                                "relative flex flex-col rounded-3xl border p-8 backdrop-blur-3xl",
                                plan.highlight
                                    ? "bg-white/5 border-white/20 ring-1 ring-white/20"
                                    : "bg-black/40 border-white/10"
                            )}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-white/80">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline text-white">
                                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="ml-1 text-white/50">/month</span>}
                                </div>
                                <p className="mt-4 text-sm text-white/50">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                                            plan.highlight ? "bg-indigo-500/20 text-indigo-300" : "bg-white/10 text-white/70"
                                        )}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="text-sm text-white/70">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.buttonVariant}
                                className={cn(
                                    "w-full rounded-xl py-6 text-sm font-semibold transition-all",
                                    plan.highlight
                                        ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                                        : "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                )}
                            >
                                {plan.price === "Custom" ? "Contact Support" : "Get Started"}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
