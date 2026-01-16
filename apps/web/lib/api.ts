const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  animation_state?: any;
}

export interface ConversationResponse {
  success: boolean;
  assistant_message: string;
  animation_ir: any;
  manim_code: string;
  description: string;
  validation: {
    valid: boolean;
    errors: string[];
  };
  conversation_history: ChatMessage[];
}

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  currentAnimation: any | null
): Promise<ConversationResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
      current_animation: currentAnimation,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to send chat message');
  }

  return response.json();
}

export async function renderAnimation(animationIR: any): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(animationIR),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to render animation');
  }

  return response.blob();
}

// Legacy functions (keep for backward compatibility)
export async function generatePlan(prompt: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/generate-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate plan');
  }

  return response.json();
}

export async function generateAnimation(prompt: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate animation');
  }

  return response.blob();
}