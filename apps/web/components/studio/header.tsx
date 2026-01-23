"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Play, CheckCircle2 } from "lucide-react";
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
}: StudioHeaderProps) {
  return (
    <header className="flex flex-shrink-0 flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2 text-indigo-300">
          <Sparkles className="h-5 w-5" />
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
        <div className="flex items-center justify-end gap-2">
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
