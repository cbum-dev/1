import { type RefObject } from "react";
import type {
  Template,
  RenderJob,
  SavedConversation,
  SavedProject,
  ChatMessage,
} from "@/lib/api";

export interface AnimationState {
  json_ir: any;
  manim_code: string;
  description: string;
  validation: { valid: boolean; errors: string[] };
}

export interface AudioConfig {
  enabled: boolean;
  text: string;
  voice: string;
  audio_url?: string;
}

export interface StudioUser {
  id: string;
  email: string;
  username: string;
  tier: string;
  credits_remaining: number;
  credits_used?: number;
}

export interface StudioSidebarProps {
  user: StudioUser | null;
  onRequireAuth: () => void;
  onLogout: () => void;
  sidebarView: 'templates' | 'history' | 'chat';
  onSidebarViewChange: (view: 'templates' | 'history' | 'chat') => void;
  loadingHistory: boolean;
  savedConversations: SavedConversation[];
  savedProjects: SavedProject[];
  onLoadConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  templates: Template[];
  onApplyTemplate: (template: Template) => void;
  hasActiveConversation: boolean;
  onNewConversation: () => void;
  onViewAccess: () => void;
  chatProps: StudioChatProps;
  className?: string;
}

export interface StudioWorkspaceProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentAnimation: AnimationState | null;
  renderJob: RenderJob | null;
  videoUrl: string | null;
  onDownload: () => void;
  onDownloadCode: () => void;
  onCopyJson: () => void;
  onAnimationChange: (newAnimationState: AnimationState) => void;
  onCopyCode: () => void;
  copiedJson: boolean;
  copiedCode: boolean;
  audioConfig: AudioConfig;
  onAudioConfigChange: (config: AudioConfig) => void;
}

export interface StudioHeaderProps {
  currentAnimation: AnimationState | null;
  conversationSaved: boolean;
  onReset: () => void;
  onRender: () => void;
  canRender: boolean;
  rendering: boolean;
  user: StudioUser | null;
  onNewChat: () => void;
  onViewAccess: () => void;
  currentStyle?: string;
  onStyleChange?: (style: string) => void;
}

export interface StudioChatProps {
  user: StudioUser | null;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  onSendMessage: () => void;
  sendingMessage: boolean;
  currentAnimation: AnimationState | null;
  onSaveConversation: () => void;
  savingConversation: boolean;
  className?: string;
}
