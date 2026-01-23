"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, MessageSquarePlus, Trash2, FolderOpen, ArrowUpRight, LockKeyhole, ShieldQuestion, Plus, LayoutTemplate, Clock } from "lucide-react";
import { StudioSidebarProps } from "./types";
import { cn } from "@/lib/utils";

import ChatPanel from "./chat-panel";

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
  chatProps,
  className,
}: StudioSidebarProps) {
  return (
    <aside className={cn("flex h-full flex-col overflow-hidden bg-black/20 backdrop-blur-xl lg:w-full lg:rounded-3xl lg:border lg:border-white/10", className)}>
      <div className="flex flex-col gap-4 p-5 pb-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
            <LayoutTemplate className="h-4 w-4" />
            Library
          </span>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/40 hover:text-white"
              onClick={onViewAccess}
              title="Workspace Access"
            >
              <ShieldQuestion className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          className="w-full justify-start bg-white font-medium text-black hover:bg-white/90"
          onClick={onNewConversation}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Animation
        </Button>
      </div>

      <div className="flex-1 overflow-hidden px-5">
        <Tabs
          value={sidebarView}
          onValueChange={(value) => onSidebarViewChange(value as "templates" | "history" | "chat")}
          className="flex h-full flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1">
            <TabsTrigger
              value="chat"
              className="text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 overflow-hidden pt-4">
            <ChatPanel
              {...chatProps}
              className="h-full border-0 bg-transparent p-0 shadow-none"
            />
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-y-auto pt-4">
            {hasActiveConversation ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-white/5 p-4">
                  <MessageSquarePlus className="h-6 w-6 text-white/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Active Session</p>
                  <p className="px-4 text-xs text-white/50">
                    Finish your current animation to browse templates again.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-white/10 bg-transparent text-white hover:bg-white/5"
                  onClick={onNewConversation}
                >
                  Start New
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pb-4">
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => (user ? onApplyTemplate(template) : onRequireAuth())}
                    className="group relative flex flex-col gap-1.5 rounded-xl border border-white/5 bg-white/5 p-4 text-left transition-colors hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white group-hover:text-blue-200">
                        {template.name}
                      </span>
                      {template.is_premium && (
                        <LockKeyhole className="h-3 w-3 text-amber-400" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-white/50">
                      {template.description}
                    </p>
                  </motion.button>
                ))}

                {templates.length === 0 && (
                  <div className="py-8 text-center text-xs text-white/40">
                    No templates available.
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto pt-4">
            <div className="flex flex-col gap-4 pb-4">
              {!user ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <p className="text-sm text-white/60">Sign in to view your history</p>
                  <Button variant="outline" size="sm" onClick={onRequireAuth} className="border-white/10 text-white">
                    Sign In
                  </Button>
                </div>
              ) : loadingHistory ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : savedConversations.length === 0 && savedProjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40">
                  No history found.
                </div>
              ) : (
                <>
                  {savedConversations.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1 text-xs font-medium text-white/40">
                        <Clock className="h-3 w-3" />
                        <span>Recent Chats</span>
                      </div>
                      {savedConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="group flex items-center gap-2 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                        >
                          <button
                            className="flex-1 text-left"
                            onClick={() => onLoadConversation(conversation.id)}
                          >
                            <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                              {conversation.title}
                            </p>
                            <p className="text-[10px] text-white/40">
                              {new Date(conversation.updated_at).toLocaleDateString()}
                            </p>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation.id);
                            }}
                            className="hidden rounded p-1 text-white/40 hover:bg-white/10 hover:text-red-400 group-hover:block"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {savedProjects.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1 text-xs font-medium text-white/40">
                        <FolderOpen className="h-3 w-3" />
                        <span>Saved Projects</span>
                      </div>
                      {savedProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between rounded-xl bg-white/5 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-white/90">{project.title}</p>
                            <p className="text-[10px] text-white/40">
                              {new Date(project.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-white/10 text-[10px] text-white/60">
                            {project.description ? "v1" : "Draft"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {user && (
        <div className="mt-auto border-t border-white/10 p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/50 hover:bg-white/5 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      )}
    </aside>
  );
});

export default Sidebar;
