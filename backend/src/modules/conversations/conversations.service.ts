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
   * Lista todas las conversaciones activas del usuario autenticado.
   */
  async listConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        active: true,
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        agentId: true,
        updatedAt: true,
        startedAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Obtiene la conversación activa actual del usuario o crea una nueva si no tiene ninguna.
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
        project: true,
      },
      orderBy: { updatedAt: 'desc' },
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
          project: true,
        },
      });
    }

    return conv;
  }

  /**
   * Crea una nueva conversación explícita (Nuevo Chat), opcionalmente dentro de un proyecto.
   */
  async createConversation(userId: string, params?: { projectId?: string | null; title?: string }) {
    const agent = await agentsService.getBySlug('albio');

    if (params?.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: params.projectId },
      });
      if (!project || project.userId !== userId) {
        throw new ForbiddenError('El proyecto especificado no es válido');
      }
    }

    return await prisma.conversation.create({
      data: {
        userId,
        agentId: agent.id,
        projectId: params?.projectId || null,
        title: params?.title || 'Nuevo chat',
        source: 'web',
        active: true,
      },
      include: {
        messages: true,
        project: true,
      },
    });
  }

  /**
   * Obtiene una conversación por ID validando pertenencia del usuario.
   */
  async getConversationById(id: string, userId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        agent: true,
        project: true,
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
   * Actualiza el título o mueve la conversación a otro proyecto (o a chat suelto).
   */
  async updateConversation(
    userId: string,
    conversationId: string,
    data: { title?: string; projectId?: string | null }
  ) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundError('Conversación no encontrada');
    }

    if (conv.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para modificar esta conversación');
    }

    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project || project.userId !== userId) {
        throw new ForbiddenError('Proyecto no válido');
      }
    }

    return await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        title: data.title !== undefined ? data.title.trim() : conv.title,
        projectId: data.projectId !== undefined ? data.projectId : conv.projectId,
      },
      include: {
        project: true,
      },
    });
  }

  /**
   * Elimina una conversación y sus mensajes.
   */
  async deleteConversation(userId: string, conversationId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundError('Conversación no encontrada');
    }

    if (conv.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para eliminar esta conversación');
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  /**
   * Envía un mensaje en la conversación y autotitula el chat si es el primer mensaje.
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
      include: {
        agent: true,
        _count: {
          select: { messages: true },
        },
      },
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

    // 2. Autotitulado: si es el primer mensaje o el título es genérico, asignar título del mensaje
    let newTitle = conv.title;
    if (!newTitle || newTitle === 'Nuevo chat' || newTitle === 'Conversación') {
      newTitle = trimmedContent.length > 35
        ? trimmedContent.slice(0, 32) + '...'
        : trimmedContent;
    }

    // 3. Consultar proveedor de IA (Dify)
    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.sendMessage({
      userIdentifier: userId,
      conversationId: conv.externalConversationId,
      query: trimmedContent,
    });

    // 4. Persistir respuesta del asistente
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: 'ASSISTANT',
        content: aiResponse.answer,
      },
    });

    // 5. Actualizar externalConversationId y título en la conversación
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        title: newTitle,
        externalConversationId: aiResponse.externalConversationId || conv.externalConversationId,
        updatedAt: new Date(),
      },
    });

    // 6. Registrar uso del usuario
    const currentCount = await usageService.incrementUsage({ userId });

    return {
      userMessage,
      assistantMessage,
      conversationId: conv.id,
      title: newTitle,
      externalConversationId: aiResponse.externalConversationId,
      messageCount: currentCount,
    };
  }
}

export const conversationsService = new ConversationsService();
