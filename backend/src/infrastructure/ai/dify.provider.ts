import { AIProvider, SendAIMessageInput, AIProviderResponse } from './ai-provider.interface.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

export class DifyProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey = env.DIFY_API_KEY_ALBIO, baseUrl = env.DIFY_API_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async sendMessage(input: SendAIMessageInput): Promise<AIProviderResponse> {
    const url = `${this.baseUrl}/chat-messages`;

    const payload: Record<string, unknown> = {
      inputs: input.inputs || {},
      query: String(input.query),
      response_mode: 'blocking',
      user: String(input.userIdentifier || 'anon'),
    };

    if (input.conversationId && input.conversationId !== 'null' && input.conversationId !== 'undefined') {
      payload.conversation_id = input.conversationId;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DifyProvider] Error ${response.status}:`, errorText);
        throw new AppError(
          'Error en el proveedor de IA (Dify)',
          response.status >= 500 ? 502 : response.status,
          'DIFY_ERROR',
          { status: response.status }
        );
      }

      const data = (await response.json()) as { answer?: string; conversation_id?: string };

      return {
        answer: data.answer || 'No pude responder eso 😕',
        externalConversationId: data.conversation_id || '',
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error.name === 'AbortError') {
        throw new AppError('El servicio de IA tardó demasiado en responder', 504, 'AI_TIMEOUT');
      }
      console.error('[DifyProvider] Excepción no controlada:', error);
      throw new AppError('Hubo un problema de conexión con el agente de IA', 502, 'AI_CONNECTION_ERROR');
    }
  }
}
