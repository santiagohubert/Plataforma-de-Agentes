import { prisma } from '../../infrastructure/database/prisma.js';
import { getAIProvider } from '../../infrastructure/ai/index.js';
import { usageService } from '../usage/usage.service.js';
import { agentsService } from '../agents/agents.service.js';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../../shared/errors/app-error.js';

export class ConversationsService {
  /**
   * Obtiene la conversación activa actual del usuario autenticado o crea una nueva.
   * Retorna todo el historial previo de mensajes sin perder nada.
   */
  async getCurrentConversation(userId: string, agentSlug = 'albio') {
    const agent = await agentsService.getBySlug(agentSlug);

    let conv = await prisma.conversation.findFirst({
      where: {
        userId,
        agentId: agent.id,
        active: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          userId,
          agentId: agent.id,
          source: 'web',
          active: true,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return conv;
  }

  /**
   * Obtiene una conversación por ID validando que pertenezca al usuario autenticado.
   */
  async getConversationById(id: string, userId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) {
      throw new NotFoundError('Conversación no encontrada');
    }

    if (conv.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para acceder a esta conversación');
    }

    return conv;
  }

  /**
   * Envía un mensaje en la conversación del usuario autenticado.
   */
  async sendMessage(params: {
    conversationId: string;
    content: string;
    userId: string;
    userName?: string | null;
  }) {
    const { conversationId, content, userId } = params;

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestError('El mensaje no puede estar vacío');
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { agent: true },
    });

    if (!conv) {
      throw new NotFoundError('Conversación no encontrada');
    }

    if (conv.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para enviar mensajes en esta conversación');
    }

    // 1. Persistir mensaje del usuario
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: 'USER',
        content: trimmedContent,
      },
    });

    // 2. Consultar proveedor de IA (Dify) directamente con el identificador del usuario
    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.sendMessage({
      userIdentifier: userId,
      conversationId: conv.externalConversationId,
      query: trimmedContent,
    });

    // 3. Persistir respuesta del asistente
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: 'ASSISTANT',
        content: aiResponse.answer,
      },
    });

    // 4. Actualizar externalConversationId de Dify en la conversación
    if (aiResponse.externalConversationId && aiResponse.externalConversationId !== conv.externalConversationId) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          externalConversationId: aiResponse.externalConversationId,
          updatedAt: new Date(),
        },
      });
    }

    // 5. Registrar uso del usuario
    const currentCount = await usageService.incrementUsage({ userId });

    return {
      userMessage,
      assistantMessage,
      conversationId: conv.id,
      externalConversationId: aiResponse.externalConversationId,
      messageCount: currentCount,
    };
  }
}

export const conversationsService = new ConversationsService();
