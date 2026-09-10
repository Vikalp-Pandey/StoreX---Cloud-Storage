import { Hono } from 'hono';
import fileController from '@/controllers/fileControllers/file.controller';
import {
  getSharedWithMe,
  getSharesForItem,
  searchUsers,
} from '@/controllers/fileControllers/share.controller';
import { authenticateUser, validateUser } from '@/middlewares/user.middleware';
import { validatePermissions } from '@/middlewares/fileaccess.middleware';

const files = new Hono();
files.use('*', validateUser);

// Existing local aliases.
files.get('/getAllItems', authenticateUser, fileController.getAllItems);
files.get('/getItems', authenticateUser, fileController.getItems);
files.post(
  '/createFile',
  authenticateUser,
  validatePermissions('create'),
  fileController.createFile,
);
files.post(
  '/createFolder',
  authenticateUser,
  validatePermissions('create'),
  fileController.createFolder,
);
files.put('/renameFolder', authenticateUser, fileController.renameFolder);
files.delete(
  '/deleteFile',
  authenticateUser,
  validatePermissions('delete'),
  fileController.deleteFile,
);
files.delete(
  '/deleteFolder',
  authenticateUser,
  validatePermissions('delete'),
  fileController.deleteFolder,
);
files.post('/shareItems', authenticateUser, fileController.shareItems);

// Route names and middleware placement from the linked repository.
files.post('/file-upload',
  authenticateUser,
  validatePermissions('create'),
  fileController.fileUpload);
files.post(
  '/save-file',
  authenticateUser,
  validatePermissions('create'),
  fileController.createFile,
);
files.post(
  '/save-folder',
  authenticateUser,
  validatePermissions('create'),
  fileController.saveFolder,
);
files.get('/get-items', authenticateUser, fileController.getSharedItems);



files.post('/share', authenticateUser, fileController.shareItems);
files.get('/shared-with-me', authenticateUser, getSharedWithMe);
files.get('/search-users', authenticateUser, searchUsers);
files.get('/shares/:itemId', authenticateUser, getSharesForItem);

export default files;
