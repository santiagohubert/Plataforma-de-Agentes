import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { consentService } from './consent.service.js';
import { CURRENT_CONSENT_VERSION } from './consent.constants.js';
import { auth } from '../auth/auth.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const consentSchema = z.object({
  acceptedConsent: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar el Consentimiento Informado para continuar',
  }),
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

    // Guardar consentimiento asociado estrictamente al usuario de la sesión autenticada
    // y fijando siempre la versión vigente definida por el backend
    const saved = await consentService.saveConsent({
      userId: session.user.id,
      version: CURRENT_CONSENT_VERSION,
      mailing: body.mailing,
      country: body.country,
      city: body.city,
      birthYear: body.birthYear,
    });

    return reply.status(200).send({
      success: true,
      consent: saved,
      currentVersion: CURRENT_CONSENT_VERSION,
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
    return reply.send({ consent, currentVersion: CURRENT_CONSENT_VERSION });
  });
};

