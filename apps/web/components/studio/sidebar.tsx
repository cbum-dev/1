"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, History, MessageSquarePlus, Trash2, FolderOpen, ArrowUpRight, LockKeyhole, ShieldQuestion, Plus } from "lucide-react";
import { StudioSidebarProps } from "./types";

const Sidebar = memo(function Sidebar({
  user,
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
  hasActiveConversation,
  onNewConversation,
  onViewAccess,
}: StudioSidebarProps) {
  return (
    <aside className="flex h-full flex-col gap-6">
      <Card className="flex flex-1 flex-col overflow-hidden border-white/10 bg-white/5">
        <CardHeader className="flex flex-col gap-4 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            <History className="h-4 w-4" />
            Library
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="flex-1 rounded-full bg-white text-black hover:bg-white/90 sm:flex-none"
              onClick={onNewConversation}
            >
              <Plus className="mr-2 h-4 w-4" />
              New chat
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:flex-none"
              onClick={onViewAccess}
            >
              <ShieldQuestion className="mr-2 h-4 w-4" />
              Workspace access
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <Tabs
            value={sidebarView}
            onValueChange={(value) => onSidebarViewChange(value as "templates" | "history")}
            className="flex flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/10 p-1 text-xs uppercase tracking-[0.25em] text-white/50">
              <TabsTrigger
                value="templates"
                className="rounded-full px-3 py-1 text-white/60 transition data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-full px-3 py-1 text-white/60 transition data-[state=active]:bg-white data-[state=active]:text-black"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4 flex-1 overflow-hidden">
              {hasActiveConversation ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-center text-xs text-white/50">
                  <p>Templates are hidden while you are in a conversation.</p>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/15 text-white hover:bg-white/10"
                    onClick={onNewConversation}
                  >
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Start a new chat to browse
                  </Button>
                </div>
              ) : (
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
              )}
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

          {user ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-white/60 hover:text-white"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  );
});

export default Sidebar;
