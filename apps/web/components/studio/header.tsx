"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Play, CheckCircle2, Palette } from "lucide-react";
import { StudioHeaderProps } from "./types";

const statusCopy = {
  valid: "Ready to render",
  invalid: "Needs adjustments",
};

const Header = memo(function Header({
  currentAnimation,
  conversationSaved,
  onReset,
  onRender,
  canRender,
  rendering,
  user,
  onNewChat,
  onViewAccess,
  currentStyle = "default",
  onStyleChange,
}: StudioHeaderProps) {
  return (
    <header className="flex flex-shrink-0 flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        {/* ... Logo area kept same ... */}
        <div className="flex items-center gap-2 rounded-lg p-2">
          <img src="/logo.svg" alt="ManimFlow" className="h-8 w-8" />
        </div>
        <div className="space-y-0.5">
          <motion.h1
            layout
            className="text-lg font-semibold text-white"
          >
            {currentAnimation ? "Animation Studio" : "New Project"}
          </motion.h1>
          {currentAnimation ? (
            <motion.div
              layout
              className="flex items-center gap-2 text-xs text-white/50"
            >
              <span className={currentAnimation.validation.valid ? "text-emerald-400" : "text-amber-400"}>
                {statusCopy[currentAnimation.validation.valid ? "valid" : "invalid"]}
              </span>
              {conversationSaved && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </span>
                </>
              )}
            </motion.div>
          ) : (
            <p className="text-xs text-white/50">Describe your scene to generate code</p>
          )}
        </div>
      </div>

      <motion.div
        layout
        className="flex flex-col gap-2 md:flex-row md:items-center"
      >
        <div className="flex items-center justify-end gap-3">
          {onStyleChange && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10">
              <Palette className="h-3.5 w-3.5 text-white/60" />
              <select
                value={currentStyle}
                onChange={(e) => onStyleChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-white outline-none cursor-pointer"
              >
                <option value="default" className="bg-zinc-900 text-white">Default</option>
                <option value="cyberpunk" className="bg-zinc-900 text-white">Cyberpunk</option>
                <option value="chalkboard" className="bg-zinc-900 text-white">Chalkboard</option>
                <option value="light" className="bg-zinc-900 text-white">Light Mode</option>
              </select>
            </div>
          )}

          {currentAnimation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 text-white/60 hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reset
            </Button>
          )}

          <div className="mx-2 hidden h-6 w-px bg-white/10 md:block" />

          <Button
            size="sm"
            onClick={onRender}
            disabled={!canRender || rendering}
            className="h-9 min-w-[100px] bg-white font-medium text-black shadow-lg shadow-white/5 hover:bg-white/90 disabled:opacity-50"
          >
            {rendering ? (
              <>
                <motion.span
                  className="mr-2 h-3.5 w-3.5 rounded-full border-2 border-black/20 border-t-black"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                />
                Rendering
              </>
            ) : (
              <>
                <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                Render
              </>
            )}
          </Button>
        </div>

        {user && (
          <div className="hidden items-end flex-col text-[10px] text-white/30 md:flex">
            <span>{user.username}</span>
            <span>{user.credits_remaining} credits</span>
          </div>
        )}
      </motion.div>
    </header>
  );
});

export default Header;
