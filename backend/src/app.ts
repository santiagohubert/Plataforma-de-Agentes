import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { AppError } from './shared/errors/app-error.js';
import { auth } from './modules/auth/auth.js';
import { agentsRoutes } from './modules/agents/agents.routes.js';
import { conversationsRoutes } from './modules/conversations/conversations.routes.js';
import { consentRoutes } from './modules/consent/consent.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // Plugins esenciales
  app.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.register(cookie);

  // Endpoint de salud
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'albio-backend',
      timestamp: new Date().toISOString(),
    };
  });

  // Manejador de Better Auth
  app.all('/api/auth/*', async (request, reply) => {
    const protocol = request.protocol || 'http';
    const host = request.headers.host || 'localhost:4000';
    const url = new URL(request.url, `${protocol}://${host}`);

    const req = new Request(url.toString(), {
      method: request.method,
      headers: request.headers as HeadersInit,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body),
    });

    const res = await auth.handler(req);

    reply.status(res.status);
    res.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return reply.send(json);
    }
    const text = await res.text();
    return reply.send(text);
  });

  // Módulos de dominio
  app.register(agentsRoutes, { prefix: '/api/agents' });
  app.register(conversationsRoutes, { prefix: '/api/conversations' });
  app.register(consentRoutes, { prefix: '/api/consent' });
  app.register(projectsRoutes, { prefix: '/api/projects' });

  // Manejador centralizado de errores
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        errors: error.errors,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ha ocurrido un error inesperado',
    });
  });

  return app;
}
