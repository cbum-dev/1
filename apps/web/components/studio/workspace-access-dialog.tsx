"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudioUser } from "./types";
import { Sparkles, ShieldCheck, CreditCard, Hourglass } from "lucide-react";

interface WorkspaceAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StudioUser | null;
  limits?: Record<string, unknown> | null;
  onRequireAuth: () => void;
  onLogout: () => void;
}

const tierCopy: Record<string, { label: string; description: string }> = {
  free: {
    label: "Free",
    description: "Explore the studio with limited credits and starter templates.",
  },
  pro: {
    label: "Pro",
    description: "Unlock advanced templates and faster rendering speeds.",
  },
  enterprise: {
    label: "Enterprise",
    description: "Collaborate with teammates and access white-glove support.",
  },
};

export default function WorkspaceAccessDialog({
  open,
  onOpenChange,
  user,
  limits,
  onRequireAuth,
  onLogout,
}: WorkspaceAccessDialogProps) {
  const copy = user ? tierCopy[user.tier] ?? tierCopy.free : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-white/15 bg-black/90 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-wide text-white">
            Workspace access
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Manage how you enter the studio, review your limits, and understand what’s included in
            your plan.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="border border-white/20 bg-white/10 text-white/80">
                      {copy?.label ?? "Member"}
                    </Badge>
                    <span className="text-sm text-white/50">{user.email}</span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-white">{user.username}</p>
                  <p className="text-sm text-white/60">{copy?.description}</p>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {user.credits_remaining} credits left
                </div>
              </div>
            </div>

            {limits && Object.keys(limits).length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Plan limits</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(limits).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/35">{key}</p>
                      <p className="mt-2 text-base font-semibold text-white">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                <Hourglass className="h-4 w-4" />
                Limits will appear here once available for your tier.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/60" />
              <p className="text-base font-semibold text-white">Sign in to unlock the studio</p>
              <p className="mt-2 text-sm text-white/60">
                Access curated templates, save conversations, and render high-fidelity videos once
                you create an account.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-left text-sm text-white/70">
                <ShieldCheck className="mb-3 h-5 w-5 text-white/60" />
                Secured workspace with invitation-only access
              </div>
              <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-left text-sm text-white/70">
                <CreditCard className="mb-3 h-5 w-5 text-white/60" />
                Start on the free tier—upgrade anytime
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {user ? (
            <Button variant="ghost" className="text-white/70 hover:text-white" onClick={onLogout}>
              Sign out
            </Button>
          ) : (
            <Button variant="ghost" className="text-white/70 hover:text-white" onClick={onRequireAuth}>
              Already have an account? Log in
            </Button>
          )}
          <Button
            className="bg-white text-black hover:bg-white/90"
            onClick={user ? () => onOpenChange(false) : onRequireAuth}
          >
            {user ? "Close" : "Sign up for access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
