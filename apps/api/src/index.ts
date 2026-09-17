import { serve } from '@hono/node-server';
import { logger } from '@packages/httputils';
import env from '@packages/env';
import mongoose from 'mongoose';
import { closeRedisClient } from '@packages/clients/redis';
import app from '@/app';
import { initializeDatabase } from '@/db/initialize';
import { startTrashCleanupJob } from '@/jobs/trashCleanup.job';

const start = async () => {
  await initializeDatabase();
  const stopTrashCleanupJob = startTrashCleanupJob();

  const server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    () => {
      logger('INFO', `Server is running on http://localhost:${env.PORT}`);
    },
  );

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopTrashCleanupJob();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await Promise.all([mongoose.disconnect(), closeRedisClient()]);
  };

  process.once('SIGINT', () => void shutdown().catch(console.error));
  process.once('SIGTERM', () => void shutdown().catch(console.error));
};

void start().catch((error) => {
  logger('ERROR', 'API startup failed', error);
  process.exitCode = 1;
});
