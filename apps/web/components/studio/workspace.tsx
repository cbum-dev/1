"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Sparkles, Info, Bug } from "lucide-react";
import CodePanel from "./code-panel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StudioWorkspaceProps } from "./types";

const Workspace = memo(function Workspace({
  activeTab,
  onTabChange,
  currentAnimation,
  renderJob,
  videoUrl,
  onDownload,
  onCopyJson,
  onCopyCode,
  copiedJson,
  copiedCode,
}: StudioWorkspaceProps) {
  const validationErrors = currentAnimation?.validation.errors ?? [];

  return (
    <section className="flex flex-col gap-5">
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col gap-4">
        <TabsList className="w-fit rounded-full border border-white/10 bg-white/10 px-2 py-1">
          <TabsTrigger value="preview" className="rounded-full data-[state=active]:bg-white text-grey-400 data-[state=active]:text-black">
            Preview
          </TabsTrigger>
          <TabsTrigger value="json" className="rounded-full data-[state=active]:bg-white text-grey-400 data-[state=active]:text-black">
            JSON IR
          </TabsTrigger>
          <TabsTrigger value="code" className="rounded-full data-[state=active]:bg-white text-grey-400 data-[state=active]:text-black">
            Manim Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-0">
          <Card className="overflow-hidden border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-col gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-5 w-5 text-white/60" />
                Visual Notes
              </CardTitle>
              {validationErrors.length > 0 && (
                <motion.div
                  layout
                  className="rounded-2xl border border-amber-400/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-200/80">
                    <Bug className="h-4 w-4" />
                    Needs attention
                  </div>
                  <ul className="list-disc space-y-1 pl-4">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none rounded-3xl border border-white/10 bg-black/40 p-5 text-sm leading-7 text-white/80">
                {currentAnimation?.description ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentAnimation.description}
                  </ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-3 text-white/40">
                    <Info className="h-5 w-5" />
                    No description generated yet. Describe your animation to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="mt-0">
          <CodePanel
            label="Animation IR"
            code={JSON.stringify(currentAnimation?.json_ir ?? {}, null, 2)}
            language="json"
            onCopy={onCopyJson}
            copied={copiedJson}
          />
        </TabsContent>

        <TabsContent value="code" className="mt-0">
          <CodePanel
            label="Manim Script"
            code={currentAnimation?.manim_code ?? ""}
            language="python"
            onCopy={onCopyCode}
            copied={copiedCode}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
});

export default Workspace;
