import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { consentService } from './consent.service.js';
import { auth } from '../auth/auth.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const consentSchema = z.object({
  mailing: z.boolean().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  birthYear: z.coerce.number().optional(),
  version: z.string().optional(),
});

export const consentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    // Extraer sesión de Better Auth a partir de headers/cookies
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session || !session.user) {
      throw new UnauthorizedError('Debes estar autenticado para registrar el consentimiento');
    }

    const body = consentSchema.parse(request.body);

    const saved = await consentService.saveConsent({
      userId: session.user.id,
      ...body,
    });

    return reply.status(200).send({
      success: true,
      consent: saved,
    });
  });

  fastify.get('/', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session || !session.user) {
      throw new UnauthorizedError('No autenticado');
    }

    const consent = await consentService.getConsent(session.user.id);
    return reply.send({ consent });
  });
};
