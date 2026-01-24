'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useToast } from './ui/use-toast';
import AuthDialog from './auth-dialog';
import StudioShell from './studio/studio-shell';
import Sidebar from './studio/sidebar';
import Header from './studio/header';
import ChatPanel from './studio/chat-panel';
import Workspace from './studio/workspace';
import WorkspaceAccessDialog from './studio/workspace-access-dialog';
import { Button } from './ui/button';
import {
  sendChatMessage,
  queueRenderJob,
  getRenderStatus,
  listTemplates,
  applyTemplate,
  getToken,
  getUser,
  removeToken,
  removeUser,
  getUserLimits,
  Template,
  RenderJob,
  saveProject,
  getUserProjects,
  getUserConversations,
  loadConversation,
  deleteConversation,
  SavedConversation,
  SavedProject,
  ChatMessage,
  updateProject,
} from '@/lib/api';
import { AnimationState, StudioUser, AudioConfig } from './studio/types';
import { Sparkles, ArrowRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://one-y13j.onrender.com/';

type StudioTab = 'preview' | 'json' | 'code' | 'video' | 'audio';

function AmbientBackdrop() {
  return (
    <>
      <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#4b3fba]/25 blur-3xl md:h-96 md:w-96" />
      <div className="absolute right-[-20%] top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#ff5f87]/15 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_55%)]" />
    </>
  );
}

function OverlayGrid() {
  return (
    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />
  );
}

function EmptyWorkspace({
  isAuthenticated,
  onExploreTemplates,
  onRequireAuth,
}: {
  isAuthenticated: boolean;
  onExploreTemplates: () => void;
  onRequireAuth: () => void;
}) {
  return (
    <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-10 py-12 text-center text-white/70">
      <div className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-2xl shadow-indigo-500/10">
        <Sparkles className="h-8 w-8 text-indigo-300" />
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Workspace idle</p>
        <h2 className="text-2xl font-semibold text-white">Ready when you are</h2>
        <p className="text-sm text-white/50 max-w-sm">
          Send a message to start animating from scratch, or pick a template to get a head start.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 px-6"
          onClick={onExploreTemplates}
        >
          Browse templates
        </Button>
        {!isAuthenticated && (
          <Button className="h-10 bg-white text-black hover:bg-white/90 px-6" onClick={onRequireAuth}>
            Sign in to save work
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AnimationStudio() {
  const [user, setUser] = useState<StudioUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userLimits, setUserLimits] = useState<Record<string, unknown> | null>(null);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('preview');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sidebarView, setSidebarView] = useState<'templates' | 'history' | 'chat'>('templates');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingConversation, setSavingConversation] = useState(false);
  const [polling, setPolling] = useState(false);
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    enabled: false,
    text: "",
    voice: "en",
  });

  const [currentStyle, setCurrentStyle] = useState("default");

  const [codeModified, setCodeModified] = useState(false);

  // Resizable layout state
  const [topSectionHeight, setTopSectionHeight] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleAnimationChange = (newState: AnimationState) => {
    if (currentAnimation) {
      // Check if code was modified (CodePanel edits)
      if (newState.manim_code !== currentAnimation.manim_code) {
        setCodeModified(true);
      }
      // Check if IR was modified (DesignPanel edits). Reset code modification flag because IR is now the source of truth again
      // (Visual edits invalidate custom code)
      if (newState.json_ir !== currentAnimation.json_ir) {
        setCodeModified(false);
      }
    }
    setCurrentAnimation(newState);
  };

  // Resize Handlers
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection
  }, []);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top;
    const newHeightPercentage = (relativeY / containerRect.height) * 100;
    // Clamp between 20% and 80%
    setTopSectionHeight(Math.max(20, Math.min(80, newHeightPercentage)));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleDragMove]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();
  const toast = useToast();

  const handleDownloadCode = () => {
    if (!currentAnimation?.manim_code) return;

    const blob = new Blob([currentAnimation.manim_code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "scene.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url); // ✅ cleanup
  };
  const clearVideoUrl = useCallback(() => {
    setVideoUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const loadUserLimits = useCallback(async (token: string) => {
    try {
      const limits = await getUserLimits(token);
      setUserLimits(limits);
    } catch (error) {
      console.error('Failed to load limits:', error);
    }
  }, []);

  const loadTemplates = useCallback(async (token?: string) => {
    try {
      const tmpl = await listTemplates(token);
      setTemplates(tmpl);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  const loadUserHistory = useCallback(
    async (token: string) => {
      setLoadingHistory(true);
      try {
        const [conversations, projects] = await Promise.all([
          getUserConversations(token),
          getUserProjects(token),
        ]);
        setSavedConversations(conversations);
        setSavedProjects(projects);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  const pollJobStatus = useCallback((jobId: string, token: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const interval = setInterval(async () => {
      try {
        const job = await getRenderStatus(jobId, token);
        setRenderJob(job);

        if (job.status === 'completed' || job.status === 'failed') {
          setPolling(false);
          clearInterval(interval);
          pollIntervalRef.current = null;
        }
      } catch (error) {
        console.error('Poll error:', error);
        setPolling(false);
        clearInterval(interval);
        pollIntervalRef.current = null;
      }
    }, 2000);

    pollIntervalRef.current = interval;
  }, []);

  const handleLogout = useCallback(() => {
    removeToken();
    removeUser();
    setUser(null);
    setShowAccessDialog(false);
    setMessages([]);
    setMessageDraft('');
    setCurrentAnimation(null);
    setRenderJob(null);
    setSavedConversations([]);
    setSavedProjects([]);
    setCurrentConversationId(null);
    setSidebarView('templates');
    setActiveTab('preview');
    clearVideoUrl();
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [clearVideoUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();

    if (token && savedUser) {
      setUser(savedUser as StudioUser);
      loadUserLimits(token);
      loadUserHistory(token);
      loadTemplates(token);
    } else {
      setShowAuth(true); // Force auth dialog
      loadTemplates();
    }
  }, [loadTemplates, loadUserHistory, loadUserLimits]);

  useEffect(() => {
    if (!renderJob) {
      clearVideoUrl();
      return;
    }

    if (renderJob.status === 'pending' || renderJob.status === 'processing' || renderJob.status === 'failed') {
      clearVideoUrl();
    }

    if (renderJob.status !== 'completed' || !renderJob.video_url) {
      return;
    }

    const token = getToken();
    if (!token) return;

    const fetchVideo = async () => {
      try {
        const downloadUrl = `${API_BASE_URL}${renderJob.video_url}`;
        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          return;
        }

        const blob = await response.blob();
        setVideoUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return URL.createObjectURL(blob);
        });
      } catch (error) {
        console.error('Failed to fetch video:', error);
      }
    };

    fetchVideo();
  }, [renderJob, clearVideoUrl]);

  useEffect(
    () => () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      clearVideoUrl();
    },
    [clearVideoUrl]
  );

  const handleAuthSuccess = (userData: any) => {
    const token = getToken();
    setUser(userData as StudioUser);
    setShowAuth(false);

    if (token) {
      loadUserLimits(token);
      loadUserHistory(token);
      loadTemplates(token);
    }
    setSidebarView('history');
  };

  const handleSendMessage = async () => {
    if (!messageDraft.trim() || sendingMessage) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    const token = getToken();
    if (!token) {
      setShowAuth(true);
      return;
    }

    const userMessage = messageDraft.trim();
    setMessageDraft('');
    setSendingMessage(true);

    try {
      const response = await sendChatMessage(userMessage, messages, currentAnimation?.json_ir, token);
      setMessages(response.conversation_history);

      if (response.animation_ir) {
        setCurrentAnimation({
          json_ir: response.animation_ir,
          manim_code: response.manim_code,
          description: response.description,
          validation: response.validation,
        });
        setActiveTab('preview');
      }

      if (typeof response.credits_remaining === 'number') {
        setUser((prev) => (prev ? { ...prev, credits_remaining: response.credits_remaining } : prev));
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const message = error?.message?.toString().toLowerCase() ?? '';

      if (message.includes('401') || message.includes('authentication')) {
        toast.error("Session expired", "Please sign in again to continue.");
        handleLogout();
        setShowAuth(true);
      } else if (message.includes('credit') || message.includes('quota') || message.includes('402')) {
        toast.error("Out of credits", "You need more credits to generate this animation.");
      } else {
        toast.error("Message failed", "Unable to process your request. Please try again.");
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveConversation = async () => {
    if (!currentAnimation || messages.length === 0) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    const token = getToken();
    if (!token) return;

    setSavingConversation(true);
    try {
      const title = messages[0]?.content.slice(0, 50) || 'Untitled Animation';

      let result;
      if (currentConversationId) {
        result = await updateProject(
          currentConversationId,
          title,
          currentAnimation.description || '',
          currentAnimation.json_ir,
          messages,
          token
        );
      } else {
        result = await saveProject(
          title,
          currentAnimation.description || '',
          currentAnimation.json_ir,
          messages,
          token
        );
      }

      setCurrentConversationId(result.id);
      await loadUserHistory(token);
      setSidebarView('history');
      if (!currentConversationId) {
        toast.success("Conversation saved", "Your progress has been saved successfully.");
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Save failed", "Could not save your conversation. Please try again.");
    } finally {
      setSavingConversation(false);
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    const token = getToken();
    if (!token) return;

    setSendingMessage(true);
    try {
      const data = await loadConversation(conversationId, token);
      setMessages(data.messages);
      setCurrentAnimation({
        json_ir: data.animation_ir,
        manim_code: data.manim_code || '',
        description: data.description || '',
        validation: { valid: true, errors: [] },
      });
      setCurrentConversationId(conversationId);
      setActiveTab('preview');
      setSidebarView('history');
    } catch (error) {
      console.error('Load error:', error);
      toast.error("Load failed", "Could not load the conversation. It may be deleted or inaccessible.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Delete this conversation permanently?')) return;

    const token = getToken();
    if (!token) return;

    try {
      await deleteConversation(conversationId, token);
      await loadUserHistory(token);

      if (currentConversationId === conversationId) {
        handleReset();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Delete failed", "Could not delete the conversation.");
    }
  };

  const handleApplyTemplate = async (template: Template) => {
    const token = getToken();
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      const response = await applyTemplate(template.id, {}, token);
      setCurrentAnimation({
        json_ir: response.animation_ir,
        manim_code: response.manim_code,
        description: response.description,
        validation: { valid: true, errors: [] },
      });
      setActiveTab('preview');
    } catch (error) {
      console.error('Template apply error:', error);
    }
  };

  const handleRender = async () => {
    if (!currentAnimation?.json_ir) return;

    const token = getToken();
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      // Inject audio config
      const irPayload = { ...currentAnimation.json_ir };
      if (audioConfig.enabled) {
        irPayload.audio = audioConfig;
      }
      irPayload.style = currentStyle;

      const job = await queueRenderJob(
        irPayload,
        {
          output_format: 'mp4',
          quality: 'medium',
          manim_code: codeModified ? currentAnimation.manim_code : undefined,
        },
        token
      );

      setRenderJob(job);
      setVideoUrl(null);
      setPolling(true);
      pollJobStatus(job.job_id, token);
    } catch (error: any) {
      console.error('Render error:', error);
      const msg = error?.message?.toLowerCase() ?? '';
      if (msg.includes('credit') || msg.includes('402')) {
        toast.error("Out of credits", "You need more credits to render this video.");
      } else {
        toast.error("Render failed", "Could not start the rendering job. Please try again.");
      }
    }
  };

  const handleDownload = async () => {
    if (!renderJob?.video_url) return;

    const token = getToken();
    if (!token) return;

    try {
      const downloadUrl = `${API_BASE_URL}${renderJob.video_url}`;
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `animation-${Date.now()}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleReset = () => {
    if (messages.length === 0 && !currentAnimation) return;
    if (!window.confirm('Start a new animation? This will clear the current conversation.')) return;

    setMessages([]);
    setMessageDraft('');
    setCurrentAnimation(null);
    setRenderJob(null);
    setCurrentConversationId(null);
    setActiveTab('preview');
    clearVideoUrl();
  };

  const copyToClipboard = async (payload: string, type: 'json' | 'code') => {
    if (!payload) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (type === 'json') {
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleCopyJson = () => {
    if (!currentAnimation) return;
    copyToClipboard(JSON.stringify(currentAnimation.json_ir, null, 2), 'json');
  };

  const handleCopyCode = () => {
    if (!currentAnimation) return;
    copyToClipboard(currentAnimation.manim_code, 'code');
  };

  const handleRequireAuth = () => {
    setShowAccessDialog(false);
    setShowAuth(true);
  };

  const handleViewAccess = () => {
    if (user) {
      setShowAccessDialog(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as StudioTab);
  };

  const canRender = Boolean(currentAnimation && currentAnimation.validation.valid && !polling);
  const conversationSaved = Boolean(currentConversationId);
  const hasActiveConversation = messages.length > 0 || Boolean(currentAnimation);
  // Video panel is only visible when we have a video URL or a render job is in progress
  const showVideoPanel = Boolean(videoUrl || polling);

  return (
    <StudioShell className="h-screen" ambient={<AmbientBackdrop />} overlay={<OverlayGrid />}>
      <WorkspaceAccessDialog
        open={showAccessDialog}
        onOpenChange={setShowAccessDialog}
        user={user}
        limits={userLimits}
        onRequireAuth={handleRequireAuth}
        onLogout={handleLogout}
      />

      <div className="flex h-full flex-col gap-4 overflow-hidden p-2 lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-4 lg:p-4">
        <Sidebar
          user={user}
          onRequireAuth={handleRequireAuth}
          onLogout={handleLogout}
          sidebarView={sidebarView}
          onSidebarViewChange={setSidebarView}
          loadingHistory={loadingHistory}
          savedConversations={savedConversations}
          savedProjects={savedProjects}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={handleDeleteConversation}
          templates={templates}
          onApplyTemplate={handleApplyTemplate}
          hasActiveConversation={hasActiveConversation}
          onNewConversation={handleReset}
          onViewAccess={handleViewAccess}
          chatProps={{
            user,
            messages,
            messagesEndRef,
            messageDraft,
            onMessageDraftChange: setMessageDraft,
            onSendMessage: handleSendMessage,
            sendingMessage,
            currentAnimation,
            onSaveConversation: handleSaveConversation,
            savingConversation,
          }}
          className="lg:h-full"
        />

        <div className="flex h-full flex-col gap-4 overflow-hidden">
          <Header
            currentAnimation={currentAnimation}
            conversationSaved={conversationSaved}
            onReset={handleReset}
            onRender={handleRender}
            canRender={canRender}
            rendering={polling}
            user={user}
            onNewChat={handleReset}
            onViewAccess={() => setShowAccessDialog(true)}
            currentStyle={currentStyle}
            onStyleChange={setCurrentStyle}
          />

          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl">
            {/* Main Content Split: Top (Workspace) / Bottom (Video) */}
            <div className="flex h-full flex-col relative" ref={containerRef}>
              {/* Top: Preview/Code/JSON */}
              <div
                className="flex w-full overflow-hidden"
                style={{ height: showVideoPanel ? `${topSectionHeight}%` : '100%' }}
              >
                <div className="h-full w-full overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                  {currentAnimation ? (
                    <Workspace
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                      currentAnimation={currentAnimation}
                      renderJob={renderJob}
                      videoUrl={null} // Video is now separate
                      onDownload={handleDownload} // Disabled in workspace, moved to panel
                      onDownloadCode={handleDownloadCode}
                      onCopyJson={handleCopyJson}
                      onCopyCode={handleCopyCode}
                      copiedJson={copiedJson}
                      copiedCode={copiedCode}
                      audioConfig={audioConfig}
                      onAudioConfigChange={setAudioConfig}
                      onAnimationChange={handleAnimationChange}
                    />
                  ) : (
                    <EmptyWorkspace
                      isAuthenticated={Boolean(user)}
                      onExploreTemplates={() => setSidebarView('templates')}
                      onRequireAuth={() => setShowAuth(true)}
                    />
                  )}
                </div>
              </div>

              {/* Resizer Handle */}
              {showVideoPanel && (
                <div
                  className="relative float-left z-10 flex h-3 w-full cursor-row-resize items-center justify-center border-y border-white/5 bg-[#0b0c15] hover:bg-indigo-500/10 transition-colors group select-none"
                  onMouseDown={handleDragStart}
                >
                  <div className="h-1 w-12 rounded-full bg-white/10 group-hover:bg-indigo-400/50 transition-colors" />
                </div>
              )}

              {/* Bottom: Video Result Panel */}
              {showVideoPanel && (
                <div
                  className="flex w-full flex-col bg-black/40"
                  style={{ height: `calc(${100 - topSectionHeight}% - 12px)` }} // Adjust for handle height
                >
                  <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-white/70">Render Result</h3>
                    <Button variant="ghost" size="sm" onClick={() => setVideoUrl(null)} className="h-6 w-6 p-0 text-white/50 hover:text-white">
                      <span className="sr-only">Close</span>
                      &times;
                    </Button>
                  </div>
                  <div className="relative flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {videoUrl ? (
                      <div className="flex min-h-full flex-col items-center justify-center gap-6">
                        <div className="relative w-full max-w-4xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
                          <video
                            src={videoUrl}
                            controls
                            className="w-full bg-black/50"
                            autoPlay
                            loop
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button size="sm" onClick={handleDownload} className="bg-white text-black hover:bg-white/90">
                            Download MP4
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/50">
                        <p>Loading video...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}
