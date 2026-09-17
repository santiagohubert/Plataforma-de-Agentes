import { Agent, Conversation, ConversationSummary, Project, Message, UserConsentInput } from './types';

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
      credentials: 'include',
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

  // Conversaciones
  async listConversations(): Promise<{ conversations: ConversationSummary[] }> {
    return this.request('/api/conversations');
  }

  async getCurrentConversation(): Promise<{
    authenticated: boolean;
    conversation: Conversation | null;
  }> {
    return this.request('/api/conversations/current');
  }

  async getConversation(id: string): Promise<{ conversation: Conversation }> {
    return this.request(`/api/conversations/${id}`);
  }

  async createConversation(params?: { projectId?: string | null; title?: string }): Promise<{ conversation: Conversation }> {
    return this.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  async updateConversation(
    id: string,
    data: { title?: string; projectId?: string | null }
  ): Promise<{ conversation: Conversation }> {
    return this.request(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
    conversationId: string;
    title?: string;
    messageCount: number;
  }> {
    return this.request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Proyectos
  async listProjects(): Promise<{ projects: Project[] }> {
    return this.request('/api/projects');
  }

  async createProject(name: string, description?: string): Promise<{ project: Project }> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async updateProject(id: string, data: { name?: string; description?: string }): Promise<{ project: Project }> {
    return this.request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Consentimiento
  async saveConsent(consent: UserConsentInput): Promise<{ success: boolean }> {
    return this.request('/api/consent', {
      method: 'POST',
      body: JSON.stringify(consent),
    });
  }
}

export const api = new ApiClient();
