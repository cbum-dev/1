"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Save, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StudioChatProps } from "./types";
import { cn } from "@/lib/utils";

const ChatPanel = memo(function ChatPanel({
  user,
  messages,
  messagesEndRef,
  messageDraft,
  onMessageDraftChange,
  onSendMessage,
  sendingMessage,
  currentAnimation,
  onSaveConversation,
  savingConversation,
  className,
}: StudioChatProps) {
  const canSend = Boolean(messageDraft.trim()) && !sendingMessage && Boolean(user);
  const canSave = Boolean(currentAnimation) && messages.length > 0 && Boolean(user);

  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 text-center text-white/60"
              >
                <div className="rounded-full bg-white/5 p-4 ring-1 ring-white/10">
                  <Sparkles className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Start a new creation</p>
                  <p className="text-xs text-white/50">Describe the movement you want to see.</p>
                </div>
              </motion.div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={`${msg.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${isUser ? "border-white/10 bg-white/10" : "border-indigo-500/20 bg-indigo-500/10"}`}>
                      {isUser ? <User className="h-4 w-4 text-white/70" /> : <Sparkles className="h-4 w-4 text-indigo-300" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser
                          ? "bg-white text-black"
                          : "bg-white/5 text-white ring-1 ring-white/10"
                        }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed prose-p:my-1 prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      <span className={`mt-1 block text-[10px] opacity-40 ${isUser ? "text-black" : "text-white"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/5 bg-black/20 p-3">
        {canSave && !savingConversation && (
          <div className="mb-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveConversation}
              className="h-6 px-2 text-[10px] uppercase tracking-wider text-white/30 hover:bg-white/5 hover:text-white"
            >
              <Save className="mr-1 h-3 w-3" />
              Save Session
            </Button>
          </div>
        )}
        <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 pr-2 ring-1 ring-transparent focus-within:ring-white/10 focus-within:bg-black/40 transition-all">
          <Textarea
            rows={1}
            placeholder={user ? "Describe the motion..." : "Sign in to chat"}
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSendMessage();
              }
            }}
            disabled={sendingMessage || !user}
            className="min-h-[44px] flex-1 resize-none border-0 bg-transparent py-3 text-white placeholder:text-white/30 focus-visible:ring-0"
            style={{ maxHeight: '120px' }}
          />
          <Button
            size="icon"
            onClick={onSendMessage}
            disabled={!canSend}
            className="mb-1 h-8 w-8 rounded-xl bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20"
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
});

export default ChatPanel;
