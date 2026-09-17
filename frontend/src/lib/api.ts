import { Agent, Conversation, Message, UserConsentInput } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Para enviar cookies HttpOnly de sesión
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || `Error HTTP ${response.status}`);
      (err as any).statusCode = response.status;
      (err as any).code = errorData.code;
      (err as any).details = errorData;
      throw err;
    }

    return response.json();
  }

  async getAgent(slug = 'albio'): Promise<Agent> {
    return this.request<Agent>(`/api/agents/${slug}`);
  }

  async getCurrentConversation(): Promise<{
    authenticated: boolean;
    conversation: Conversation | null;
  }> {
    return this.request('/api/conversations/current');
  }

  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
    conversationId: string;
    messageCount: number;
  }> {
    return this.request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async saveConsent(consent: UserConsentInput): Promise<{ success: boolean }> {
    return this.request('/api/consent', {
      method: 'POST',
      body: JSON.stringify(consent),
    });
  }
}

export const api = new ApiClient();
