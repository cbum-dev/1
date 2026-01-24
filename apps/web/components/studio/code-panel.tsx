import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Download, Edit, Eye } from "lucide-react";
import { motion } from "motion/react";
import Highlight, { defaultProps, type Language, type RenderProps } from "prism-react-renderer";
import nightOwl from "prism-react-renderer/themes/nightOwl";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface CodePanelProps {
  label: string;
  code: string;
  language?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  onChange?: (code: string) => void;
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
  onDownload,
  onChange,
  copied,
  className,
}: CodePanelProps) {
  const lines = useMemo(() => formatLines(code), [code]);
  const [isEditing, setIsEditing] = useState(false);

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
          {isEditing && <span className="text-amber-400 font-bold ml-2 animate-pulse">[EDITING]</span>}
        </div>
        <div className="flex items-center gap-2">
          {onChange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "h-8 gap-2 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
                isEditing && "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
              )}
            >
              {isEditing ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              )}
            </Button>
          )}
          {onDownload && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDownload}
              className="h-8 gap-2 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          )}
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
      </div>

      <div className="relative flex max-h-[520px] min-h-[520px] overflow-auto bg-[#011627]">
        {isEditing ? (
          <Textarea
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-full w-full min-h-[520px] resize-none border-0 bg-transparent p-4 font-mono text-sm leading-6 text-white focus-visible:ring-0"
            spellCheck={false}
          />
        ) : (
          <Highlight
            {...(defaultProps as any)}
            theme={nightOwl as any}
            language={(language || "tsx") as any}
            code={code || ""}
          >
            {({
              className: highlightClassName,
              style,
              tokens,
              getLineProps,
              getTokenProps,
            }: RenderProps) => (
              <div className="flex w-full text-left">
                <div className="sticky left-0 top-0 flex min-w-[3.5rem] flex-col items-end gap-1 bg-black/30 px-3 py-4 text-[10px] font-mono text-white/30 select-none">
                  {lines.map((_, index) => (
                    <span key={`line-${index}`} className="leading-6">
                      {index + 1}
                    </span>
                  ))}
                </div>
                <pre
                  className={cn(
                    highlightClassName,
                    "w-full px-4 py-4 text-sm leading-6 text-white/90"
                  )}
                  style={{
                    ...style as React.CSSProperties,
                    backgroundColor: 'transparent',
                  }}
                >
                  <code className="whitespace-pre">
                    {tokens.length === 0
                      ? "// nothing here yet"
                      : tokens.map((line, index) => (
                        <div key={index} {...getLineProps({ line })}>
                          {line.map((token, tokenIndex) => (
                            <span key={tokenIndex} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                  </code>
                </pre>
              </div>
            )}
          </Highlight>
        )}
      </div>
    </motion.div>
  );
});

export default CodePanel;
