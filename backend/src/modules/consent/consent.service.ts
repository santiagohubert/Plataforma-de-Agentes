import { prisma } from '../../infrastructure/database/prisma.js';
import { CURRENT_CONSENT_VERSION } from './consent.constants.js';

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
    // La versión vigente es fijada por el backend, no por el cliente
    const versionToUse = CURRENT_CONSENT_VERSION;

    return await prisma.userConsent.upsert({
      where: { userId: input.userId },
      update: {
        acceptedAt: new Date(),
        version: versionToUse,
        mailing: input.mailing ?? false,
        country: input.country,
        city: input.city,
        birthYear: input.birthYear,
      },
      create: {
        userId: input.userId,
        acceptedAt: new Date(),
        version: versionToUse,
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

