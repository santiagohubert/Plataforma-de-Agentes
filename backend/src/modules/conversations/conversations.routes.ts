import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { conversationsService } from './conversations.service.js';
import { auth } from '../auth/auth.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
});

const createConversationSchema = z.object({
  projectId: z.string().nullable().optional(),
  title: z.string().optional(),
});

const updateConversationSchema = z.object({
  title: z.string().optional(),
  projectId: z.string().nullable().optional(),
});

export const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware de sesión para todas las rutas de conversaciones
  fastify.addHook('preHandler', async (request) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (session && session.user) {
      (request as any).user = session.user;
    }
  });

  // Listar todas las conversaciones del usuario autenticado
  fastify.get('/', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.send({ conversations: [] });
    }

    const conversations = await conversationsService.listConversations(user.id);
    return reply.send({ conversations });
  });

  // Crear una nueva conversación (Nuevo Chat)
  fastify.post('/', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedError('Debes iniciar sesión para crear un chat');
    }

    const body = createConversationSchema.parse(request.body || {});
    const conversation = await conversationsService.createConversation(user.id, body);
    return reply.status(201).send({ conversation });
  });

  // Obtener conversación actual o última activa
  fastify.get('/current', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.send({
        authenticated: false,
        conversation: null,
      });
    }

    const conversation = await conversationsService.getCurrentConversation(user.id);
    return reply.send({
      authenticated: true,
      conversation,
    });
  });

  // Obtener conversación específica por ID
  fastify.get('/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedError('Debes iniciar sesión para ver esta conversación');
    }

    const { id } = request.params as { id: string };
    const conversation = await conversationsService.getConversationById(id, user.id);
    return reply.send({ conversation });
  });

  // Enviar mensaje en una conversación
  fastify.post('/:id/messages', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedError('Debes iniciar sesión para conversar con ALBIO');
    }

    const { id } = request.params as { id: string };
    const body = sendMessageSchema.parse(request.body);

    const result = await conversationsService.sendMessage({
      conversationId: id,
      content: body.content,
      userId: user.id,
      userName: user.name,
    });

    return reply.send(result);
  });

  // Actualizar título o proyecto del chat
  fastify.patch('/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedError('Debes iniciar sesión');
    }

    const { id } = request.params as { id: string };
    const body = updateConversationSchema.parse(request.body);
    const updated = await conversationsService.updateConversation(user.id, id, body);
    return reply.send({ conversation: updated });
  });

  // Eliminar conversación
  fastify.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedError('Debes iniciar sesión');
    }

    const { id } = request.params as { id: string };
    await conversationsService.deleteConversation(user.id, id);
    return reply.send({ success: true });
  });
};
