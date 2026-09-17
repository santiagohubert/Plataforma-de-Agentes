import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/infrastructure/database/prisma.js';
import { auth } from '../src/modules/auth/auth.js';
import { setAIProvider, AIProvider } from '../src/infrastructure/ai/index.js';
import { agentsService } from '../src/modules/agents/agents.service.js';

describe('Tests de Integración (Fastify + Prisma + Ownership + Dify Mock)', () => {
  let app: FastifyInstance;

  const USER_A_ID = 'test-user-a-uuid-integration';
  const USER_B_ID = 'test-user-b-uuid-integration';

  let agentAlbioId: string;

  beforeAll(async () => {
    // 1. Asegurar agente ALBIO en BD
    const agent = await agentsService.getBySlug('albio');
    agentAlbioId = agent.id;

    // 2. Mock de AIProvider para que no dependa de la red externa de Dify en tests
    const mockAIProvider: AIProvider = {
      sendMessage: vi.fn().mockResolvedValue({
        answer: 'Respuesta simulada del agente ALBIO para pruebas de integración.',
        externalConversationId: 'dify-mock-conv-12345',
      }),
    };
    setAIProvider(mockAIProvider);

    // 3. Mockear Better Auth para simular sesiones válidas según header x-test-user-id
    vi.spyOn(auth.api, 'getSession').mockImplementation(async ({ headers }: any) => {
      const authUserId = typeof headers?.get === 'function'
        ? headers.get('x-test-user-id')
        : headers?.['x-test-user-id'];

      if (!authUserId) {
        return null as any;
      }

      const user = await prisma.user.findUnique({ where: { id: authUserId } });
      if (!user) {
        return null as any;
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        session: {
          id: `session-${user.id}`,
          userId: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          createdAt: new Date(),
          updatedAt: new Date(),
          token: `token-${user.id}`,
        },
      } as any;
    });

    // 4. Crear Usuarios de prueba en BD
    await prisma.user.upsert({
      where: { id: USER_A_ID },
      update: { name: 'Usuario A', email: 'usera@integration-test.com' },
      create: { id: USER_A_ID, name: 'Usuario A', email: 'usera@integration-test.com' },
    });

    await prisma.user.upsert({
      where: { id: USER_B_ID },
      update: { name: 'Usuario B', email: 'userb@integration-test.com' },
      create: { id: USER_B_ID, name: 'Usuario B', email: 'userb@integration-test.com' },
    });

    // 5. Inicializar Fastify
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    // Limpieza de datos de prueba
    await prisma.message.deleteMany({
      where: { conversation: { userId: { in: [USER_A_ID, USER_B_ID] } } },
    });
    await prisma.conversation.deleteMany({
      where: { userId: { in: [USER_A_ID, USER_B_ID] } },
    });
    await prisma.project.deleteMany({
      where: { userId: { in: [USER_A_ID, USER_B_ID] } },
    });
    await prisma.userUsage.deleteMany({
      where: { userId: { in: [USER_A_ID, USER_B_ID] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [USER_A_ID, USER_B_ID] } },
    });

    await app.close();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. 401 AL ACCEDER SIN SESIÓN
  // -------------------------------------------------------------
  describe('1. Seguridad: 401 al acceder sin sesión', () => {
    it('debe rechazar GET /api/projects con 401 sin sesión', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });
      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar POST /api/conversations con 401 sin sesión', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/conversations',
        payload: { title: 'Nuevo chat' },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar POST /api/conversations/:id/messages con 401 sin sesión', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/conversations/non-existent-id/messages',
        payload: { content: 'Hola' },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });
  });

  // -------------------------------------------------------------
  // 2. CREACIÓN DE PROYECTOS Y CONVERSACIONES
  // -------------------------------------------------------------
  describe('2. Ciclo de Vida: Creación de Proyecto y Conversación', () => {
    let createdProjectId: string;
    let createdConvId: string;

    it('debe permitir a Usuario A crear un proyecto (POST /api/projects)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { name: 'Investigación Bioenergética', description: 'Casos clínicos' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.project).toBeDefined();
      expect(body.project.name).toBe('Investigación Bioenergética');
      expect(body.project.userId).toBe(USER_A_ID);
      createdProjectId = body.project.id;
    });

    it('debe permitir a Usuario A crear una conversación dentro del proyecto (POST /api/conversations)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/conversations',
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { projectId: createdProjectId, title: 'Nuevo chat' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.conversation).toBeDefined();
      expect(body.conversation.userId).toBe(USER_A_ID);
      expect(body.conversation.projectId).toBe(createdProjectId);
      createdConvId = body.conversation.id;
    });
  });

  // -------------------------------------------------------------
  // 3. ENVÍO DE MENSAJES, PERSISTENCIA Y AUTOTITULADO
  // -------------------------------------------------------------
  describe('3. Mensajería: Envío con Mock Dify, Persistencia y Autotitulado', () => {
    let convId: string;

    beforeAll(async () => {
      // Crear conversación con título inicial genérico
      const conv = await prisma.conversation.create({
        data: {
          userId: USER_A_ID,
          agentId: agentAlbioId,
          title: 'Nuevo chat',
        },
      });
      convId = conv.id;
    });

    it('debe enviar mensaje, recibir respuesta de AIProvider y autotitular el chat', async () => {
      const promptText = '¿Qué es el grounding y cómo se trabaja en terapia corporal?';

      const res = await app.inject({
        method: 'POST',
        url: `/api/conversations/${convId}/messages`,
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { content: promptText },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();

      // 1. Mensaje de usuario
      expect(body.userMessage).toBeDefined();
      expect(body.userMessage.role).toBe('USER');
      expect(body.userMessage.content).toBe(promptText);

      // 2. Mensaje de asistente simulado
      expect(body.assistantMessage).toBeDefined();
      expect(body.assistantMessage.role).toBe('ASSISTANT');
      expect(body.assistantMessage.content).toContain('Respuesta simulada del agente ALBIO');

      // 3. Autotitulado
      expect(body.title).toBeDefined();
      expect(body.title).not.toBe('Nuevo chat');
      expect(body.title.startsWith('¿Qué es el grounding')).toBe(true);

      // 4. Verificación directa en base de datos PostgreSQL
      const dbMessages = await prisma.message.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: 'asc' },
      });

      expect(dbMessages.length).toBe(2);
      expect(dbMessages[0].role).toBe('USER');
      expect(dbMessages[0].content).toBe(promptText);
      expect(dbMessages[1].role).toBe('ASSISTANT');
      expect(dbMessages[1].content).toContain('Respuesta simulada del agente ALBIO');

      const updatedConv = await prisma.conversation.findUnique({
        where: { id: convId },
      });
      expect(updatedConv?.title).toBe(body.title);
      expect(updatedConv?.externalConversationId).toBe('dify-mock-conv-12345');
    });
  });

  // -------------------------------------------------------------
  // 4. OWNERSHIP Y AISLAMIENTO DE USUARIOS (403)
  // -------------------------------------------------------------
  describe('4. Ownership: Usuario A no puede acceder, modificar ni eliminar recursos de Usuario B (403)', () => {
    let userBConvId: string;
    let userBProjectId: string;

    beforeAll(async () => {
      // Crear proyecto y conversación pertenecientes a Usuario B
      const projectB = await prisma.project.create({
        data: {
          userId: USER_B_ID,
          name: 'Proyecto Privado de B',
        },
      });
      userBProjectId = projectB.id;

      const convB = await prisma.conversation.create({
        data: {
          userId: USER_B_ID,
          agentId: agentAlbioId,
          projectId: userBProjectId,
          title: 'Chat Privado de B',
        },
      });
      userBConvId = convB.id;
    });

    it('Usuario A no puede ver la conversación de Usuario B (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/conversations/${userBConvId}`,
        headers: { 'x-test-user-id': USER_A_ID },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('Usuario A no puede enviar mensajes en la conversación de Usuario B (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/conversations/${userBConvId}/messages`,
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { content: 'Intento de intrusión' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('Usuario A no puede modificar el título de la conversación de Usuario B (403)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/conversations/${userBConvId}`,
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { title: 'Hackeado' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('Usuario A no puede eliminar la conversación de Usuario B (403)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/conversations/${userBConvId}`,
        headers: { 'x-test-user-id': USER_A_ID },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('Usuario A no puede modificar el proyecto de Usuario B (403)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/projects/${userBProjectId}`,
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { name: 'Hackeado' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('Usuario A no puede eliminar el proyecto de Usuario B (403)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${userBProjectId}`,
        headers: { 'x-test-user-id': USER_A_ID },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('Asignar conversación de Usuario A a un proyecto de Usuario B debe devolver 403', async () => {
      // Crear chat para Usuario A
      const userAConv = await prisma.conversation.create({
        data: {
          userId: USER_A_ID,
          agentId: agentAlbioId,
          title: 'Chat de A',
        },
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/conversations/${userAConv.id}`,
        headers: { 'x-test-user-id': USER_A_ID },
        payload: { projectId: userBProjectId }, // Intenta inyectar el proyecto de B
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().message).toContain('Proyecto no válido');
    });
  });

  // -------------------------------------------------------------
  // 5. ELIMINACIÓN Y REGLAS DE INTEGRIDAD (CASCADE Y SET NULL)
  // -------------------------------------------------------------
  describe('5. Integridad Referencial: Eliminación de Conversación y Proyecto', () => {
    it('al eliminar una conversación se eliminan sus mensajes en cascada (onDelete: Cascade)', async () => {
      const conv = await prisma.conversation.create({
        data: {
          userId: USER_A_ID,
          agentId: agentAlbioId,
          title: 'Chat a borrar',
          messages: {
            createMany: {
              data: [
                { role: 'USER', content: 'Mensaje 1' },
                { role: 'ASSISTANT', content: 'Mensaje 2' },
                { role: 'USER', content: 'Mensaje 3' },
              ],
            },
          },
        },
      });

      // Verificar que los mensajes existen
      const initialCount = await prisma.message.count({
        where: { conversationId: conv.id },
      });
      expect(initialCount).toBe(3);

      // Eliminar vía endpoint
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/conversations/${conv.id}`,
        headers: { 'x-test-user-id': USER_A_ID },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);

      // Verificar que la conversación ya no existe
      const deletedConv = await prisma.conversation.findUnique({
        where: { id: conv.id },
      });
      expect(deletedConv).toBeNull();

      // Verificar que los mensajes fueron eliminados en cascada
      const remainingMessages = await prisma.message.findMany({
        where: { conversationId: conv.id },
      });
      expect(remainingMessages.length).toBe(0);
    });

    it('al eliminar un proyecto, sus conversaciones pasan a projectId = null sin borrarse (onDelete: SetNull)', async () => {
      // 1. Crear proyecto
      const project = await prisma.project.create({
        data: {
          userId: USER_A_ID,
          name: 'Proyecto Temporal para Borrar',
        },
      });

      // 2. Crear conversación asignada a ese proyecto
      const conv = await prisma.conversation.create({
        data: {
          userId: USER_A_ID,
          agentId: agentAlbioId,
          projectId: project.id,
          title: 'Chat que debe conservarse como suelto',
        },
      });

      expect(conv.projectId).toBe(project.id);

      // 3. Eliminar proyecto vía endpoint
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
        headers: { 'x-test-user-id': USER_A_ID },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);

      // 4. Verificar que la conversación sigue existiendo pero con projectId = null
      const updatedConv = await prisma.conversation.findUnique({
        where: { id: conv.id },
      });

      expect(updatedConv).not.toBeNull();
      expect(updatedConv?.id).toBe(conv.id);
      expect(updatedConv?.projectId).toBeNull(); // Pasó a chat suelto sin pérdida de datos
    });

    it('intentar eliminar un agente con conversaciones activas debe ser rechazado por la base de datos (onDelete: Restrict)', async () => {
      // Intentar borrar agentAlbioId que tiene conversaciones asociadas
      await expect(
        prisma.agent.delete({
          where: { id: agentAlbioId },
        })
      ).rejects.toThrow();
    });
  });
});
