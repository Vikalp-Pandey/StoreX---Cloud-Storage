import type { ClientSession, Types } from 'mongoose';
import { File } from '@/models/fileModels/file.model';
import { Trash } from '@/models/fileModels/trash.model';
import { Subscription } from '@/models/billingModels/subscription.model';
import {
  FREE_STORAGE_LIMIT,
  INITIAL_STORAGE_USED,
  Storage,
} from '@/models/fileModels/storage.model';

type SizedItem = { size: string; mimeType?: string };

const sizeInBytes = (size: string) => {
  const bytes = Number(size);
  return Number.isSafeInteger(bytes) && bytes > 0 ? bytes : 0;
};

const readStoredFiles = async (userId: string | Types.ObjectId) => {
  const [files, trashedFiles] = await Promise.all([
    File.find({ user: String(userId) })
      .select('size mimeType')
      .lean(),
    Trash.find({
      user: userId,
      trashType: 'owned-item',
      itemType: 'file',
    })
      .select('size mimeType')
      .lean(),
  ]);
  return [...files, ...trashedFiles] as SizedItem[];
};

/** Create the free allocation once; never reset an existing user's quota or usage. */
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
        usageInitialized: false,
      },
    },
    { upsert: true, session },
  );
};

/** Backfill accounts created before usage tracking, including files in Trash. */
export const initializeStorageUsage = async (
  userId: string | Types.ObjectId,
) => {
  await ensureStorageForUser(userId);
  const storage = await Storage.findOne({ user: userId }).lean();
  if (storage?.usageInitialized) return;

  const files = await readStoredFiles(userId);
  const used = files.reduce((sum, file) => sum + sizeInBytes(file.size), 0);
  await Storage.updateOne(
    { user: userId, usageInitialized: { $ne: true } },
    { $set: { used, usageInitialized: true } },
  );
};

const limitToBytes = (limit: string) => {
  const match = /^(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)$/i.exec(limit);
  const multiplier = { KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
  return match
    ? Number(match[1]) *
        multiplier[match[2].toUpperCase() as keyof typeof multiplier]
    : 0;
};

/** Atomically reserve space so concurrent file saves cannot exceed the plan limit. */
export const reserveStorageForFile = async (
  userId: string | Types.ObjectId,
  bytes: number,
) => {
  await initializeStorageUsage(userId);
  const storage = await Storage.findOne({ user: userId }).lean();
  if (!storage) throw new Error('Storage allocation not found');

  const limitBytes = limitToBytes(storage.limit);
  if (bytes > limitBytes) return false;

  const updated = await Storage.findOneAndUpdate(
    {
      user: userId,
      limit: storage.limit,
      used: { $lte: limitBytes - bytes },
    },
    { $inc: { used: bytes } },
    { new: true },
  ).lean();
  return Boolean(updated);
};

export const releaseStorageForFile = async (
  userId: string | Types.ObjectId,
  bytes: number,
) => {
  await Storage.updateOne({ user: userId }, { $inc: { used: -bytes } });
};

export const getStorageForUser = async (userId: string | Types.ObjectId) => {
  await initializeStorageUsage(userId);
  const [storage, files, subscription] = await Promise.all([
    Storage.findOne({ user: userId }).lean(),
    readStoredFiles(userId),
    Subscription.findOne({ user: userId }).select('plan status').lean(),
  ]);
  if (!storage) throw new Error('Storage allocation not found');

  const breakdown = { documents: 0, media: 0, other: 0 };
  for (const file of files) {
    const type = file.mimeType || '';
    const category = /^(image|video|audio)\//.test(type)
      ? 'media'
      : /^(text\/|application\/(pdf|msword|vnd\.|rtf|json|xml))/.test(type)
        ? 'documents'
        : 'other';
    breakdown[category] += sizeInBytes(file.size);
  }

  const limitBytes = limitToBytes(storage.limit);

  return {
    usedBytes: Number(storage.used) || 0,
    limit: storage.limit,
    limitBytes,
    plan: subscription?.status === 'active' ? subscription.plan : 'free',
    breakdown,
  };
};
