export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  conversations?: ConversationSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title?: string | null;
  projectId?: string | null;
  agentId?: string;
  startedAt?: string;
  updatedAt?: string;
  project?: { id: string; name: string; [key: string]: any } | null;
  _count?: { messages: number };
}

export interface Conversation {
  id: string;
  agentId: string;
  userId?: string | null;
  projectId?: string | null;
  title?: string | null;
  externalConversationId?: string | null;
  active: boolean;
  startedAt?: string;
  updatedAt?: string;
  project?: Project | null;
  messages: Message[];
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description?: string;
  greeting: string;
}

export interface UserConsentInput {
  mailing?: boolean;
  country?: string;
  city?: string;
  birthYear?: number;
}
