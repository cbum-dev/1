"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  LogOut,
  History,
  MessageSquarePlus,
  Trash2,
  FolderOpen,
  ArrowUpRight,
  LockKeyhole,
} from "lucide-react";
import { StudioSidebarProps } from "./types";
import { cn } from "@/lib/utils";

const tiers: Record<string, { label: string; accent: string }> = {
  free: { label: "Free", accent: "from-slate-500 to-slate-300" },
  pro: { label: "Pro", accent: "from-emerald-500 to-emerald-300" },
  enterprise: { label: "Enterprise", accent: "from-amber-500 to-amber-300" },
};

function TierBadge({ tier = "free" }: { tier?: string }) {
  const info = tiers[tier as keyof typeof tiers] ?? tiers.free;
  return (
    <Badge className={cn("border border-white/20 bg-white/10 text-white", "bg-gradient-to-r", info.accent)}>
      {info.label}
    </Badge>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-10 text-center">
      <Sparkles className="h-6 w-6 text-white/60" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-white/80">Sign in to unlock everything</p>
        <p className="text-xs text-white/50">
          Access templates, save conversations, and render videos with your credits.
        </p>
      </div>
      <Button onClick={onAction} className="rounded-full bg-white text-black hover:bg-white/90">
        Sign In / Register
      </Button>
    </div>
  );
}

const Sidebar = memo(function Sidebar({
  user,
  userLimits,
  onRequireAuth,
  onLogout,
  sidebarView,
  onSidebarViewChange,
  loadingHistory,
  savedConversations,
  savedProjects,
  templates,
  onApplyTemplate,
  onLoadConversation,
  onDeleteConversation,
}: StudioSidebarProps) {
  return (
    <aside className="flex flex-col gap-6">
      <Card className="overflow-hidden border-white/10 bg-white/5 shadow-[0_0_30px_rgba(8,8,12,0.35)]">
        <CardHeader className="space-y-4 pb-6">
          <CardTitle className="flex items-center justify-between text-base font-semibold text-white">
            <span>Workspace Access</span>
            {user ? (
              <TierBadge tier={user.tier} />
            ) : (
              <Badge variant="secondary" className="border-white/20 bg-white/10 text-white/70">
                Guest
              </Badge>
            )}
          </CardTitle>

          {user ? (
            <motion.div
              layout
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
            >
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
                <span>User</span>
                <span>ID</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{user.username}</p>
                  <p className="text-xs text-white/50">{user.email}</p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  Credits: <span className="font-semibold text-white">{user.credits_remaining}</span>
                </div>
              </div>

              {userLimits && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/60">
                  {Object.entries(userLimits).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="uppercase tracking-[0.16em] text-[10px] text-white/40">{key}</p>
                      <p className="mt-1 text-sm font-medium text-white/80">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          ) : (
            <EmptyState onAction={onRequireAuth} />
          )}
        </CardHeader>
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden border-white/10 bg-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            <History className="h-4 w-4" />
            Library
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <Tabs
            value={sidebarView}
            onValueChange={(value) => onSidebarViewChange(value as "templates" | "history")}
            className="flex flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/10 text-white/60">
              <TabsTrigger value="templates" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">
                Templates
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4 flex-1 overflow-hidden">
              <div className="flex flex-col gap-3">
                {templates.length === 0 && (
                  <p className="text-xs text-white/50">
                    Browse curated starters to jump into a new animation quickly.
                  </p>
                )}
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => (user ? onApplyTemplate(template) : onRequireAuth())}
                    className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left transition hover:border-white/30 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold text-white">
                      <span>{template.name}</span>
                      <ArrowUpRight className="h-4 w-4 text-white/50 group-hover:text-white" />
                    </div>
                    <p className="text-xs text-white/50">{template.description}</p>
                    {template.is_premium && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                        <LockKeyhole className="h-3 w-3" />
                        Premium
                      </div>
                    )}
                  </motion.button>
                ))}
                {templates.length === 0 && (
                  <Button
                    variant="ghost"
                    className="mt-2 justify-start rounded-full border border-white/20 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                    onClick={onRequireAuth}
                  >
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Sign in to unlock templates
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4 flex-1 overflow-hidden">
              <div className="flex h-full flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Conversations</p>
                  <div className="space-y-2">
                    {loadingHistory ? (
                      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-xs text-white/40">
                        Loading your sessions ...
                      </div>
                    ) : savedConversations.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-xs text-white/50">
                        No saved conversations yet.
                      </div>
                    ) : (
                      savedConversations.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          whileHover={{ y: -2 }}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                        >
                          <button
                            className="flex-1 text-left"
                            onClick={() => onLoadConversation(conversation.id)}
                          >
                            <p className="text-sm font-semibold text-white">{conversation.title}</p>
                            <p className="text-xs text-white/50">
                              {conversation.message_count ?? 0} messages • {new Date(conversation.updated_at).toLocaleDateString()}
                            </p>
                          </button>
                          <button
                            onClick={() => onDeleteConversation(conversation.id)}
                            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {savedProjects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Projects</p>
                    <div className="space-y-2">
                      {savedProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70"
                        >
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-white/40" />
                            <div>
                              <p className="font-medium text-white">{project.title}</p>
                              <p className="text-xs text-white/40">{new Date(project.updated_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="border-white/10 bg-white/10 text-white/60">
                            {project.description ? project.description.slice(0, 18) + "…" : "Draft"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </aside>
  );
});

export default Sidebar;
