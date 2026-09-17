import { prisma } from '../../infrastructure/database/prisma.js';

export const FREE_LIMIT = 3;

export interface UsageIdentifier {
  userId?: string | null;
  anonymousSessionId?: string | null;
}

export class UsageService {
  /**
   * Verifica si el usuario (anónimo o autenticado) tiene cuota para enviar un mensaje.
   * Los usuarios autenticados no tienen límite.
   * Los usuarios anónimos tienen un límite de 3 mensajes.
   */
  async canSendMessage(identifier: UsageIdentifier): Promise<boolean> {
    if (identifier.userId) {
      return true;
    }

    if (!identifier.anonymousSessionId) {
      return false;
    }

    const usage = await prisma.userUsage.findUnique({
      where: { anonymousSessionId: identifier.anonymousSessionId },
      select: { messageCount: true },
    });

    if (!usage) {
      return true;
    }

    return usage.messageCount < FREE_LIMIT;
  }

  /**
   * Obtiene la cantidad actual de mensajes enviados por el usuario o sesión anónima.
   */
  async getMessageCount(identifier: UsageIdentifier): Promise<number> {
    if (identifier.userId) {
      const usage = await prisma.userUsage.findUnique({
        where: { userId: identifier.userId },
        select: { messageCount: true },
      });
      return usage?.messageCount ?? 0;
    }

    if (identifier.anonymousSessionId) {
      const usage = await prisma.userUsage.findUnique({
        where: { anonymousSessionId: identifier.anonymousSessionId },
        select: { messageCount: true },
      });
      return usage?.messageCount ?? 0;
    }

    return 0;
  }

  /**
   * Incrementa el uso de forma segura y atómica en PostgreSQL.
   * Se ejecuta luego de que el mensaje haya sido procesado exitosamente por Dify (comportamiento fiel a Wix).
   */
  async incrementUsage(identifier: UsageIdentifier): Promise<number> {
    if (identifier.userId) {
      const usage = await prisma.userUsage.upsert({
        where: { userId: identifier.userId },
        update: {
          messageCount: { increment: 1 },
          lastUsed: new Date(),
        },
        create: {
          userId: identifier.userId,
          messageCount: 1,
          lastUsed: new Date(),
        },
      });
      return usage.messageCount;
    }

    if (identifier.anonymousSessionId) {
      const usage = await prisma.userUsage.upsert({
        where: { anonymousSessionId: identifier.anonymousSessionId },
        update: {
          messageCount: { increment: 1 },
          lastUsed: new Date(),
        },
        create: {
          anonymousSessionId: identifier.anonymousSessionId,
          messageCount: 1,
          lastUsed: new Date(),
        },
      });
      return usage.messageCount;
    }

    return 0;
  }
}

export const usageService = new UsageService();
