import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/infrastructure/database/prisma.js';
import { auth } from '../src/modules/auth/auth.js';
import { CURRENT_CONSENT_VERSION } from '../src/modules/consent/consent.constants.js';

describe('Consent Module Tests (Consentimiento Informado v1.0)', () => {
  let app: FastifyInstance;
  const TEST_USER_ID = 'test-user-consent-uuid';
  const OTHER_USER_ID = 'test-user-other-uuid';

  beforeAll(async () => {
    // 1. Mock de Better Auth para resolver sesión mediante x-test-user-id
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

    // 2. Crear usuarios de prueba
    await prisma.userConsent.deleteMany({
      where: { userId: { in: [TEST_USER_ID, OTHER_USER_ID] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [TEST_USER_ID, OTHER_USER_ID] } },
    });

    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        name: 'Usuario Consentimiento Test',
        email: 'consent-test@senssd.com.ar',
      },
    });

    await prisma.user.create({
      data: {
        id: OTHER_USER_ID,
        name: 'Otro Usuario Test',
        email: 'other-user@senssd.com.ar',
      },
    });

    // 3. Inicializar servidor Fastify
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    await prisma.userConsent.deleteMany({
      where: { userId: { in: [TEST_USER_ID, OTHER_USER_ID] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [TEST_USER_ID, OTHER_USER_ID] } },
    });
  });

  it('debe rechazar con 401 si no hay usuario autenticado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/consent',
      payload: {
        acceptedConsent: true,
        country: 'Argentina',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('debe rechazar con 400 si acceptedConsent no es true', async () => {
    // Sin acceptedConsent
    const resNoConsent = await app.inject({
      method: 'POST',
      url: '/api/consent',
      headers: { 'x-test-user-id': TEST_USER_ID },
      payload: {
        country: 'Argentina',
      },
    });
    expect(resNoConsent.statusCode).toBe(400);

    // Con acceptedConsent: false
    const resFalseConsent = await app.inject({
      method: 'POST',
      url: '/api/consent',
      headers: { 'x-test-user-id': TEST_USER_ID },
      payload: {
        acceptedConsent: false,
        country: 'Argentina',
      },
    });
    expect(resFalseConsent.statusCode).toBe(400);
  });

  it('debe guardar UserConsent con acceptedAt, userId de la sesión y version vigente ("1.0")', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/consent',
      headers: { 'x-test-user-id': TEST_USER_ID },
      payload: {
        acceptedConsent: true,
        country: 'Argentina',
        city: 'Buenos Aires',
        birthYear: 1988,
        mailing: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.consent.userId).toBe(TEST_USER_ID);
    expect(body.consent.version).toBe(CURRENT_CONSENT_VERSION);
    expect(body.consent.version).toBe('1.0');
    expect(body.consent.country).toBe('Argentina');
    expect(body.consent.city).toBe('Buenos Aires');
    expect(body.consent.birthYear).toBe(1988);
    expect(body.consent.mailing).toBe(true);
    expect(body.consent.acceptedAt).toBeDefined();

    // Verificar directamente en Prisma
    const dbRecord = await prisma.userConsent.findUnique({
      where: { userId: TEST_USER_ID },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.version).toBe('1.0');
    expect(dbRecord?.country).toBe('Argentina');
    expect(dbRecord?.city).toBe('Buenos Aires');
    expect(dbRecord?.birthYear).toBe(1988);
    expect(dbRecord?.mailing).toBe(true);
  });

  it('debe ignorar cualquier versión arbitraria enviada por el cliente (ej: "999.0") y guardar siempre la versión del backend', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/consent',
      headers: { 'x-test-user-id': TEST_USER_ID },
      payload: {
        acceptedConsent: true,
        version: '999.0', // Intento de manipular la versión por el cliente
        country: 'Uruguay',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.consent.version).toBe(CURRENT_CONSENT_VERSION);
    expect(body.consent.version).toBe('1.0');
    expect(body.consent.version).not.toBe('999.0');

    // Verificar en BD
    const dbRecord = await prisma.userConsent.findUnique({
      where: { userId: TEST_USER_ID },
    });
    expect(dbRecord?.version).toBe('1.0');
  });

  it('no debe permitir asignar el consentimiento a un userId arbitrario que envíe el cliente', async () => {
    // El usuario autenticado es TEST_USER_ID, pero en el payload se envía OTHER_USER_ID
    const res = await app.inject({
      method: 'POST',
      url: '/api/consent',
      headers: { 'x-test-user-id': TEST_USER_ID },
      payload: {
        acceptedConsent: true,
        userId: OTHER_USER_ID, // El cliente intenta sobreescribir el usuario
        country: 'Chile',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    // Debe haber asociado al usuario autenticado, NO a OTHER_USER_ID
    expect(body.consent.userId).toBe(TEST_USER_ID);

    // OTHER_USER_ID no debe tener consentimiento registrado
    const otherConsent = await prisma.userConsent.findUnique({
      where: { userId: OTHER_USER_ID },
    });
    expect(otherConsent).toBeNull();
  });

  it('GET /api/consent debe retornar el consentimiento del usuario autenticado', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/consent',
      headers: { 'x-test-user-id': TEST_USER_ID },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.consent).not.toBeNull();
    expect(body.consent.userId).toBe(TEST_USER_ID);
    expect(body.consent.version).toBe('1.0');
    expect(body.currentVersion).toBe(CURRENT_CONSENT_VERSION);
  });
});
