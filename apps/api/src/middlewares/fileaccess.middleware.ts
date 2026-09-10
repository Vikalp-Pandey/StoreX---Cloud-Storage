import type { Context, Next } from 'hono';
import { File } from '@/models/fileModels/file.model';
import { Folder } from '@/models/fileModels/folder.model';
import { SharedItem } from '@/models/fileModels/sharedItem.model';
import { sendResponse } from '@packages/httputils';

const findAncestorShare = async (folderId: string, userId: string) => {
  let currentFolderId: string | null = folderId;
  const visited = new Set<string>();
  while (currentFolderId) {
    if (visited.has(currentFolderId)) break;
    visited.add(currentFolderId);
    const shareRecord = await SharedItem.findOne({
      userId,
      folderId: currentFolderId,
    });
    if (shareRecord) return shareRecord;
    const folder: { parent?: unknown } | null =
      await Folder.findById(currentFolderId);
    if (!folder || !folder.parent) break;
    currentFolderId = String(folder.parent);
  }
  return null;
};

export const validatePermissions = (
  requiredPermission: 'read' | 'create' | 'delete',
) => {
  return async (c: Context, next: Next) => {
    const userId = String(c.get('user')?._id || '');
    if (!userId) return sendResponse(c, 401, 'Authentication Required');
    const body = c.req.header('Content-Type')?.includes('application/json')
      ? await c.req.json()
      : {};
    const targetFolderId =
      c.req.query('parentFolder') ||
      body.parentFolder ||
      c.req.query('folderId') ||
      body.folderId;
    const targetFileId = c.req.query('fileId') || body.fileId;
    if (!targetFolderId && !targetFileId) return next();

    const ownedResource = targetFolderId
      ? await Folder.findOne({ _id: targetFolderId, user: userId })
      : await File.findOne({ _id: targetFileId, user: userId });
    if (ownedResource) return next();

    const directShareFilter: Record<string, unknown> = { userId };
    if (targetFolderId) directShareFilter.folderId = targetFolderId;
    else directShareFilter.fileId = targetFileId;
    const directShare = await SharedItem.findOne(directShareFilter);
    if (directShare) {
      if (!directShare.permissions.includes(requiredPermission)) {
        return sendResponse(
          c,
          403,
          `Access Denied: ${requiredPermission} permission required`,
        );
      }
      return next();
    }

    let ancestorShare = null;
    if (targetFolderId) {
      const folder = await Folder.findById(String(targetFolderId));
      if (folder?.parent)
        ancestorShare = await findAncestorShare(String(folder.parent), userId);
    } else if (targetFileId) {
      const file = await File.findById(String(targetFileId));
      if (file?.parent)
        ancestorShare = await findAncestorShare(String(file.parent), userId);
    }
    if (ancestorShare) {
      if (!ancestorShare.permissions.includes(requiredPermission)) {
        return sendResponse(
          c,
          403,
          `Access Denied: ${requiredPermission} permission required`,
        );
      }
      return next();
    }
    return sendResponse(
      c,
      403,
      'Access Denied: No shared access to this resource',
    );
  };
};
