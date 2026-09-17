import { prisma } from '../../infrastructure/database/prisma.js';
import { getAIProvider } from '../../infrastructure/ai/index.js';
import { usageService } from '../usage/usage.service.js';
import { agentsService } from '../agents/agents.service.js';
import {
  ForbiddenError,
  LimitReachedError,
  NotFoundError,
  BadRequestError,
} from '../../shared/errors/app-error.js';

export interface RequesterIdentity {
  userId?: string | null;
  userName?: string | null;
  anonymousSessionId?: string | null;
}

export class ConversationsService {
  /**
   * Obtiene la conversación activa actual del usuario o crea una nueva si no existe.
   */
  async getCurrentConversation(requester: RequesterIdentity, agentSlug = 'albio') {
    const agent = await agentsService.getBySlug(agentSlug);

    if (requester.userId) {
      let conv = await prisma.conversation.findFirst({
        where: {
          userId: requester.userId,
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
            userId: requester.userId,
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

    if (requester.anonymousSessionId) {
      let conv = await prisma.conversation.findFirst({
        where: {
          anonymousSessionId: requester.anonymousSessionId,
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
            anonymousSessionId: requester.anonymousSessionId,
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

    throw new BadRequestError('Identidad de usuario o sesión anónima no proporcionada');
  }

  /**
   * Obtiene una conversación por ID validando la autorización estricta.
   */
  async getConversationById(id: string, requester: RequesterIdentity) {
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

    this.assertOwnership(conv, requester);
    return conv;
  }

  /**
   * Envía un mensaje en la conversación.
   * Valida cuota atómica (3 mensajes para anónimos) antes de enviar a Dify.
   */
  async sendMessage(params: {
    conversationId: string;
    content: string;
    requester: RequesterIdentity;
  }) {
    const { conversationId, content, requester } = params;

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

    this.assertOwnership(conv, requester);

    // 1. Validar cuota antes de invocar a Dify
    const canSend = await usageService.canSendMessage({
      userId: requester.userId,
      anonymousSessionId: requester.anonymousSessionId,
    });

    if (!canSend) {
      throw new LimitReachedError();
    }

    // 2. Persistir mensaje del usuario
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: 'USER',
        content: trimmedContent,
      },
    });

    // 3. Consultar proveedor de IA (Dify)
    const userIdentifier = requester.userId
      ? String(requester.userId)
      : `anon_${requester.anonymousSessionId || 'default'}`;

    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.sendMessage({
      userIdentifier,
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

    // 5. Actualizar externalConversationId si cambió
    if (aiResponse.externalConversationId && aiResponse.externalConversationId !== conv.externalConversationId) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          externalConversationId: aiResponse.externalConversationId,
          updatedAt: new Date(),
        },
      });
    }

    // 6. Contabilizar mensaje exitoso (comportamiento idéntico a Wix)
    const currentCount = await usageService.incrementUsage({
      userId: requester.userId,
      anonymousSessionId: requester.anonymousSessionId,
    });

    return {
      userMessage,
      assistantMessage,
      conversationId: conv.id,
      externalConversationId: aiResponse.externalConversationId,
      messageCount: currentCount,
    };
  }

  /**
   * Reanuda la conversación anónima al registrarse el usuario:
   * Reproduce exactamente el comportamiento funcional de Wix:
   * 1. Recupera el historial anónimo previo.
   * 2. Construye el bloque de contexto previo.
   * 3. Crea una NUEVA conversación para el usuario registrado.
   * 4. Llama a Dify con user: userId y conversation_id: null (iniciando nuevo hilo en Dify con contexto previo).
   */
  async resumeAnonymousConversation(params: {
    anonymousSessionId: string;
    userId: string;
    userName?: string | null;
  }) {
    const { anonymousSessionId, userId, userName } = params;

    // Buscar la última conversación anónima activa
    const anonConv = await prisma.conversation.findFirst({
      where: {
        anonymousSessionId,
        active: true,
      },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const agent = anonConv?.agent || (await agentsService.getBySlug('albio'));

    // Crear NUEVA conversación oficial para el usuario autenticado
    const newConv = await prisma.conversation.create({
      data: {
        userId,
        agentId: agent.id,
        source: 'web',
        active: true,
      },
    });

    // Si había mensajes en la sesión anónima, armar el contexto
    let contexto = '';
    if (anonConv && anonConv.messages.length > 0) {
      contexto = anonConv.messages
        .map((m) => `${m.role === 'USER' ? 'Usuario' : 'ALBIO'}: ${m.content}`)
        .join('\n');

      // Marcar la conversación anónima previa como inactiva
      await prisma.conversation.update({
        where: { id: anonConv.id },
        data: { active: false },
      });
    }

    const greetingText = `Hola ${userName && userName !== 'sin-nombre' ? userName : ''}. Retomo lo que veníamos hablando.`;

    // Guardar mensaje de bienvenida del agente en la nueva conversación
    await prisma.message.create({
      data: {
        conversationId: newConv.id,
        role: 'ASSISTANT',
        content: greetingText,
      },
    });

    let externalId: string | null = null;

    if (contexto) {
      try {
        const aiProvider = getAIProvider();
        const aiResponse = await aiProvider.sendMessage({
          userIdentifier: userId,
          conversationId: null, // Nueva conversación Dify
          query: `Contexto de conversación previa:\n${contexto}`,
        });

        externalId = aiResponse.externalConversationId;

        await prisma.conversation.update({
          where: { id: newConv.id },
          data: {
            externalConversationId: externalId,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.error('[ConversationsService] Error enviando contexto a Dify:', err);
      }
    }

    // Retornar la nueva conversación con sus mensajes
    return await prisma.conversation.findUnique({
      where: { id: newConv.id },
      include: {
        agent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private assertOwnership(
    conv: { userId: string | null; anonymousSessionId: string | null },
    requester: RequesterIdentity
  ) {
    if (conv.userId) {
      if (conv.userId !== requester.userId) {
        throw new ForbiddenError('No tienes permiso para acceder a esta conversación');
      }
      return;
    }

    if (conv.anonymousSessionId) {
      if (conv.anonymousSessionId !== requester.anonymousSessionId) {
        throw new ForbiddenError('No tienes permiso para acceder a esta conversación anónima');
      }
      return;
    }

    throw new ForbiddenError('Acceso denegado');
  }
}

export const conversationsService = new ConversationsService();
