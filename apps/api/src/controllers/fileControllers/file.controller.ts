import { Folder } from '@/models/fileModels/folder.model';
import { File } from '@/models/fileModels/file.model';
import { sendResponse } from '@packages/httputils';
import { Context } from 'hono';
import { isValidObjectId, Types } from 'mongoose';
import {
  generatePublicFileUrl,
  generateUploadUrl,
} from '@/services/fileServices/file.service';
import { shareItems } from './share.controller';
import {
  isAllowed,
  replaceDirectPermissions,
  writeResourceRelations,
} from '@/services/fileServices/authorization.service';
import { DirectShare } from '@/models/fileModels/directShare.model';
import { Trash } from '@/models/fileModels/trash.model';
import { Recent } from '@/models/fileModels/recent.model';

export const MAX_NESTING_DEPTH = 20;

async function getFolderDepth(folderId: unknown) {
  if (typeof folderId !== 'string' || !isValidObjectId(folderId)) return null;

  let currentFolderId: string | null = folderId;
  let depth = 0;
  const visited = new Set<string>();

  while (currentFolderId) {
    if (visited.has(currentFolderId)) return null;
    if (depth >= MAX_NESTING_DEPTH) return MAX_NESTING_DEPTH;

    visited.add(currentFolderId);
    const folder = (await Folder.findById(currentFolderId)
      .select('parent')
      .lean()) as { parent?: unknown } | null;
    if (!folder) return null;

    depth += 1;
    currentFolderId = folder.parent ? String(folder.parent) : null;
  }

  return depth;
}

async function validateChildLocation(c: Context, parentFolder: unknown) {
  if (!parentFolder) return null;

  const parentDepth = await getFolderDepth(parentFolder);

  if (parentDepth === null) {
    return sendResponse(c, 400, 'Parent folder does not exist.');
  }

  if (parentDepth >= MAX_NESTING_DEPTH) {
    return sendResponse(
      c,
      400,
      `Items cannot be nested beyond ${MAX_NESTING_DEPTH} levels.`,
    );
  }

  return null;
}

export const getAllItems = async (c: Context) => {
  const user = c.get('user');
  const items = await Promise.all([
    File.find({ user: user._id }),
    Folder.find({ user: user._id }),
  ]);
  return sendResponse(c, 200, 'Items fetched successfully!', items);
};

export const getItems = async (c: Context) => {
  const {
    parentFolder,
    page: requestedPage,
    limit: requestedLimit,
  } = await c.req.json();
  const page = Math.max(Number(requestedPage || 1), 1);
  const limit = Math.min(Math.max(Number(requestedLimit || 50), 1), 100);

  const filter = { parent: parentFolder || null };
  const offset = (page - 1) * limit;

  const [files, folders] = await Promise.all([
    File.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    Folder.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
  ]);

  return sendResponse(c, 200, 'Items retrieved successfully', {
    files,
    folders,
    page,
  });
};

export const searchItems = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const query = c.req.query('q')?.trim();

  if (!query) return sendResponse(c, 200, 'Search results retrieved.', []);

  const escapedQuery = query.replace(/[.*+?^$()[\]{}|\\]/g, '\\$&');
  const name = { $regex: new RegExp(escapedQuery, 'i') };
  const [files, folders] = await Promise.all([
    File.find({ name }).limit(50).lean(),
    Folder.find({ name }).limit(50).lean(),
  ]);
  const candidates = [
    ...folders.map((item) => ({ itemType: 'folder' as const, item })),
    ...files.map((item) => ({ itemType: 'file' as const, item })),
  ];
  const readable = await Promise.all(
    candidates.map(async (result) => {
      if (String(result.item.user) === userId) return result;
      return (await isAllowed({
        userId,
        permission: 'read',
        type: result.itemType,
        id: String(result.item._id),
      }))
        ? result
        : null;
    }),
  );

  return sendResponse(
    c,
    200,
    'Search results retrieved.',
    readable.filter((result) => result !== null).slice(0, 20),
  );
};
export const fileUpload = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const { fileName, fileType, parentFolder } = await c.req.json();
  const locationError = await validateChildLocation(c, parentFolder);
  if (locationError) return locationError;

  const result = await generateUploadUrl(
    fileName + userId + parentFolder,
    fileType,
  );

  return sendResponse(c, 200, 'Temp Url for file', result);
};
export const createFile = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const { itemName, size, mimeType, key, parentFolder } = await c.req.json();

  if (!itemName || !size || !mimeType || !key) {
    return sendResponse(c, 400, 'Missing required fields');
  }

  if (!key.startsWith('uploads/')) {
    return sendResponse(c, 400, 'Invalid key');
  }
  const locationError = await validateChildLocation(c, parentFolder);
  if (locationError) return locationError;

  const file = await File.create({
    user: userId,
    name: itemName,
    size: String(size),
    mimeType,
    key,
    url: generatePublicFileUrl(key),
    parent: parentFolder || null,
  });
  await writeResourceRelations({
    userId,
    type: 'file',
    id: String(file._id),
    parentType: parentFolder ? 'folder' : 'drive',
    parentId: parentFolder || userId,
  });

  return sendResponse(c, 201, 'File saved successfully', file);
};
export const createFolder = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const { parentFolder, name, size } = await c.req.json();
  const locationError = await validateChildLocation(c, parentFolder);
  if (locationError) return locationError;

  const folder = await Folder.create({
    user: userId,
    parent: parentFolder || null,
    name,
    size,
  });
  await writeResourceRelations({
    userId,
    type: 'folder',
    id: String(folder._id),
    parentType: parentFolder ? 'folder' : 'drive',
    parentId: String(parentFolder || userId),
  });
  return sendResponse(c, 200, 'Folder created successfully!', folder);
};
export const saveFolder = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const { name, size, parentFolder } = await c.req.json();
  const locationError = await validateChildLocation(c, parentFolder);
  if (locationError) return locationError;

  const folder = await Folder.create({
    user: userId,
    name,
    size,
    parent: parentFolder || null,
  });
  await writeResourceRelations({
    userId,
    type: 'folder',
    id: String(folder._id),
    parentType: parentFolder ? 'folder' : 'drive',
    parentId: parentFolder || userId,
  });

  return sendResponse(c, 201, 'Folder saved successfully', folder);
};
export const renameFolder = async (c: Context) => {
  const user = c.get('user');
  const { folderId, name: requestedName } = await c.req.json();
  const name = typeof requestedName === 'string' ? requestedName.trim() : '';
  if (!folderId || !isValidObjectId(folderId) || !name)
    return sendResponse(c, 400, 'A valid folder id and name are required.');
  const folder = await Folder.findOneAndUpdate(
    { _id: folderId, user: user._id },
    { $set: { name } },
    { new: true },
  );
  if (!folder) return sendResponse(c, 404, 'Folder not found.');
  return sendResponse(c, 200, 'Folder renamed successfully!', folder);
};

async function trashSharedAccess(
  c: Context,
  itemType: 'file' | 'folder',
  item: {
    _id: Types.ObjectId;
    user?: string | Types.ObjectId;
    organization?: string | Types.ObjectId;
    parent?: string | Types.ObjectId | null;
    name: string;
    size: string;
    key?: string;
    url?: string;
    mimeType?: string;
  },
) {
  const userId = String(c.get('user')._id);
  if (!item.user || String(item.user) === userId) return false;

  const share = await DirectShare.findOne({
    objectType: itemType,
    objectId: String(item._id),
    recipientId: userId,
  }).lean();
  if (!share) return false;

  await Trash.create({
    user: item.user,
    trashOwner: userId,
    originalId: item._id,
    batchId: new Types.ObjectId(),
    trashType: 'shared-access',
    itemType,
    isRoot: true,
    organization: item.organization,
    parent: item.parent || null,
    name: item.name,
    size: item.size,
    key: item.key,
    url: item.url,
    mimeType: item.mimeType,
    shares: [
      {
        recipientId: share.recipientId,
        sharedBy: share.sharedBy,
        permissions: share.permissions,
      },
    ],
  });
  await replaceDirectPermissions({
    userId,
    type: itemType,
    id: String(item._id),
    previous: share.permissions,
    next: [],
  });
  await DirectShare.deleteOne({ _id: share._id });
  return true;
}

export const deleteFile = async (c: Context) => {
  const { fileId } = await c.req.json();
  if (!fileId || !isValidObjectId(fileId))
    return sendResponse(c, 400, 'A valid file id is required.');

  const file = await File.findById(fileId).lean();
  if (!file) return sendResponse(c, 404, 'File not found.');
  if (await trashSharedAccess(c, 'file', file))
    return sendResponse(c, 200, 'Shared access moved to trash.');

  const shares = await DirectShare.find({
    objectType: 'file',
    objectId: fileId,
  }).lean();
  await Trash.create({
    user: file.user,
    trashOwner: file.user,
    originalId: file._id,
    batchId: new Types.ObjectId(),
    trashType: 'owned-item',
    itemType: 'file',
    isRoot: true,
    organization: file.organization,
    parent: file.parent || null,
    name: file.name,
    size: file.size,
    key: file.key,
    url: file.url,
    mimeType: file.mimeType,
    shares: shares.map((share) => ({
      recipientId: share.recipientId,
      sharedBy: share.sharedBy,
      permissions: share.permissions,
    })),
  });
  await Promise.all([
    File.deleteOne({ _id: fileId }),
    DirectShare.deleteMany({ objectType: 'file', objectId: fileId }),
  ]);

  return sendResponse(c, 200, 'File moved to trash.');
};
export const deleteFolder = async (c: Context) => {
  const { folderId } = await c.req.json();
  if (!folderId || !isValidObjectId(folderId))
    return sendResponse(c, 400, 'A valid folder id is required.');

  const folder = await Folder.findById(folderId).lean();
  if (!folder) return sendResponse(c, 404, 'Folder not found.');
  if (await trashSharedAccess(c, 'folder', folder))
    return sendResponse(c, 200, 'Shared access moved to trash.');

  const folders = [folder];
  const folderIds = new Set([folderId]);
  let parentIds = [folderId];
  while (parentIds.length) {
    const children = await Folder.find({
      parent: { $in: parentIds },
    }).lean();
    parentIds = [];
    for (const child of children) {
      const id = String(child._id);
      if (folderIds.has(id)) continue;
      folderIds.add(id);
      parentIds.push(id);
      folders.push(child);
    }
  }
  const files = await File.find({
    parent: { $in: [...folderIds] },
  }).lean();
  const objectIds = [...folderIds, ...files.map((item) => String(item._id))];
  const shares = await DirectShare.find({
    objectId: { $in: objectIds },
  }).lean();

  const batchId = new Types.ObjectId();
  await Trash.insertMany([
    ...folders.map((item) => ({
      user: item.user,
      trashOwner: folder.user,
      originalId: item._id,
      batchId,
      trashType: 'owned-item' as const,
      itemType: 'folder' as const,
      isRoot: String(item._id) === folderId,
      organization: item.organization,
      parent: item.parent || null,
      name: item.name,
      size: item.size,
      shares: shares
        .filter((share) => share.objectId === String(item._id))
        .map((share) => ({
          recipientId: share.recipientId,
          sharedBy: share.sharedBy,
          permissions: share.permissions,
        })),
    })),
    ...files.map((item) => ({
      user: item.user,
      trashOwner: folder.user,
      originalId: item._id,
      batchId,
      trashType: 'owned-item' as const,
      itemType: 'file' as const,
      isRoot: false,
      organization: item.organization,
      parent: item.parent || null,
      name: item.name,
      size: item.size,
      key: item.key,
      url: item.url,
      mimeType: item.mimeType,
      shares: shares
        .filter((share) => share.objectId === String(item._id))
        .map((share) => ({
          recipientId: share.recipientId,
          sharedBy: share.sharedBy,
          permissions: share.permissions,
        })),
    })),
  ]);
  await Promise.all([
    File.deleteMany({ _id: { $in: files.map((item) => item._id) } }),
    Folder.deleteMany({ _id: { $in: [...folderIds] } }),
    DirectShare.deleteMany({ objectId: { $in: objectIds } }),
  ]);

  return sendResponse(c, 200, 'Folder moved to trash.');
};

export const getTrash = async (c: Context) => {
  const items = await Trash.find({
    trashOwner: c.get('user')._id,
    isRoot: true,
  })
    .select('trashType itemType name deletedAt')
    .sort({ deletedAt: -1 });
  return sendResponse(c, 200, 'Trash retrieved successfully.', items);
};

export const restoreTrashItem = async (c: Context) => {
  const user = c.get('user');
  const { trashId } = await c.req.json();
  if (!trashId || !isValidObjectId(trashId))
    return sendResponse(c, 400, 'A valid trash id is required.');

  const root = await Trash.findOne({
    _id: trashId,
    trashOwner: user._id,
    isRoot: true,
  }).lean();
  if (!root) return sendResponse(c, 404, 'Trash item not found.');

  if (root.trashType === 'shared-access') {
    const share = root.shares[0];
    const resource =
      root.itemType === 'file'
        ? await File.exists({ _id: root.originalId })
        : await Folder.exists({ _id: root.originalId });
    if (!resource || !share)
      return sendResponse(c, 404, 'Shared item no longer exists.');

    await replaceDirectPermissions({
      userId: String(share.recipientId),
      type: root.itemType,
      id: String(root.originalId),
      previous: [],
      next: share.permissions,
    });
    await DirectShare.findOneAndUpdate(
      {
        objectType: root.itemType,
        objectId: String(root.originalId),
        recipientId: share.recipientId,
      },
      {
        $set: {
          sharedBy: share.sharedBy,
          permissions: share.permissions,
        },
      },
      { upsert: true, new: true },
    );
    await Trash.deleteMany({
      trashOwner: user._id,
      batchId: root.batchId,
    });
    return sendResponse(c, 200, 'Shared access restored successfully.');
  }

  const items = await Trash.find({
    trashOwner: user._id,
    batchId: root.batchId,
  }).lean();
  const folders = items
    .filter((item) => item.itemType === 'folder')
    .map((item) => ({
      _id: item.originalId,
      user: item.user,
      organization: item.organization,
      parent: item.parent || null,
      name: item.name,
      size: item.size,
    }));
  const files = items
    .filter((item) => item.itemType === 'file')
    .map((item) => ({
      _id: item.originalId,
      user: item.user,
      organization: item.organization,
      parent: item.parent || null,
      name: item.name,
      size: item.size,
      key: item.key!,
      url: item.url,
      mimeType: item.mimeType,
    }));
  const shares = items.flatMap((item) =>
    item.shares.map((share) => ({
      objectType: item.itemType,
      objectId: String(item.originalId),
      recipientId: share.recipientId,
      sharedBy: share.sharedBy,
      permissions: share.permissions,
    })),
  );

  if (folders.length) await Folder.insertMany(folders);
  if (files.length) await File.insertMany(files);
  if (shares.length) await DirectShare.insertMany(shares);
  await Trash.deleteMany({
    trashOwner: user._id,
    batchId: root.batchId,
  });

  return sendResponse(c, 200, 'Item restored successfully.');
};

export const recordRecent = async (c: Context) => {
  const userId = c.get('user')._id;
  const { fileId, folderId } = await c.req.json();
  if ((!fileId && !folderId) || (fileId && folderId))
    return sendResponse(c, 400, 'Provide one file or folder id.');

  await Recent.findOneAndUpdate(
    {
      user: userId,
      itemType: folderId ? 'folder' : 'file',
      itemId: folderId || fileId,
    },
    { $set: { openedAt: new Date() } },
    { upsert: true, new: true },
  );
  return sendResponse(c, 200, 'Recent activity recorded.');
};

export const getRecent = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const activities = await Recent.find({ user: userId })
    .sort({ openedAt: -1 })
    .limit(100)
    .lean();
  const items = (
    await Promise.all(
      activities.map(async (activity) => {
        const id = String(activity.itemId);
        const allowed = await isAllowed({
          userId,
          permission: 'read',
          type: activity.itemType,
          id,
        });
        if (!allowed) return null;

        const item =
          activity.itemType === 'file'
            ? await File.findById(id).lean()
            : await Folder.findById(id).lean();
        return item
          ? {
              _id: activity._id,
              itemType: activity.itemType,
              openedAt: activity.openedAt,
              item,
            }
          : null;
      }),
    )
  ).filter((item) => item !== null);

  return sendResponse(c, 200, 'Recent items retrieved successfully.', items);
};

export default {
  getAllItems,
  getItems,
  searchItems,
  fileUpload,
  createFile,
  createFolder,
  saveFolder,
  renameFolder,
  deleteFile,
  deleteFolder,
  getTrash,
  restoreTrashItem,
  recordRecent,
  getRecent,
  shareItems,
};
