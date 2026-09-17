import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DifyProvider } from '../src/infrastructure/ai/dify.provider.js';
import { AppError } from '../src/shared/errors/app-error.js';

describe('DifyProvider', () => {
  const mockApiKey = 'test-dify-api-key';
  const mockBaseUrl = 'https://api.dify.ai/v1';
  let provider: DifyProvider;

  beforeEach(() => {
    provider = new DifyProvider(mockApiKey, mockBaseUrl);
    vi.restoreAllMocks();
  });

  it('debe enviar un mensaje a Dify y parsear la respuesta correctamente', async () => {
    const fakeResponse = {
      answer: 'El Análisis Bioenergético trabaja cuerpo y mente.',
      conversation_id: 'conv-123-abc',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeResponse,
    } as any);

    const result = await provider.sendMessage({
      userIdentifier: 'user-456',
      conversationId: 'conv-123-abc',
      query: '¿Qué es el grounding?',
    });

    expect(result.answer).toBe(fakeResponse.answer);
    expect(result.externalConversationId).toBe(fakeResponse.conversation_id);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.dify.ai/v1/chat-messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('debe arrojar AppError si Dify responde con error HTTP', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    } as any);

    await expect(
      provider.sendMessage({
        userIdentifier: 'user-456',
        query: 'Hola',
      })
    ).rejects.toThrow(AppError);
  });
});
