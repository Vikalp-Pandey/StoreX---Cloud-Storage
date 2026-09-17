import { Hono } from 'hono';
import fileController from '@/controllers/fileControllers/file.controller';
import {
  getSharedWithMe,
  getSharesForItem,
  inviteUser,
  searchUsers,
} from '@/controllers/fileControllers/share.controller';
import { authenticateUser, validateUser } from '@/middlewares/user.middleware';
import { requirePermission } from '@/middlewares/openfga.middleware';
import { asyncHandler } from '@packages/httputils';

const files = new Hono();
files.use('*', validateUser);

// Existing local aliases.
files.get(
  '/getAllItems',
  authenticateUser,
  asyncHandler(fileController.getAllItems),
);
files.get(
  '/storage',
  authenticateUser,
  asyncHandler(fileController.getStorage),
);
files.post(
  '/getItems',
  authenticateUser,
  requirePermission('read'),
  asyncHandler(fileController.getItems),
);
files.post(
  '/createFile',
  authenticateUser,
  requirePermission('create'),
  asyncHandler(fileController.createFile),
);
files.post(
  '/createFolder',
  authenticateUser,
  requirePermission('create'),
  asyncHandler(fileController.createFolder),
);
files.put(
  '/renameFolder',
  authenticateUser,
  asyncHandler(fileController.renameFolder),
);
files.delete(
  '/deleteFile',
  authenticateUser,
  requirePermission('delete'),
  asyncHandler(fileController.deleteFile),
);
files.delete(
  '/deleteFolder',
  authenticateUser,
  requirePermission('delete'),
  asyncHandler(fileController.deleteFolder),
);
files.post(
  '/shareItems',
  authenticateUser,
  asyncHandler(fileController.shareItems),
);

// Route names and middleware placement from the linked repository.
files.post(
  '/file-upload',
  authenticateUser,
  requirePermission('create'),
  asyncHandler(fileController.fileUpload),
);
files.post(
  '/save-file',
  authenticateUser,
  requirePermission('create'),
  asyncHandler(fileController.createFile),
);
files.post(
  '/save-folder',
  authenticateUser,
  requirePermission('create'),
  asyncHandler(fileController.saveFolder),
);
files.post(
  '/get-items',
  authenticateUser,
  requirePermission('read'),
  asyncHandler(fileController.getItems),
);
files.get(
  '/search',
  authenticateUser,
  asyncHandler(fileController.searchItems),
);
files.post('/share', authenticateUser, asyncHandler(fileController.shareItems));
files.get('/shared-with-me', authenticateUser, asyncHandler(getSharedWithMe));
files.get('/search-users', authenticateUser, asyncHandler(searchUsers));
files.post('/shares', authenticateUser, asyncHandler(getSharesForItem));
files.post('/invite', authenticateUser, asyncHandler(inviteUser));

files.get('/trash', authenticateUser, asyncHandler(fileController.getTrash));
files.post(
  '/trash/restore',
  authenticateUser,
  asyncHandler(fileController.restoreTrashItem),
);
files.get('/recent', authenticateUser, asyncHandler(fileController.getRecent));
files.post(
  '/recent/open',
  authenticateUser,
  requirePermission('read'),
  asyncHandler(fileController.recordRecent),
);

export default files;
