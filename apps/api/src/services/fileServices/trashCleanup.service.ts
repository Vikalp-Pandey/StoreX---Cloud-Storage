import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { S3 } from '@packages/clients';
import env from '@packages/env';
import { logger } from '@packages/httputils';
import { Trash } from '@/models/fileModels/trash.model';
import { releaseStorageForFile } from '@/services/fileServices/storage.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const S3_DELETE_LIMIT = 1000;

const chunks = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

const storedBytes = (size: string) => {
  const bytes = Number(size);
  return Number.isSafeInteger(bytes) && bytes > 0 ? bytes : 0;
};

export const purgeExpiredTrash = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS);
  const roots = await Trash.find({
    isRoot: true,
    deletedAt: { $lte: cutoff },
  })
    .select('trashOwner batchId trashType')
    .lean();

  let purgedBatches = 0;
  let deletedObjects = 0;

  for (const root of roots) {
    const filter = {
      trashOwner: root.trashOwner,
      batchId: root.batchId,
    };

    await (async () => {
      const items = await Trash.find(filter).lean();

      if (root.trashType === 'owned-item') {
        const files = items.filter(
          (item) => item.itemType === 'file' && item.key,
        );
        const keys = [...new Set(files.map((file) => file.key!))];

        for (const batch of chunks(keys, S3_DELETE_LIMIT)) {
          const result = await S3.send(
            new DeleteObjectsCommand({
              Bucket: env.BUCKET_NAME,
              Delete: {
                Objects: batch.map((Key) => ({ Key })),
                Quiet: true,
              },
            }),
          );
          if (result.Errors?.length)
            throw new Error(
              `S3 failed to delete ${result.Errors.length} object(s)`,
            );
        }

        const deleted = await Trash.deleteMany(filter);
        if (!deleted.deletedCount) return;

        const releasedByUser = new Map<string, number>();
        for (const file of files) {
          const userId = String(file.user);
          releasedByUser.set(
            userId,
            (releasedByUser.get(userId) || 0) + storedBytes(file.size),
          );
        }
        await Promise.all(
          [...releasedByUser].map(([userId, bytes]) =>
            releaseStorageForFile(userId, bytes),
          ),
        );
        deletedObjects += keys.length;
      } else {
        const deleted = await Trash.deleteMany(filter);
        if (!deleted.deletedCount) return;
      }

      purgedBatches += 1;
    })().catch((error) => {
      logger(
        'ERROR',
        `Failed to purge trash batch ${String(root.batchId)}`,
        error,
      );
    });
  }

  return { purgedBatches, deletedObjects };
};
