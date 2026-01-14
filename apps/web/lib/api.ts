const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GenerateRequest {
  prompt: string;
}

export interface AnimationPlan {
  success: boolean;
  json_ir: any;
  manim_code: string;
  description: string;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export async function generatePlan(prompt: string): Promise<AnimationPlan> {
  const response = await fetch(`${API_BASE_URL}/generate-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to generate animation plan');
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
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to generate animation');
  }

  return response.blob();
}

export async function generateJsonOnly(prompt: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/generate-json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate JSON');
  }

  return response.json();
}