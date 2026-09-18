import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../infrastructure/database/prisma.js';
import { env } from '../../config/env.js';

const trustedOrigins = [
  ...env.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, '')),
  'http://localhost:3000',
].filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL.replace(/\/$/, ''),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
});

export type AuthType = typeof auth;

