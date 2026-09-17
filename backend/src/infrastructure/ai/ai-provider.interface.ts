export interface SendAIMessageInput {
  userIdentifier: string;
  conversationId?: string | null;
  query: string;
  inputs?: Record<string, unknown>;
}

export interface AIProviderResponse {
  answer: string;
  externalConversationId: string;
}

export interface AIProvider {
  sendMessage(input: SendAIMessageInput): Promise<AIProviderResponse>;
}
