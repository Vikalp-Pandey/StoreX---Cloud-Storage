import { asyncHandler, sendResponse } from '@packages/httputils';
import { Context } from 'hono';
import { SharedItem as sharedItem } from '@/models/fileModels/sharedItem.model';
import { File as Files } from '@/models/fileModels/file.model';
import { Folder as Folders } from '@/models/fileModels/folder.model';
import User from '@/models/authModels/user.model';
import * as fileService from '@/services/fileServices/file.service';

export const shareItem = asyncHandler(async (c: Context) => {
  const senderId = c.get('user')?._id?.toString();
  const { email, fileId, folderId, permissions } = await c.req.json();

  if (!senderId) return sendResponse(c, 401, 'Authentication Required');
  if (!email) return sendResponse(c, 400, 'Recipient email is required');
  if (!fileId && !folderId)
    return sendResponse(c, 400, 'Target ID (file or folder) is required');

  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return sendResponse(c, 400, 'At least one permission is required');
  }

  const recipientUser = await User.findOne({ email });
  if (!recipientUser)
    return sendResponse(c, 404, 'User with this email not found');

  const recipientId = recipientUser._id.toString();
  if (recipientId === senderId)
    return sendResponse(c, 400, 'Cannot share items with yourself');

  if (fileId) {
    const file = await Files.findOne({ _id: fileId, user: senderId });
    if (!file)
      return sendResponse(c, 403, 'Access Denied: You do not own this file');
  }

  if (folderId) {
    const folder = await Folders.findOne({ _id: folderId, user: senderId });
    if (!folder)
      return sendResponse(c, 403, 'Access Denied: You do not own this folder');
  }

  // This filter prevents the E11000 error by finding the exact combination of user+item
  const shareFilter = {
    userId: recipientId,
    fileId: fileId || null,
    folderId: folderId || null,
  };

  try {
    const shareRecord = await sharedItem.findOneAndUpdate(
      shareFilter,
      {
        $set: { permissions },
        $setOnInsert: { sharedBy: senderId },
      },
      {
        upsert: true, // Create if not exists, Update if does
        runValidators: true,
      },
    );
    console.log(shareRecord);
  } catch (error) {
    console.log(error);
  }

  if (folderId) {
    await fileService.shareFolderRecursive(
      folderId,
      senderId,
      recipientId,
      permissions,
    );
  }

  return sendResponse(c, 200, 'Item shared successfully');
});

export const getSharedWithMe = asyncHandler(async (c: Context) => {
  const userId = c.get('user')?._id?.toString();

  if (!userId) {
    return sendResponse(c, 401, 'Authentication Required');
  }

  const shares = await sharedItem.find({ userId }).lean();

  const sharedFolderIds = shares
    .map((s) => s.folderId?.toString())
    .filter(Boolean)
    .filter((id): id is string => !!id);
  const sharedFileIds = shares
    .map((s) => s.fileId?.toString())
    .filter(Boolean)
    .filter((id): id is string => !!id);

  const [folders, files] = await Promise.all([
    Folders.find({ _id: { $in: sharedFolderIds } }).lean(),
    Files.find({ _id: { $in: sharedFileIds } }).lean(),
  ]);

  const rootFolders = folders.filter((folder) => {
    const parentId = folder.parent?.toString();
    return !parentId || !sharedFolderIds.includes(parentId);
  });

  const rootFiles = files.filter((file) => {
    const parentId = file.parent?.toString();
    return !parentId || !sharedFolderIds.includes(parentId);
  });

  const sharedByIds = shares.map((s) => s.sharedBy).filter(Boolean);
  const sharedByUsers = await User.find({ _id: { $in: sharedByIds } })
    .select('name email')
    .lean();

  const result = [];

  for (const folder of rootFolders) {
    const share = shares.find(
      (s) => s.folderId?.toString() === folder._id.toString(),
    );
    const owner = sharedByUsers.find(
      (u) => u._id.toString() === share?.sharedBy?.toString(),
    );

    const fullTree = await fileService.getSharedFolderRecursive(
      folder._id.toString(),
    );

    result.push({
      item: {
        ...folder,
        folders: fullTree.folders, // Nested sub-folders
        files: fullTree.files, // Nested sub-files
      },
      itemType: 'folder',
      permissions: share?.permissions || [],
      sharedBy: owner || null,
      isShared: true,
    });
  }

  for (const file of rootFiles) {
    const share = shares.find(
      (s) => s.fileId?.toString() === file._id.toString(),
    );
    const owner = sharedByUsers.find(
      (u) => u._id.toString() === share?.sharedBy?.toString(),
    );

    result.push({
      item: file,
      itemType: 'file',
      permissions: share?.permissions || [],
      sharedBy: owner || null,
      isShared: true,
    });
  }
  for (const element of result) {
    console.log(element.item);
  }

  return sendResponse(c, 200, 'Shared items retrieved successfully', result);
});

export const getSharesForItem = asyncHandler(async (c: Context) => {
  const userId = c.get('user')?._id?.toString();
  const { itemId } = c.req.param();
  const { itemType } = c.req.query(); // 'file' or 'folder'
  if (!userId) {
    return sendResponse(c, 401, 'Authentication Required');
  }
  const filter: any = {};
  if (itemType === 'file') {
    const file = await Files.findOne({ _id: itemId, user: userId });
    if (!file) {
      return sendResponse(c, 403, 'You can only view shares for items you own');
    }
    filter.fileId = itemId;
  } else {
    const folder = await Folders.findOne({ _id: itemId, user: userId });
    if (!folder) {
      return sendResponse(c, 403, 'You can only view shares for items you own');
    }
    filter.folderId = itemId;
  }
  const shares = await sharedItem.find(filter).lean();
  const enrichedShares = await Promise.all(
    shares.map(async (share) => {
      const recipient = await User.findById(share.userId)
        .select('name email')
        .lean();
      return {
        _id: share._id,
        recipient,
        permissions: share.permissions,
        sharedAt: (share as any).createdAt,
      };
    }),
  );
  return sendResponse(c, 200, 'Shares retrieved', enrichedShares);
});

export const searchUsers = asyncHandler(async (c: Context) => {
  const userId = c.get('user')?._id?.toString();
  const { q } = c.req.query();

  if (!userId) {
    return sendResponse(c, 401, 'Authentication Required');
  }

  if (!q || typeof q !== 'string' || q.trim().length < 1) {
    return sendResponse(c, 200, 'No results', []);
  }

  const searchRegex = new RegExp(q.trim(), 'i');

  const users = await User.find({
    _id: { $ne: userId }, // Exclude self
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

const shareController = {
  shareItem,
  getSharedWithMe,
  getSharesForItem,
  searchUsers,
};

export default shareController;

// Existing local controller export name.
export { shareItem as shareItems };
