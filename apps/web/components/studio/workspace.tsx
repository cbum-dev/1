"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download, Sparkles, Info, Bug, Mic, Volume2 } from "lucide-react";
import CodePanel from "./code-panel";
import { DesignPanel } from "./design-panel";
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
  onDownloadCode,
  onCopyJson,
  onAnimationChange,
  onCopyCode,
  copiedJson,
  copiedCode,
  audioConfig,
  onAudioConfigChange,
}: StudioWorkspaceProps) {
  const validationErrors = currentAnimation?.validation.errors ?? [];

  return (
    <section className="flex flex-col gap-5 h-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col gap-4 h-full">
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
          <TabsTrigger value="audio" className="rounded-full data-[state=active]:bg-white text-grey-400 data-[state=active]:text-black">
            Audio
          </TabsTrigger>
          <TabsTrigger value="design" className="rounded-full data-[state=active]:bg-white text-grey-400 data-[state=active]:text-black">
            Design
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-0 flex-1 min-h-0 overflow-y-auto">
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
            onDownload={onDownloadCode}
            copied={copiedCode}
            onChange={currentAnimation ? (code) => onAnimationChange({ ...currentAnimation, manim_code: code }) : undefined}
          />
        </TabsContent>

        <TabsContent value="audio" className="mt-0">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Mic className="h-5 w-5 text-white/60" />
                Audio Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="audio-enabled"
                  checked={audioConfig.enabled}
                  onChange={(e) => onAudioConfigChange({ ...audioConfig, enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-white/20 bg-white/10 accent-indigo-500 cursor-pointer"
                />
                <Label htmlFor="audio-enabled" className="text-base font-medium text-white cursor-pointer select-none">
                  Enable Voiceover
                </Label>
              </div>

              {audioConfig.enabled && (
                <div className="space-y-3">
                  <Label htmlFor="voice-text" className="text-white/80">
                    Script (Text to Speech)
                  </Label>
                  <Textarea
                    id="voice-text"
                    value={audioConfig.text}
                    onChange={(e) => onAudioConfigChange({ ...audioConfig, text: e.target.value })}
                    placeholder="Enter the text you want the narrator to speak..."
                    className="min-h-[200px] resize-none border-white/10 bg-black/20 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-0 text-base leading-relaxed"
                  />
                  <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
                    <p className="text-xs text-indigo-200 flex items-start gap-2">
                      <Volume2 className="h-4 w-4 shrink-0 mt-0.5" />
                      Audio will be generated using Google TTS and merged with your video. The video duration acts as the master timeline.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="mt-0 h-full flex-1 min-h-0">
          <Card className="h-full border-white/10 bg-white/5 overflow-hidden rounded-2xl">
            {currentAnimation && (
              <DesignPanel
                animation={currentAnimation}
                onChange={(newIr) => onAnimationChange({ ...currentAnimation, json_ir: newIr })}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
});

export default Workspace;
