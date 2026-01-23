"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Play, Plus, ShieldQuestion } from "lucide-react";
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
    <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_0_30px_rgba(8,8,12,0.45)] md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <motion.div
          layout
          className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-white/40"
        >
          <Sparkles className="h-4 w-4 text-white/60" />
          <span>Animation Studio</span>
        </motion.div>
        <motion.h1
          layout
          className="text-2xl font-semibold text-white md:text-3xl"
        >
          {currentAnimation ? "Your live storyboard" : "Build motion from ideas"}
        </motion.h1>
        {currentAnimation && (
          <motion.div
            layout
            className="flex flex-wrap items-center gap-3 text-xs text-white/50"
          >
            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/70">
              {statusCopy[currentAnimation.validation.valid ? "valid" : "invalid"]}
            </div>
            {conversationSaved && (
              <span className="rounded-full border border-white/15 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                Saved
              </span>
            )}
          </motion.div>
        )}
      </div>

      <motion.div
        layout
        className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4"
      >
        <div className="flex flex-col items-start text-xs text-white/50 md:items-end">
          {user ? (
            <span>{user.username}</span>
          ) : (
            <span>Guest workspace</span>
          )}
          {user && (
            <span className="text-white/60">{user.credits_remaining} credits remaining</span>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/15"
            onClick={onNewChat}
          >
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/15"
            onClick={onViewAccess}
          >
            <ShieldQuestion className="mr-2 h-4 w-4" />
            Workspace access
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!currentAnimation}
            className="border-white/20 bg-white/5 text-white hover:bg-white/15"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onRender}
            disabled={!canRender}
            className="bg-white text-black hover:bg-white/90"
          >
            {rendering ? (
              <>
                <motion.span
                  className="mr-2 h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                />
                Rendering...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Render
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </header>
  );
});

export default Header;
