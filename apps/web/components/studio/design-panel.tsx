"use client";

import { memo } from "react";
import { AnimationState } from "./types"; // Importing AnimationState
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paintbrush, Layers, Type, Square, Circle as CircleIcon, Palette } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DesignPanelProps {
    animation: AnimationState;
    onChange: (newIr: any) => void;
}

export const DesignPanel = memo(function DesignPanel({ animation, onChange }: DesignPanelProps) {
    const jsonIr = animation.json_ir;

    if (!jsonIr || !jsonIr.scenes) {
        return (
            <div className="flex h-full items-center justify-center text-white/40">
                <div className="text-center">
                    <Paintbrush className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>No designable elements found</p>
                </div>
            </div>
        );
    }

    const handleSceneBgChange = (sceneIndex: number, color: string) => {
        const newIr = { ...jsonIr };
        if (newIr.scenes[sceneIndex]) {
            newIr.scenes[sceneIndex].background_color = color;
        }
        onChange(newIr);
    };

    const handleObjectColorChange = (sceneIndex: number, objIndex: number, color: string) => {
        const newIr = { ...jsonIr };
        if (newIr.scenes[sceneIndex]?.objects[objIndex]) {
            newIr.scenes[sceneIndex].objects[objIndex].color = color;
        }
        onChange(newIr);
    };

    const handleObjectContentChange = (sceneIndex: number, objIndex: number, content: string) => {
        const newIr = { ...jsonIr };
        if (newIr.scenes[sceneIndex]?.objects[objIndex]) {
            newIr.scenes[sceneIndex].objects[objIndex].content = content;
        }
        onChange(newIr);
    };

    // Helper to update object properties roughly (text content etc could be added later)

    return (
        <div className="h-full w-full bg-[#0b0c15] text-white">
            <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                            <Paintbrush className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Visual Editor</h3>
                            <p className="text-xs text-white/50">Style your animation without code</p>
                        </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="scene-0">
                        {jsonIr.scenes.map((scene: any, sceneIndex: number) => (
                            <AccordionItem
                                key={scene.scene_id || sceneIndex}
                                value={`scene-${sceneIndex}`}
                                className="border rounded-xl border-white/10 bg-white/5 px-4"
                            >
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <Layers className="h-4 w-4 text-white/60" />
                                        <span className="font-medium">Scene {sceneIndex + 1}</span>
                                        <span className="ml-auto mr-4 text-xs text-white/30 truncate max-w-[100px]">{scene.narration?.slice(0, 20)}...</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 space-y-6">
                                    {/* Scene Settings */}
                                    <div className="space-y-3 pt-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-white/40">Background</Label>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-8 w-8 rounded-full border border-white/20 shadow-inner"
                                                style={{ backgroundColor: scene.background_color || '#000000' }}
                                            />
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Palette className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                                                    <Input
                                                        type="text"
                                                        value={scene.background_color}
                                                        onChange={(e) => handleSceneBgChange(sceneIndex, e.target.value)}
                                                        className="h-9 border-white/10 bg-black/20 pl-9 text-xs text-white font-mono"
                                                        placeholder="#000000"
                                                    />
                                                </div>
                                            </div>
                                            <Input
                                                type="color"
                                                value={scene.background_color || '#000000'}
                                                onChange={(e) => handleSceneBgChange(sceneIndex, e.target.value)}
                                                className="h-9 w-9 border-0 p-1 bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Objects List */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-white/40">Objects ({scene.objects?.length || 0})</Label>
                                        <div className="grid gap-3">
                                            {scene.objects?.map((obj: any, objIndex: number) => {
                                                const Icon = obj.type === 'text' ? Type :
                                                    obj.type === 'shape' && obj.shape === 'circle' ? CircleIcon :
                                                        Square;
                                                return (
                                                    <div key={obj.id || objIndex} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-3 hover:border-white/10 transition-colors">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/5">
                                                            <Icon className="h-4 w-4 text-white/60" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            {obj.type === 'text' ? (
                                                                <Input
                                                                    value={obj.content || ''}
                                                                    onChange={(e) => handleObjectContentChange(sceneIndex, objIndex, e.target.value)}
                                                                    className="h-7 text-xs bg-black/40 border-white/10 text-white placeholder:text-white/30"
                                                                    placeholder="Text content..."
                                                                />
                                                            ) : (
                                                                <div className="text-sm font-medium truncate">{obj.description || obj.id}</div>
                                                            )}
                                                            <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{obj.type}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-6 w-6 rounded border border-white/10"
                                                                style={{ backgroundColor: obj.color || '#ffffff' }}
                                                            />
                                                            <Input
                                                                type="color"
                                                                value={obj.color || '#ffffff'}
                                                                onChange={(e) => handleObjectColorChange(sceneIndex, objIndex, e.target.value)}
                                                                className="h-8 w-8 border-0 p-0 bg-transparent cursor-pointer opacity-0 absolute w-8"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </ScrollArea>
        </div>
    );
});
