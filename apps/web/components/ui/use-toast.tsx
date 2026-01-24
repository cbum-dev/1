"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    description?: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (message: string, description?: string) => void;
    error: (message: string, description?: string) => void;
    info: (message: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        if (toast.duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, toast.duration || 4000);
        }
    }, [removeToast]);

    const helpers = React.useMemo(() => ({
        success: (message: string, description?: string) => addToast({ message, description, type: "success" }),
        error: (message: string, description?: string) => addToast({ message, description, type: "error" }),
        info: (message: string, description?: string) => addToast({ message, description, type: "info" }),
    }), [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, ...helpers }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none p-4 md:p-0">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-400" />,
        error: <AlertCircle className="h-5 w-5 text-red-400" />,
        info: <Info className="h-5 w-5 text-blue-400" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-400" />,
    };

    const bgColors = {
        success: "bg-black/90 border-green-500/20",
        error: "bg-black/90 border-red-500/20",
        info: "bg-black/90 border-blue-500/20",
        warning: "bg-black/90 border-amber-500/20",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg shadow-black/20 backdrop-blur-xl",
                bgColors[toast.type]
            )}
        >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 space-y-1">
                <p className="font-medium text-sm text-white">{toast.message}</p>
                {toast.description && <p className="text-xs text-white/70">{toast.description}</p>}
            </div>
            <button onClick={onClose} className="shrink-0 text-white/50 hover:text-white transition-colors">
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
}
