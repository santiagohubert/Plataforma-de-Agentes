import { buildApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './infrastructure/database/prisma.js';

async function startServer() {
  const app = buildApp();

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\nRecibido ${signal}, cerrando servidor...`);
      try {
        await app.close();
        await prisma.$disconnect();
        console.log('Servidor y base de datos desconectados de forma segura.');
        process.exit(0);
      } catch (err) {
        console.error('Error durante el apagado:', err);
        process.exit(1);
      }
    });
  }

  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`ALBIO Backend API iniciado en http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
