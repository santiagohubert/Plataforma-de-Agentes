import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const albioGreeting =
    'Hola, soy ALBIO, el agente de Bioenergética de SENS.\n\n' +
    'Estoy acá para acompañarte en el estudio y la profundización del Análisis Bioenergético de Alexander Lowen: ' +
    'consultas teóricas, lectura corporal, diseño de ejercicios, articulación con otros enfoques. ' +
    'Soy un sistema de inteligencia artificial, no un terapeuta. No reemplazo el trabajo clínico ni la supervisión, ' +
    'pero puedo ser un buen interlocutor conceptual..\n\n' +
    '¿Desde dónde arrancamos?';

  const albio = await prisma.agent.upsert({
    where: { slug: 'albio' },
    update: {
      name: 'ALBIO',
      description: 'Agente de Análisis Bioenergético de SENS Desarrollo Humano',
      greeting: albioGreeting,
      provider: 'dify',
      status: 'ACTIVE',
    },
    create: {
      slug: 'albio',
      name: 'ALBIO',
      description: 'Agente de Análisis Bioenergético de SENS Desarrollo Humano',
      greeting: albioGreeting,
      provider: 'dify',
      status: 'ACTIVE',
    },
  });

  console.log('Agent seeded successfully:', albio);
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
