import { Hono } from 'hono';
import fileController from '@/controllers/fileControllers/file.controller';
import {
  getSharedWithMe,
  getSharesForItem,
  searchUsers,
} from '@/controllers/fileControllers/share.controller';
import { authenticateUser, validateUser } from '@/middlewares/user.middleware';
import { requirePermission } from '@/middlewares/openfga.middleware';

const files = new Hono();
files.use('*', validateUser);

// Existing local aliases.
files.get('/getAllItems', authenticateUser, fileController.getAllItems);
files.post(
  '/getItems',
  authenticateUser,
  requirePermission('read'),
  fileController.getItems,
);
files.post(
  '/createFile',
  authenticateUser,
  requirePermission('create'),
  fileController.createFile,
);
files.post(
  '/createFolder',
  authenticateUser,
  requirePermission('create'),
  fileController.createFolder,
);
files.put('/renameFolder', authenticateUser, fileController.renameFolder);
files.delete(
  '/deleteFile',
  authenticateUser,
  requirePermission('delete'),
  fileController.deleteFile,
);
files.delete(
  '/deleteFolder',
  authenticateUser,
  requirePermission('delete'),
  fileController.deleteFolder,
);
files.post('/shareItems', authenticateUser, fileController.shareItems);

// Route names and middleware placement from the linked repository.
files.post(
  '/file-upload',
  authenticateUser,
  requirePermission('create'),
  fileController.fileUpload,
);
files.post(
  '/save-file',
  authenticateUser,
  requirePermission('create'),
  fileController.createFile,
);
files.post(
  '/save-folder',
  authenticateUser,
  requirePermission('create'),
  fileController.saveFolder,
);
files.post(
  '/get-items',
  authenticateUser,
  requirePermission('read'),
  fileController.getItems,
);
files.get('/search', authenticateUser, fileController.searchItems);
files.post('/share', authenticateUser, fileController.shareItems);
files.get('/shared-with-me', authenticateUser, getSharedWithMe);
files.get('/search-users', authenticateUser, searchUsers);
files.post('/shares', authenticateUser, getSharesForItem);

files.get('/trash', authenticateUser, fileController.getTrash);
files.post('/trash/restore', authenticateUser, fileController.restoreTrashItem);
files.get('/recent', authenticateUser, fileController.getRecent);
files.post(
  '/recent/open',
  authenticateUser,
  requirePermission('read'),
  fileController.recordRecent,
);

export default files;
