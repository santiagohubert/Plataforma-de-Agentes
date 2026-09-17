import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { conversationsService } from './conversations.service.js';
import { auth } from '../auth/auth.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
});

export const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Obtener conversación actual del usuario autenticado
  fastify.get('/current', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session || !session.user) {
      return reply.send({
        authenticated: false,
        conversation: null,
      });
    }

    const conversation = await conversationsService.getCurrentConversation(session.user.id);

    return reply.send({
      authenticated: true,
      conversation,
    });
  });

  // Obtener conversación por ID
  fastify.get('/:id', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session || !session.user) {
      throw new UnauthorizedError('Debes iniciar sesión para ver esta conversación');
    }

    const { id } = request.params as { id: string };
    const conversation = await conversationsService.getConversationById(id, session.user.id);
    return reply.send({ conversation });
  });

  // Enviar mensaje en la conversación (exige sesión activa)
  fastify.post('/:id/messages', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session || !session.user) {
      throw new UnauthorizedError('Debes iniciar sesión para conversar con ALBIO');
    }

    const { id } = request.params as { id: string };
    const body = sendMessageSchema.parse(request.body);

    const result = await conversationsService.sendMessage({
      conversationId: id,
      content: body.content,
      userId: session.user.id,
      userName: session.user.name,
    });

    return reply.send(result);
  });
};
