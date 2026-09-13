import type { Context, Next } from 'hono';
import { sendResponse } from '@packages/httputils';
import { isValidObjectId } from 'mongoose';
import { Folder } from '@/models/fileModels/folder.model';
import {
  isAllowed,
  writeResourceRelations,
  type Permission,
} from '@/services/fileServices/authorization.service';

// A route uses requirePermission(...).
// OpenFGA denies access to a folder.
// MongoDB confirms that folder belongs to the logged-in user.
// The missing OpenFGA owner and parent tuples are restored.
async function restoreOwnedFolderRelations(userId: string, folderId: string) {
  if (!isValidObjectId(folderId)) return false;

  const folder = (await Folder.findOne({ _id: folderId, user: userId })
    .select('parent')
    .lean()) as { parent?: unknown } | null;

  if (!folder) return false;

  await writeResourceRelations({
    userId,
    type: 'folder',
    id: folderId,
    parentType: folder.parent ? 'folder' : 'drive',
    parentId: folder.parent ? String(folder.parent) : userId,
  });

  return true;
}

export const requirePermission = (permission: Permission) => {
  return async (c: Context, next: Next) => {
    const userId = String(c.get('user')?._id || '');
    if (!userId) return sendResponse(c, 401, 'Authentication Required');

    const body = await c.req.json().catch(() => ({}));
    const folderId = body.parentFolder || body.folderId;
    const fileId = body.fileId;

    if (!folderId && !fileId) return next();

    const type = folderId ? 'folder' : 'file';
    const id = String(folderId || fileId);
    const allowed = await isAllowed({ userId, permission, type, id });
    if (!allowed) {
      // Backfill missing OpenFGA tuples only after MongoDB verifies ownership.
      if (
        type === 'folder' &&
        (await restoreOwnedFolderRelations(userId, id))
      ) {
        return next();
      }

      return sendResponse(
        c,
        403,
        `Access Denied: ${permission} permission required`,
      );
    }

    return next();
  };
};
