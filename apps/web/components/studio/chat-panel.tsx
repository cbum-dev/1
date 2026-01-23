"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Save } from "lucide-react";
import { StudioChatProps } from "./types";

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
}: StudioChatProps) {
  const canSend = Boolean(messageDraft.trim()) && !sendingMessage && Boolean(user);
  const canSave = Boolean(currentAnimation) && messages.length > 0 && Boolean(user);

  return (
    <section className="flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(8,8,12,0.45)]">
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full overflow-y-auto px-6 py-6">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/60"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-white/30">No messages yet</p>
                <p className="text-lg font-medium text-white/70">
                  {user ? 'Describe your animation to begin.' : 'Sign in to start crafting motion.'}
                </p>
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
                    className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-6 shadow-lg backdrop-blur ${
                        isUser
                          ? "bg-gradient-to-br from-white to-white/80 text-black"
                          : "bg-white/8 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-white/40">
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

      <div className="border-t border-white/10 bg-black/40 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.3em] text-white/30">Chat composer</div>
          <Button
            size="sm"
            variant="outline"
            disabled={!canSave || savingConversation}
            onClick={onSaveConversation}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            {savingConversation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Session
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <Textarea
            rows={3}
            placeholder={user ? "Describe the motion or ask for changes..." : "Sign in to create animations"}
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSendMessage();
              }
            }}
            disabled={sendingMessage || !user}
            className="flex-1 resize-none border-white/15 bg-black/40 text-white placeholder:text-white/30"
          />
          <Button
            size="lg"
            onClick={onSendMessage}
            disabled={!canSend}
            className="md:h-auto md:min-h-[3.25rem] md:min-w-[3.25rem] md:self-end"
          >
            {sendingMessage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
});

export default ChatPanel;
