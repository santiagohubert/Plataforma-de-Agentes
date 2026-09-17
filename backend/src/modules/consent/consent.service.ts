import { prisma } from '../../infrastructure/database/prisma.js';

export interface SaveConsentInput {
  userId: string;
  mailing?: boolean;
  country?: string;
  city?: string;
  birthYear?: number;
  version?: string;
}

export class ConsentService {
  async saveConsent(input: SaveConsentInput) {
    return await prisma.userConsent.upsert({
      where: { userId: input.userId },
      update: {
        acceptedAt: new Date(),
        version: input.version || '1.0',
        mailing: input.mailing ?? false,
        country: input.country,
        city: input.city,
        birthYear: input.birthYear,
      },
      create: {
        userId: input.userId,
        acceptedAt: new Date(),
        version: input.version || '1.0',
        mailing: input.mailing ?? false,
        country: input.country,
        city: input.city,
        birthYear: input.birthYear,
      },
    });
  }

  async getConsent(userId: string) {
    return await prisma.userConsent.findUnique({
      where: { userId },
    });
  }
}

export const consentService = new ConsentService();
