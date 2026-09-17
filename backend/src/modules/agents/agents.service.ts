import { prisma } from '../../infrastructure/database/prisma.js';
import { NotFoundError } from '../../shared/errors/app-error.js';

export const DEFAULT_ALBIO_GREETING =
  'Hola, soy ALBIO, el agente de Bioenergética de SENS.\n\n' +
  'Estoy acá para acompañarte en el estudio y la profundización del Análisis Bioenergético de Alexander Lowen: ' +
  'consultas teóricas, lectura corporal, diseño de ejercicios, articulación con otros enfoques. ' +
  'Soy un sistema de inteligencia artificial, no un terapeuta. No reemplazo el trabajo clínico ni la supervisión, ' +
  'pero puedo ser un buen interlocutor conceptual..\n\n' +
  '¿Desde dónde arrancamos?';

export class AgentsService {
  async getBySlug(slug: string) {
    const agent = await prisma.agent.findUnique({
      where: { slug },
    });

    if (!agent) {
      if (slug === 'albio') {
        // Fallback autocreación si la base de datos acaba de inicializarse
        return await prisma.agent.create({
          data: {
            slug: 'albio',
            name: 'ALBIO',
            description: 'Agente de Análisis Bioenergético de SENS',
            greeting: DEFAULT_ALBIO_GREETING,
            provider: 'dify',
            status: 'ACTIVE',
          },
        });
      }
      throw new NotFoundError(`Agente no encontrado: ${slug}`);
    }

    return agent;
  }
}

export const agentsService = new AgentsService();
