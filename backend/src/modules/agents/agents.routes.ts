import { FastifyPluginAsync } from 'fastify';
import { agentsService } from './agents.service.js';

export const agentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const agent = await agentsService.getBySlug(slug);
    return reply.send({
      id: agent.id,
      slug: agent.slug,
      name: agent.name,
      description: agent.description,
      greeting: agent.greeting,
    });
  });
};
