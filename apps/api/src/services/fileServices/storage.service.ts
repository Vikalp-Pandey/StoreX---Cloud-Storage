import type { ClientSession, Types } from 'mongoose';
import { Storage } from '@/models/fileModels/storage.model';

const FREE_STORAGE_LIMIT = '5GB';
const INITIAL_STORAGE_USED = '0MB';

export const ensureStorageForUser = async (
  userId: string | Types.ObjectId,
  session?: ClientSession,
) => {
  await Storage.updateOne(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
        limit: FREE_STORAGE_LIMIT,
        used: INITIAL_STORAGE_USED,
      },
    },
    { upsert: true, session },
  );
};
