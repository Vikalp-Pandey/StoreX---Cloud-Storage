import { logger } from '@packages/httputils';
import { initializeDatabase } from '@/db/initialize';
import { purgeExpiredTrash } from '@/services/fileServices/trashCleanup.service';

export const handler = async () => {
  await initializeDatabase();
  const result = await purgeExpiredTrash();
  logger(
    'INFO',
    `Trash cleanup completed: ${result.purgedBatches} batch(es), ${result.deletedObjects} S3 object(s)`,
  );
  return result;
};
