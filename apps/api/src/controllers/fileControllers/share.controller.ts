import { asyncHandler, sendResponse } from '@packages/httputils';
import { Context } from 'hono';
import { DirectShare } from '@/models/fileModels/directShare.model';
import { File } from '@/models/fileModels/file.model';
import { Folder } from '@/models/fileModels/folder.model';
import User from '@/models/authModels/user.model';
import {
  isAllowed,
  replaceDirectPermissions,
  type Permission,
} from '@/services/fileServices/authorization.service';

const allowedPermissions = new Set<Permission>(['read', 'create', 'delete']);
const MAX_SHARED_TREE_DEPTH = 20;

type FolderTreeNode = Record<string, unknown> & {
  _id: unknown;
  folders?: FolderTreeNode[];
  files?: Record<string, unknown>[];
};

async function loadSharedFolderTree(
  folder: FolderTreeNode,
  depth = 1,
): Promise<FolderTreeNode> {
  if (depth >= MAX_SHARED_TREE_DEPTH) {
    return { ...folder, folders: [], files: [] };
  }

  const folderId = String(folder._id);
  const [childFolders, childFiles] = await Promise.all([
    Folder.find({ parent: folderId }).lean(),
    File.find({ parent: folderId }).lean(),
  ]);
  const folders = await Promise.all(
    childFolders.map((child) =>
      loadSharedFolderTree(child as unknown as FolderTreeNode, depth + 1),
    ),
  );

  return {
    ...folder,
    folders,
    files: childFiles as unknown as Record<string, unknown>[],
  };
}

export const shareItem = asyncHandler(async (c: Context) => {
  const senderId = c.get('user')?._id?.toString();
  const { email, fileId, folderId, permissions } = await c.req.json();

  if (!senderId) return sendResponse(c, 401, 'Authentication Required');
  if (!email) return sendResponse(c, 400, 'Recipient email is required');
  if (!fileId && !folderId)
    return sendResponse(c, 400, 'Target ID (file or folder) is required');
  if (fileId && folderId)
    return sendResponse(c, 400, 'Provide either fileId or folderId, not both');
  if (!Array.isArray(permissions) || permissions.length === 0)
    return sendResponse(c, 400, 'At least one permission is required');
  if (
    permissions.some(
      (permission: unknown) =>
        typeof permission !== 'string' ||
        !allowedPermissions.has(permission as Permission),
    )
  )
    return sendResponse(c, 400, 'Invalid permission');
  if (fileId && permissions.includes('create'))
    return sendResponse(
      c,
      400,
      'Create permission can only be granted on folders',
    );

  const type = folderId ? 'folder' : 'file';
  const id = String(folderId || fileId);
  const canShare = await isAllowed({
    userId: senderId,
    permission: 'share',
    type,
    id,
  });
  if (!canShare)
    return sendResponse(c, 403, 'Access Denied: share permission required');

  const recipient = await User.findOne({ email }).select('_id');
  if (!recipient) return sendResponse(c, 404, 'User with this email not found');

  const recipientId = String(recipient._id);
  const filter = { objectType: type, objectId: id, recipientId };
  const existing = await DirectShare.findOne(filter).lean();
  const previous = existing?.permissions || [];
  const next = [...new Set(permissions)];

  await replaceDirectPermissions({
    userId: recipientId,
    type,
    id,
    previous,
    next,
  });

  await DirectShare.findOneAndUpdate(
    filter,
    { $set: { permissions: next, sharedBy: senderId } },
    { upsert: true, runValidators: true, new: true },
  );

  return sendResponse(c, 200, 'Item shared successfully');
});

export const getSharedWithMe = asyncHandler(async (c: Context) => {
  const recipientId = c.get('user')?._id?.toString();
  if (!recipientId) return sendResponse(c, 401, 'Authentication Required');

  const shares = await DirectShare.find({ recipientId })
    .populate('sharedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const folderIds = shares
    .filter((share) => share.objectType === 'folder')
    .map((share) => share.objectId);
  const fileIds = shares
    .filter((share) => share.objectType === 'file')
    .map((share) => share.objectId);
  const [folders, files] = await Promise.all([
    Folder.find({ _id: { $in: folderIds } }).lean(),
    File.find({ _id: { $in: fileIds } }).lean(),
  ]);
  const folderTrees = await Promise.all(
    folders.map((folder) =>
      loadSharedFolderTree(folder as unknown as FolderTreeNode),
    ),
  );

  return sendResponse(c, 200, 'Shared items retrieved successfully', {
    shares,
    folders: folderTrees,
    files,
  });
});

export const getSharesForItem = asyncHandler(async (c: Context) => {
  const userId = c.get('user')?._id?.toString();
  const { itemId, itemType } = await c.req.json();
  const type = itemType === 'file' ? 'file' : 'folder';
  if (!userId) return sendResponse(c, 401, 'Authentication Required');

  const canShare = await isAllowed({
    userId,
    permission: 'share',
    type,
    id: itemId,
  });
  if (!canShare) return sendResponse(c, 403, 'Share permission required');

  const shares = await DirectShare.find({ objectType: type, objectId: itemId })
    .sort({ createdAt: -1 })
    .lean();
  const enrichedShares = await Promise.all(
    shares.map(async (share) => ({
      _id: share._id,
      recipient: await User.findById(share.recipientId)
        .select('name email')
        .lean(),
      permissions: share.permissions,
      sharedAt: share.createdAt,
    })),
  );

  return sendResponse(c, 200, 'Shares retrieved', enrichedShares);
});

export const searchUsers = asyncHandler(async (c: Context) => {
  const userId = c.get('user')?._id?.toString();
  const q = c.req.query('q');
  if (!userId) return sendResponse(c, 401, 'Authentication Required');
  if (!q?.trim()) return sendResponse(c, 200, 'No results', []);

  const searchRegex = new RegExp(q.trim(), 'i');
  const users = await User.find({
    _id: { $ne: userId },
    $or: [
      { name: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
    ],
  })
    .select('name email')
    .limit(10)
    .lean();

  return sendResponse(c, 200, 'Users found', users);
});

export { shareItem as shareItems };

export default { shareItem, getSharedWithMe, getSharesForItem, searchUsers };
