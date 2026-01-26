"use client";

import { useEffect, useState, useRef } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export default function BackendHealthBadge() {
    const [showAlert, setShowAlert] = useState(false);
    const [checking, setChecking] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkHealth = async (): Promise<{ ok: boolean; fast: boolean }> => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const startTime = Date.now();

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(`${apiUrl}/health`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const elapsed = Date.now() - startTime;
                const isFast = elapsed < 2000;

                if (res.ok) {
                    return { ok: true, fast: isFast };
                }
                return { ok: false, fast: false };
            } catch {
                return { ok: false, fast: false };
            }
        };

        const runCheck = async () => {
            setChecking(true);
            const result = await checkHealth();

            if (result.ok && result.fast) {
                setShowAlert(false);
                setChecking(false);

                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else {
                setShowAlert(true);
                setChecking(true);

                if (!intervalRef.current) {
                    intervalRef.current = setInterval(runCheck, 3000);
                }
            }
        };

        runCheck();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    if (!showAlert) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                <span>
                    Backend warming up... <span className="opacity-80 text-xs">(free tier spin-up)</span>
                </span>
            </div>
        </div>
    );
}
