export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  userId?: string | null;
  anonymousSessionId?: string | null;
  externalConversationId?: string | null;
  title?: string | null;
  active: boolean;
  messages: Message[];
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description?: string;
  greeting: string;
}

export interface UsageStatus {
  messageCount: number;
  limit: number;
  isAnonymous: boolean;
  canSend: boolean;
}

export interface UserConsentInput {
  mailing?: boolean;
  country?: string;
  city?: string;
  birthYear?: number;
}
