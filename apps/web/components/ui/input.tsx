"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
