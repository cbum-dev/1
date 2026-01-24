"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export default function BackendHealthBadge() {
    const [isHealthy, setIsHealthy] = useState(true); // Assume healthy initially to avoid flash
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkHealth = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/health`);
                if (res.ok) {
                    setIsHealthy(true);
                    setChecking(false); // Stop checking once healthy
                    return true;
                }
                throw new Error("Not healthy");
            } catch (error) {
                setIsHealthy(false);
                setChecking(true);
                return false;
            }
        };

        // Initial check
        checkHealth().then((healthy) => {
            if (!healthy) {
                // If initial check fails, start polling
                interval = setInterval(async () => {
                    const healthy = await checkHealth();
                    if (healthy) {
                        clearInterval(interval);
                    }
                }, 5000);
            }
        });

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    if (isHealthy) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <span>
                    Connecting to backend... <span className="opacity-80 text-xs">(free tier spin-up)</span>
                </span>
            </div>
        </div>
    );
}
