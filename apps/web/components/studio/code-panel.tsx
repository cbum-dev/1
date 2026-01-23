"use client";

import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface CodePanelProps {
  label: string;
  code: string;
  language?: string;
  onCopy?: () => void;
  copied?: boolean;
  className?: string;
}

function formatLines(code: string) {
  const lines = code.split(/\r?\n/);
  // Ensure we show at least one empty line for empty code blocks
  return lines.length > 0 ? lines : [" "];
}

const CodePanel = memo(function CodePanel({
  label,
  code,
  language,
  onCopy,
  copied,
  className,
}: CodePanelProps) {
  const lines = useMemo(() => formatLines(code), [code]);

  return (
    <motion.div
      layout
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5/50 backdrop-blur-lg",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
          <span>{label}</span>
          {language && (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50">
              {language.toUpperCase()}
            </span>
          )}
        </div>
        {onCopy && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            className="h-8 gap-2 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        )}
      </div>

      <div className="relative flex max-h-[520px] overflow-auto">
        <div className="sticky left-0 top-0 flex min-w-[3.5rem] flex-col items-end gap-1 bg-black/30 px-3 py-4 text-[10px] font-mono text-white/30">
          {lines.map((_, index) => (
            <span key={index} className="leading-6">
              {index + 1}
            </span>
          ))}
        </div>
        <pre className="w-full px-4 py-4 text-sm leading-6 text-white/90">
          <code className="whitespace-pre">
            {code || "// nothing here yet"}
          </code>
        </pre>
      </div>
    </motion.div>
  );
});

export default CodePanel;
