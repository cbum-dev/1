"use client";

import Link from "next/link";
import FuzzyText from "@/components/FuzzyText";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center bg-black text-white">
            <div className="relative flex flex-col items-center justify-center p-8 text-center">
                <FuzzyText
                    fontSize="clamp(6rem, 20vw, 12rem)"
                    fontWeight={900}
                    color="#EB4034"
                    enableHover={true}
                    baseIntensity={0.2}
                    hoverIntensity={0.8}
                    fuzzRange={50}
                >
                    404
                </FuzzyText>

                <div className="mt-8 space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight text-white/90 md:text-3xl">
                        Page Not Found
                    </h2>
                    <p className="max-w-md text-white/50">
                        The animation you are looking for has drifted into the void.
                        It seems gravity didn't hold this one down.
                    </p>

                    <div className="pt-4">
                        <Link href="/">
                            <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                <ArrowLeft className="h-4 w-4" />
                                Return Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
