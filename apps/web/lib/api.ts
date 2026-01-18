const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==================== TYPES ====================

export interface User {
  id: string;
  email: string;
  username: string;
  tier: 'free' | 'pro' | 'enterprise';
  credits_remaining: number;
  credits_used: number;
  animations_created: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  is_premium: boolean;
  use_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  animation_state?: any;
}

export interface RenderJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  estimated_duration?: number;
}

// ==================== AUTH ====================

export async function register(email: string, username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  return response.json();
}

export async function getUserLimits(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/limits`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get limits');
  }

  return response.json();
}

// ==================== TEMPLATES ====================

export async function listTemplates(token?: string): Promise<Template[]> {
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/templates`, { headers });

  if (!response.ok) {
    throw new Error('Failed to list templates');
  }

  return response.json();
}

export async function applyTemplate(
  templateId: string,
  customizations: any,
  token: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(customizations),
  });

  if (!response.ok) {
    throw new Error('Failed to apply template');
  }

  return response.json();
}

// ==================== CHAT ====================

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  currentAnimation: any | null,
  token: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
      current_animation: currentAnimation,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Chat failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

// ==================== RENDERING ====================

export async function queueRenderJob(
  animationIR: any,
  options: {
    output_format?: string;
    quality?: string;
    include_voiceover?: boolean;
    voiceover_text?: string;
    voiceover_voice?: string;
    include_music?: boolean;
    music_mood?: string;
    music_volume?: number;
  },
  token: string
): Promise<RenderJob> {
  const response = await fetch(`${API_BASE_URL}/render/queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      animation_ir: animationIR,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Render failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getRenderStatus(jobId: string, token: string): Promise<RenderJob> {
  const response = await fetch(`${API_BASE_URL}/render/status/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get render status');
  }

  return response.json();
}

export async function listUserJobs(token: string): Promise<RenderJob[]> {
  const response = await fetch(`${API_BASE_URL}/render/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to list jobs');
  }

  return response.json();
}

export async function instantRender(animationIR: any, token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/render/instant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(animationIR),
  });

  if (!response.ok) {
    throw new Error('Render failed');
  }

  return response.blob();
}

// ==================== ANALYTICS ====================

export async function getUserStats(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/analytics/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get stats');
  }

  return response.json();
}

// ==================== LOCAL STORAGE ====================

export function saveToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function removeToken() {
  localStorage.removeItem('auth_token');
}

export function saveUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser(): User | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function removeUser() {
  localStorage.removeItem('user');
}