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
  limits?: Record<string, unknown> | null;
  onRequireAuth: () => void;
  onLogout: () => void;
  sidebarView: 'templates' | 'history';
  onSidebarViewChange: (view: 'templates' | 'history') => void;
  loadingHistory: boolean;
  savedConversations: SavedConversation[];
  savedProjects: SavedProject[];
  currentConversationId: string | null;
  onLoadConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  templates: Template[];
  onApplyTemplate: (template: Template) => void;
}

export interface StudioWorkspaceProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentAnimation: AnimationState | null;
  renderJob: RenderJob | null;
  videoUrl: string | null;
  onDownload: () => void;
  onCopyJson: () => void;
  onCopyCode: () => void;
  copiedJson: boolean;
  copiedCode: boolean;
}

export interface StudioHeaderProps {
  currentAnimation: AnimationState | null;
  conversationSaved: boolean;
  onReset: () => void;
  onRender: () => void;
  canRender: boolean;
  rendering: boolean;
}

export interface StudioChatProps {
  user: StudioUser | null;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement>;
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  onSendMessage: () => void;
  sendingMessage: boolean;
  currentAnimation: AnimationState | null;
  onSaveConversation: () => void;
  savingConversation: boolean;
}
