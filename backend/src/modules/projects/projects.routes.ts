import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { projectsService } from './projects.service.js';
import { auth } from '../auth/auth.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware de autenticación para todas las rutas de proyectos
  fastify.addHook('preHandler', async (request) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session || !session.user) {
      throw new UnauthorizedError('Debes iniciar sesión para gestionar proyectos');
    }

    (request as any).user = session.user;
  });

  // Listar proyectos del usuario con sus chats
  fastify.get('/', async (request, reply) => {
    const userId = (request as any).user.id;
    const projects = await projectsService.listProjects(userId);
    return reply.send({ projects });
  });

  // Crear nuevo proyecto
  fastify.post('/', async (request, reply) => {
    const userId = (request as any).user.id;
    const body = createProjectSchema.parse(request.body);
    const project = await projectsService.createProject(userId, body.name, body.description);
    return reply.status(201).send({ project });
  });

  // Actualizar proyecto
  fastify.patch('/:id', async (request, reply) => {
    const userId = (request as any).user.id;
    const { id } = request.params as { id: string };
    const body = updateProjectSchema.parse(request.body);
    const project = await projectsService.updateProject(userId, id, body);
    return reply.send({ project });
  });

  // Eliminar proyecto
  fastify.delete('/:id', async (request, reply) => {
    const userId = (request as any).user.id;
    const { id } = request.params as { id: string };
    await projectsService.deleteProject(userId, id);
    return reply.send({ success: true });
  });
};
