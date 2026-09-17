import { logger } from '@packages/httputils';
import { purgeExpiredTrash } from '@/services/fileServices/trashCleanup.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const asyncJobHandler =
  (
    handler: () => Promise<void>,
    onError: (error: unknown) => void,
    onFinally: () => void,
  ) =>
  () => {
    void handler().catch(onError).finally(onFinally);
  };

export const startTrashCleanupJob = () => {
  let running = false;

  const execute = asyncJobHandler(
    async () => {
      const result = await purgeExpiredTrash();
      if (result.purgedBatches)
        logger(
          'INFO',
          `Purged ${result.purgedBatches} trash batch(es) and ${result.deletedObjects} S3 object(s)`,
        );
    },
    (error) => logger('ERROR', 'Trash cleanup job failed', error),
    () => {
      running = false;
    },
  );

  const run = () => {
    if (running) return;
    running = true;
    execute();
  };

  run();
  const timer = setInterval(run, ONE_DAY_MS);
  timer.unref();

  return () => clearInterval(timer);
};
