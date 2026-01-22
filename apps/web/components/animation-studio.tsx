'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AuthDialog from './auth-dialog';
import {
  sendChatMessage, queueRenderJob, getRenderStatus, listTemplates,
  applyTemplate, getToken, getUser, removeToken, removeUser,
  getUserLimits, Template, RenderJob, saveProject, getUserProjects,
  getUserConversations, loadConversation, deleteConversation
} from '@/lib/api';

import {
  Loader2, Send, Sparkles, Copy, CheckCircle, Play, RotateCcw,
  Download, LogOut, User as UserIcon, Crown, Zap, Music, Mic,
  Save, History, Trash2, FolderOpen, MessageSquare
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  animation_state?: any;
}

interface AnimationState {
  json_ir: any;
  manim_code: string;
  description: string;
  validation: { valid: boolean; errors: string[] };
}

interface SavedConversation {
  id: string;
  title: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface SavedProject {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function AnimationStudio() {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userLimits, setUserLimits] = useState<any>(null);

  // Chat state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // History state
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Render state
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [polling, setPolling] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Audio state
  const [includeVoiceover, setIncludeVoiceover] = useState(false);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [includeMusic, setIncludeMusic] = useState(false);
  const [musicMood, setMusicMood] = useState<string>('corporate');

  // UI state
  const [activeTab, setActiveTab] = useState('chat');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser) {
      setUser(savedUser);
      loadUserLimits(token);
      loadTemplates(token);
      loadUserHistory(token);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch and convert video to blob URL when job completes
  useEffect(() => {
    const fetchVideo = async () => {
      if (!renderJob?.video_url || renderJob.status !== 'completed') return;
      
      const token = getToken();
      if (!token) return;
      
      try {
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${renderJob.video_url}`;
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        }
      } catch (error) {
        console.error('Failed to fetch video:', error);
      }
    };
    
    fetchVideo();
    
    // Cleanup blob URL on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [renderJob?.video_url, renderJob?.status]);

  const loadUserLimits = async (token: string) => {
    try {
      const limits = await getUserLimits(token);
      setUserLimits(limits);
    } catch (error) {
      console.error('Failed to load limits:', error);
    }
  };

  const loadTemplates = async (token?: string) => {
    try {
      const tmpl = await listTemplates(token);
      setTemplates(tmpl);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadUserHistory = async (token: string) => {
    setLoadingHistory(true);
    try {
      const [conversations, projects] = await Promise.all([
        getUserConversations(token),
        getUserProjects(token)
      ]);
      setSavedConversations(conversations);
      setSavedProjects(projects);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAuthSuccess = (token: string, userData: any) => {
    setUser(userData);
    setShowAuth(false);
    loadUserLimits(token);
    loadTemplates(token);
    loadUserHistory(token);
  };

  const handleLogout = () => {
    removeToken();
    removeUser();
    setUser(null);
    setMessages([]);
    setCurrentAnimation(null);
    setRenderJob(null);
    setSavedConversations([]);
    setSavedProjects([]);
    setCurrentConversationId(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || loading || !user) return;

    const token = getToken();
    if (!token) {
      setShowAuth(true);
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        userMessage,
        messages,
        currentAnimation?.json_ir,
        token
      );

      setMessages(response.conversation_history);
      
      if (response.animation_ir) {
        setCurrentAnimation({
          json_ir: response.animation_ir,
          manim_code: response.manim_code,
          description: response.description,
          validation: response.validation
        });
      }

      // Update user credits
      if (response.credits_remaining !== undefined) {
        setUser({ ...user, credits_remaining: response.credits_remaining });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      if (error.message.includes('401') || error.message.includes('authentication')) {
        handleLogout();
        setShowAuth(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (!currentAnimation || messages.length === 0 || !user) return;

    const token = getToken();
    if (!token) return;

    setSavingProject(true);
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
      
      // Reload history
      await loadUserHistory(token);
      
      alert('Conversation saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save conversation');
    } finally {
      setSavingProject(false);
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const data = await loadConversation(conversationId, token);
      
      setMessages(data.messages);
      setCurrentAnimation({
        json_ir: data.animation_ir,
        manim_code: data.manim_code || '',
        description: data.description || '',
        validation: { valid: true, errors: [] }
      });
      setCurrentConversationId(conversationId);
      setShowHistory(false);
      setActiveTab('chat');
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

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
      alert('Failed to delete conversation');
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
        validation: { valid: true, errors: [] }
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
          include_voiceover: includeVoiceover,
          voiceover_text: voiceoverText || undefined,
          include_music: includeMusic,
          music_mood: musicMood,
        },
        token
      );

      setRenderJob(job);
      setPolling(true);
      setActiveTab('video');
      
      // Start polling for job status
      pollJobStatus(job.job_id, token);
    } catch (error) {
      console.error('Render error:', error);
    }
  };

  const pollJobStatus = async (jobId: string, token: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await getRenderStatus(jobId, token);
        setRenderJob(job);

        if (job.status === 'completed' || job.status === 'failed') {
          setPolling(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Poll error:', error);
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDownload = () => {
    if (!renderJob?.video_url) return;
    
    const token = getToken();
    if (!token) return;
    
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${renderJob.video_url}`;
    
    fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `animation-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(error => console.error('Download failed:', error));
  };

  const handleReset = () => {
    if (confirm('Start a new animation? This will clear the current conversation.')) {
      setMessages([]);
      setCurrentAnimation(null);
      setRenderJob(null);
      setVideoUrl(null);
      setCurrentConversationId(null);
      setActiveTab('chat');
    }
  };

  const copyToClipboard = (text: string, type: 'json' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      free: { icon: <Sparkles className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700', label: 'Free' },
      pro: { icon: <Zap className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700', label: 'Pro' },
      enterprise: { icon: <Crown className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700', label: 'Enterprise' },
    };
    const badge = badges[tier as keyof typeof badges] || badges.free;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {showAuth && <AuthDialog onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* User Header */}
          <div className="p-4 border-b border-gray-200">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  {getTierBadge(user.tier)}
                  <span className="text-gray-600">
                    {user.credits_remaining} credits
                  </span>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAuth(true)} className="w-full">
                Sign In / Sign Up
              </Button>
            )}
          </div>

          {/* History Toggle */}
          {user && (
            <div className="p-4 border-b border-gray-200">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                {showHistory ? 'Hide History' : 'Show History'}
              </Button>
            </div>
          )}

          {/* History Panel */}
          {showHistory && user ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Recent Conversations ({savedConversations.length})
                </h3>
                {loadingHistory ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : savedConversations.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved conversations yet</p>
                ) : (
                  <div className="space-y-2">
                    {savedConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                          currentConversationId === conv.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1"
                            onClick={() => handleLoadConversation(conv.id)}
                          >
                            <div className="font-medium text-sm">{conv.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {conv.message_count} messages • {new Date(conv.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Templates Section */}
              {user && templates.length > 0 && (
                <div className="p-4 border-b border-gray-200 max-h-64 overflow-y-auto">
                  <h3 className="text-sm font-semibold mb-2">Quick Start Templates</h3>
                  <div className="space-y-2">
                    {templates.slice(0, 4).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        className="w-full text-left p-2 hover:bg-gray-50 rounded border border-gray-200 text-sm"
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {user ? 'Start creating your animation!' : 'Sign in to start creating'}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2 mb-2">
                  {currentAnimation && messages.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveConversation}
                      disabled={savingProject}
                    >
                      {savingProject ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder={user ? "Describe your animation..." : "Sign in to create animations"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={3}
                    disabled={loading || !user}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || loading || !user}
                    size="sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Animation Studio</h1>
              {currentAnimation && (
                <p className="text-sm text-gray-600">
                  {currentAnimation.validation.valid ? '✅ Ready to render' : '❌ Invalid animation'}
                  {currentConversationId && ' • Saved'}
                </p>
              )}
            </div>
            {currentAnimation && (
              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleRender}
                  disabled={!currentAnimation.validation.valid || polling}
                >
                  {polling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            )}
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {!currentAnimation ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Sparkles className="w-16 h-16 mx-auto text-blue-600" />
                  <h3 className="text-xl font-semibold">No animation yet</h3>
                  <p className="text-gray-600">
                    {user ? 'Start by describing an animation or choosing a template' : 'Sign in to get started'}
                  </p>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="audio">Audio Options</TabsTrigger>
                  <TabsTrigger value="json">JSON IR</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="video" disabled={!renderJob}>Video</TabsTrigger>
                </TabsList>

                <TabsContent value="chat">
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Continue chatting in the sidebar to refine your animation.
                        Your messages are automatically saved when you click the Save button.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Animation Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-blue-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                        {currentAnimation.description}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audio">
                  <Card>
                    <CardHeader>
                      <CardTitle>Audio Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="voiceover"
                          checked={includeVoiceover}
                          onChange={(e) => setIncludeVoiceover(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="voiceover" className="flex items-center gap-2 text-sm font-medium">
                          <Mic className="w-4 h-4" />
                          Add AI Voiceover
                        </label>
                      </div>

                      {includeVoiceover && (
                        <Textarea
                          placeholder="Enter custom voiceover script (or leave empty for auto-generated)"
                          value={voiceoverText}
                          onChange={(e) => setVoiceoverText(e.target.value)}
                          rows={4}
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="music"
                          checked={includeMusic}
                          onChange={(e) => setIncludeMusic(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="music" className="flex items-center gap-2 text-sm font-medium">
                          <Music className="w-4 h-4" />
                          Add Background Music
                        </label>
                      </div>

                      {includeMusic && (
                        <select
                          value={musicMood}
                          onChange={(e) => setMusicMood(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="upbeat">Upbeat</option>
                          <option value="calm">Calm</option>
                          <option value="dramatic">Dramatic</option>
                          <option value="corporate">Corporate</option>
                        </select>
                      )}

                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                        ℹ️ <strong>Audio features are in beta:</strong>
                        <ul className="mt-2 ml-4 list-disc text-xs">
                          <li>TTS (text-to-speech) uses placeholder audio currently</li>
                          <li>Background music requires stock music files to be configured</li>
                          <li>Video will render without audio if these features aren't set up</li>
                          <li>Audio processing is optional and won't fail the render</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="json">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>JSON IR</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(JSON.stringify(currentAnimation.json_ir, null, 2), 'json')}
                        >
                          {copiedJson ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[600px] overflow-y-auto">
                        {JSON.stringify(currentAnimation.json_ir, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="code">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Manim Code</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(currentAnimation.manim_code, 'code')}
                        >
                          {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[600px] overflow-y-auto font-mono">
                        {currentAnimation.manim_code}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="video">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rendered Video</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {renderJob?.status === 'completed' && videoUrl ? (
                        <>
                          <video
                            src={videoUrl}
                            controls
                            className="w-full rounded-lg shadow-lg"
                            autoPlay
                          />
                          <Button onClick={handleDownload} variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download Video
                          </Button>
                        </>
                      ) : renderJob?.status === 'failed' ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-red-700">Render failed: {renderJob.error_message}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                          <p className="mt-4 text-gray-600">
                            {renderJob?.status === 'processing' ? 'Rendering your animation...' : 'Queued...'}
                          </p>
                          {renderJob?.estimated_duration && (
                            <p className="text-sm text-gray-500 mt-2">
                              Estimated time: ~{Math.ceil(renderJob.estimated_duration)}s
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}