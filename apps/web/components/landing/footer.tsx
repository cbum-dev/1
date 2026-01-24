"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Twitter, Github, Linkedin, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CircularText from "../CircularText";

const footerLinks = {
    product: [
        { name: "Features", href: "#" },
        { name: "Pricing", href: "#" },
        { name: "Templates", href: "#" },
        { name: "Documentation", href: "#" },
    ],
    company: [
        { name: "About", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "#" },
    ],
    legal: [
        { name: "Privacy", href: "#" },
        { name: "Terms", href: "#" },
        { name: "License", href: "#" },
    ],
};

export default function Footer() {
    return (
        <footer className="relative w-full border-t border-white/5 bg-black pt-20 overflow-hidden">
            <div className="pointer-events-none absolute -bottom-8 right-0 z-0 opacity-30">
                <CircularText
                    text="MANIM*GEMINI*ANIMATION*"
                    onHover="speedUp"
                    spinDuration={20}
                    className="h-[220px] w-[220px]"
                />
            </div>
            <div className="container relative z-10 mx-auto px-6">
                <div className="grid gap-12 lg:grid-cols-12 mb-20">

                    {/* Brand & Newsletter Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <Link href="/" className="flex items-center gap-2 text-white">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                                <img src="/logo.svg" alt="ManimFlow" className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Manimflow</span>
                        </Link>
                        <p className="text-sm leading-relaxed text-white/50 max-w-md">
                            The next-generation animation engine for developers.
                            Join our newsletter to get the latest updates, templates, and Manim tips directly to your inbox.
                        </p>

                        <div className="flex gap-2 max-w-sm">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500"
                            />
                            <Button size="icon" className="shrink-0 bg-white text-black hover:bg-white/90">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-4 pt-4">
                            {[Twitter, Github, Linkedin].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="#"
                                    whileHover={{ y: -3 }}
                                    className="rounded-full bg-white/5 p-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <Icon className="h-4 w-4" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="lg:col-span-1" />

                    {/* Links Columns */}
                    <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Product</h3>
                            <ul className="space-y-3">
                                {footerLinks.product.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-white/50 hover:text-white transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Company</h3>
                            <ul className="space-y-3">
                                {footerLinks.company.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-white/50 hover:text-white transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
                            <ul className="space-y-3">
                                {footerLinks.legal.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-white/50 hover:text-white transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/40">
                        © {new Date().getFullYear()} Manimflow Inc.
                    </p>
                    <div className="flex gap-6 text-xs text-white/40">
                        <Link href="#" className="hover:text-white">Privacy</Link>
                        <Link href="#" className="hover:text-white">Terms</Link>
                        <Link href="#" className="hover:text-white">Cookies</Link>
                    </div>
                </div>
            </div>

            {/* Massive Background Text */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 select-none opacity-[0.03]">
                <h1 className="text-[20vw] font-bold leading-none text-white whitespace-nowrap">
                    {'MANIM</>'}
                </h1>
            </div>

            {/* Bottom Gradient Glow */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-900/20 to-transparent" />
        </footer>
    );
}
