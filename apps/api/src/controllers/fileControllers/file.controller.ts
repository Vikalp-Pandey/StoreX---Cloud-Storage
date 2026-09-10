import { Folder } from '@/models/fileModels/folder.model';
import { File } from '@/models/fileModels/file.model';
import { SharedItem } from '@/models/fileModels/sharedItem.model';
import { sendResponse } from '@packages/httputils';
import { Context } from 'hono';
import { isValidObjectId } from 'mongoose';
import { generateUploadUrl } from '@/services/fileServices/file.service';
import { shareItems } from './share.controller';

export const getAllItems = async (c: Context) => {
  const user = c.get('user');
  const items = await Promise.all([
    File.find({ user: user._id }),
    Folder.find({ user: user._id }),
  ]);
  return sendResponse(c, 200, 'Items fetched successfully!', items);
};
export const getItems = async (c: Context) => {
  const parent = c.req.query('parent');
  const user = c.get('user');
  const items = await Promise.all([
    File.find({ user: user._id, parent }),
    Folder.find({ user: user._id, parent }),
  ]);
  return sendResponse(c, 200, 'Items fetched successfully!', items);
};
export const fileUpload = async (c: Context) => {
  const userId = String(c.get('user')._id);
  const { fileName, fileType, parentFolder } = await c.req.json();
  const uniqueFileName = fileName + userId + parentFolder;
  const uploadUrlObject = await generateUploadUrl(uniqueFileName, fileType);
  return sendResponse(c, 200, 'Temp Url for file', uploadUrlObject);
};
export const createFile = async (c: Context) => {
  const { itemName, size, mimeType, key, fileUrl, parentFolder } =
    await c.req.json();
  const user = c.get('user');
  if (!itemName || !size || !mimeType || !key)
    return sendResponse(c, 400, 'Missing required fields');
  if (!key.startsWith('uploads/')) return sendResponse(c, 400, 'Invalid key');
  const existing = await File.find({ key, user: user._id });
  if (existing.length > 0)
    return sendResponse(c, 409, `${itemName} already exists.`);
  const file = await File.create({
    user: user._id,
    name: itemName,
    size: String(size),
    mimeType,
    key,
    url: fileUrl,
    parent: parentFolder,
  });
  return sendResponse(c, 201, 'File saved successfully', file);
};
export const createFolder = async (c: Context) => {
  const user = c.get('user');
  const parent = c.req.query('parentFolder');
  const name = c.req.query('name');
  const size = c.req.query('size');
  const folder = await Folder.create({ user: user._id, parent, name, size });
  return sendResponse(c, 200, 'Folder created successfully!', folder);
};
export const saveFolder = async (c: Context) => {
  const user = c.get('user');
  const { name, size, parentFolder } = await c.req.json();
  const folder = await Folder.create({
    user: user._id,
    name,
    size,
    parent: parentFolder,
  });
  return sendResponse(c, 200, 'Folder saved successfully', folder);
};
export const getSharedItems = async (c: Context) => {
  const parentFolder = c.req.query('parentFolder');
  const userId = String(c.get('user')._id);
  const filter: Record<string, unknown> = { parent: parentFolder || null };
  if (parentFolder) {
    const ownsFolder = await Folder.findOne({
      _id: parentFolder,
      user: userId,
    });
    const hasSharedAccess = await SharedItem.findOne({
      folderId: parentFolder,
      userId,
    });
    if (!ownsFolder && !hasSharedAccess)
      return sendResponse(c, 403, 'Access denied to this folder');
  } else {
    filter.user = userId;
  }
  const [files, folders] = await Promise.all([
    File.find(filter).sort({ createdAt: -1 }).lean(),
    Folder.find(filter).sort({ createdAt: -1 }).lean(),
  ]);
  return sendResponse(c, 200, 'Items retrieved successfully', [
    ...files,
    ...folders,
  ]);
};
export const renameFolder = async (c: Context) => {
  const user = c.get('user');
  const folderId = c.req.query('_id');
  const name = c.req.query('name')?.trim();
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
export const deleteFile = async (c: Context) => {
  const user = c.get('user');
  const fileId = c.req.query('fileId');
  const file = await File.findOne({ user: user._id, id: fileId });
  await File.deleteOne({ user: user._id, id: fileId });
};
export const deleteFolder = async (c: Context) => {
  const user = c.get('user');
  const folderId = c.req.query('folderId');
  const folder = await Folder.findOne({ user: user._id, id: folderId });
  await File.deleteMany({ user: user._id, parent: folderId });
  await Folder.deleteMany({ user: user._id, parent: folderId });
};
export default {
  getAllItems,
  getItems,
  fileUpload,
  createFile,
  createFolder,
  saveFolder,
  getSharedItems,
  renameFolder,
  deleteFile,
  deleteFolder,
  shareItems,
};
