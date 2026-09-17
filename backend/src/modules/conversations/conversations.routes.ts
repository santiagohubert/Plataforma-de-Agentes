import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { conversationsService, RequesterIdentity } from './conversations.service.js';
import { usageService } from '../usage/usage.service.js';
import { auth } from '../auth/auth.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
});

/**
 * Obtiene la identidad del solicitante de forma segura en el backend.
 * Si está autenticado, toma el ID de la sesión de Better Auth.
 * Si es anónimo, lee o crea una cookie segura HttpOnly 'albio_anon_session'.
 */
export async function getRequesterIdentity(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<RequesterIdentity> {
  const session = await auth.api.getSession({
    headers: request.headers as any,
  });

  if (session && session.user) {
    return {
      userId: session.user.id,
      userName: session.user.name,
      anonymousSessionId: request.cookies['albio_anon_session'] || null,
    };
  }

  let anonId = request.cookies['albio_anon_session'];
  if (!anonId) {
    anonId = crypto.randomUUID();
    reply.setCookie('albio_anon_session', anonId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
  }

  return {
    userId: null,
    userName: null,
    anonymousSessionId: anonId,
  };
}

export const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Obtener o crear conversación actual
  fastify.get('/current', async (request, reply) => {
    const requester = await getRequesterIdentity(request, reply);
    const conversation = await conversationsService.getCurrentConversation(requester);
    const messageCount = await usageService.getMessageCount({
      userId: requester.userId,
      anonymousSessionId: requester.anonymousSessionId,
    });

    return reply.send({
      conversation,
      messageCount,
      isAnonymous: !requester.userId,
    });
  });

  // Consultar estado de uso / cuota
  fastify.get('/usage', async (request, reply) => {
    const requester = await getRequesterIdentity(request, reply);
    const messageCount = await usageService.getMessageCount({
      userId: requester.userId,
      anonymousSessionId: requester.anonymousSessionId,
    });

    return reply.send({
      messageCount,
      limit: 3,
      isAnonymous: !requester.userId,
      canSend: !requester.userId ? messageCount < 3 : true,
    });
  });

  // Obtener conversación por ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const requester = await getRequesterIdentity(request, reply);
    const conversation = await conversationsService.getConversationById(id, requester);
    return reply.send({ conversation });
  });

  // Enviar mensaje en la conversación
  fastify.post('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = sendMessageSchema.parse(request.body);
    const requester = await getRequesterIdentity(request, reply);

    const result = await conversationsService.sendMessage({
      conversationId: id,
      content: body.content,
      requester,
    });

    return reply.send(result);
  });

  // Reanudar conversación previa tras registrarse / autenticarse
  fastify.post('/resume', async (request, reply) => {
    const requester = await getRequesterIdentity(request, reply);

    if (!requester.userId) {
      throw new UnauthorizedError('Debes iniciar sesión para reanudar la conversación');
    }

    const anonCookie = request.cookies['albio_anon_session'];
    if (!anonCookie) {
      // Si no hay cookie anónima, retornar conversación actual
      const current = await conversationsService.getCurrentConversation(requester);
      return reply.send({ conversation: current });
    }

    const conversation = await conversationsService.resumeAnonymousConversation({
      anonymousSessionId: anonCookie,
      userId: requester.userId,
      userName: requester.userName,
    });

    return reply.send({ conversation });
  });
};
