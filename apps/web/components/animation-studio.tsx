'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
} from '@/lib/api';
import { AnimationState, StudioUser } from './studio/types';
import { Sparkles } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type StudioTab = 'preview' | 'json' | 'code' | 'video';

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
    <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-10 py-12 text-center text-white/70">
      <div className="flex size-16 items-center justify-center rounded-full border border-white/15 bg-white/10">
        <Sparkles className="h-8 w-8 text-white/70" />
      </div>
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-white/30">Workspace idle</p>
        <h2 className="text-2xl font-semibold text-white">Craft your first motion sequence</h2>
        <p className="text-sm text-white/60">
          Start chatting with the assistant or jump into a curated template to generate your first scene.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          className="border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={onExploreTemplates}
        >
          Browse templates
        </Button>
        {!isAuthenticated && (
          <Button className="bg-white text-black hover:bg-white/90" onClick={onRequireAuth}>
            Sign in to create
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
  const [sidebarView, setSidebarView] = useState<'templates' | 'history'>('templates');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingConversation, setSavingConversation] = useState(false);
  const [polling, setPolling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleAuthSuccess = (token: string, userData: any) => {
    setUser(userData as StudioUser);
    setShowAuth(false);
    loadUserLimits(token);
    loadUserHistory(token);
    loadTemplates(token);
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
        handleLogout();
        setShowAuth(true);
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
      const result = await saveProject(
        title,
        currentAnimation.description,
        currentAnimation.json_ir,
        messages,
        token
      );

      setCurrentConversationId(result.id);
      await loadUserHistory(token);
      setSidebarView('history');
      window.alert('Conversation saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      window.alert('Failed to save conversation');
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
      window.alert('Failed to load conversation');
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
      window.alert('Failed to delete conversation');
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
      const job = await queueRenderJob(
        currentAnimation.json_ir,
        {
          output_format: 'mp4',
          quality: 'medium',
        },
        token
      );

      setRenderJob(job);
      setPolling(true);
      setActiveTab('video');
      pollJobStatus(job.job_id, token);
    } catch (error) {
      console.error('Render error:', error);
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

  return (
    <StudioShell ambient={<AmbientBackdrop />} overlay={<OverlayGrid />}>
      {showAuth && <AuthDialog onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}
      <WorkspaceAccessDialog
        open={showAccessDialog}
        onOpenChange={setShowAccessDialog}
        user={user}
        limits={userLimits}
        onRequireAuth={handleRequireAuth}
        onLogout={handleLogout}
      />

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[320px,1fr] lg:items-start">
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
        />

        <div className="flex flex-1 flex-col gap-6">
          <Header
            currentAnimation={currentAnimation}
            conversationSaved={conversationSaved}
            onReset={handleReset}
            onRender={handleRender}
            canRender={canRender}
            rendering={polling}
            user={user}
            onNewChat={handleReset}
            onViewAccess={handleViewAccess}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <ChatPanel
              user={user}
              messages={messages}
              messagesEndRef={messagesEndRef}
              messageDraft={messageDraft}
              onMessageDraftChange={setMessageDraft}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
              currentAnimation={currentAnimation}
              onSaveConversation={handleSaveConversation}
              savingConversation={savingConversation}
            />

            {currentAnimation ? (
              <Workspace
                activeTab={activeTab}
                onTabChange={handleTabChange}
                currentAnimation={currentAnimation}
                renderJob={renderJob}
                videoUrl={videoUrl}
                onDownload={handleDownload}
                onCopyJson={handleCopyJson}
                onCopyCode={handleCopyCode}
                copiedJson={copiedJson}
                copiedCode={copiedCode}
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
      </div>
    </StudioShell>
  );
}
