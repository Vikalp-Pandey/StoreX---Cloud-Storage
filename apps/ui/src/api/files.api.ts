import axios from 'axios';
import { api } from '@/lib/axios';
import {
  abortUploadApi,
  completeUploadApi,
  getPresignedPartUrlApi,
  startUploadApi,
  uploadPartToS3,
  type PartETag,
} from '@/api/multipart-upload.api';

export interface StoredFile {
  _id: string;
  organization?: string;
  user?: string;
  name: string;
  size: string;
  parent?: string | null;
  permissions?: Permission[];
  sharedBy?: SharedBy | null;
  isShared?: boolean;
  key: string;
  url: string;
}

export interface StoredFolder {
  permissions?: Permission[];
  _id: string;
  organization?: string;
  user?: string;
  name: string;
  size: string;
  parent?: string | null;
  sharedBy?: SharedBy | null;
  isShared?: boolean;
}

export type StoredItems = [StoredFile[], StoredFolder[]];

export interface StorageUsage {
  plan: 'free' | 'pro' | 'ultra';
  usedBytes: number;
  limit: string;
  limitBytes: number;
  breakdown: { documents: number; media: number; other: number };
}

export interface PaginatedItems {
  files: StoredFile[];
  folders: StoredFolder[];
  page: number;
}

export interface TrashItem {
  _id: string;
  trashType: 'owned-item' | 'shared-access';
  itemType: 'file' | 'folder';
  name: string;
  deletedAt: string;
}

export interface RecentItem {
  _id: string;
  itemType: 'file' | 'folder';
  openedAt: string;
  item: StoredFile | StoredFolder;
}

export interface SearchItem {
  itemType: 'file' | 'folder';
  item: StoredFile | StoredFolder;
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  detail?: string;
  data: T;
}

export interface CreateFileInput {
  itemName: string;
  size: number;
  mimeType: string;
  key: string;
  parentFolder?: string;
}

export interface CreateFolderInput {
  parent?: string;
  name: string;
  size: string;
}

export interface RenameFolderInput {
  _id: string;
  name: string;
}

const MEBIBYTE = 1024 ** 2;
const MAX_SINGLE_UPLOAD_BYTES = 5 * 1024 ** 3;
const MULTIPART_PART_BYTES = 64 * MEBIBYTE;
const MAX_MULTIPART_PARTS = 10_000;

async function uploadMultipartFile(
  file: File,
  onProgress?: (percent: number) => void,
) {
  const { uploadId, key } = await startUploadApi(
    file.name,
    file.type || 'application/octet-stream',
  );
  if (!uploadId || !key) {
    throw new Error('Failed to initialize multipart upload.');
  }

  const partSize = Math.max(
    MULTIPART_PART_BYTES,
    Math.ceil(file.size / MAX_MULTIPART_PARTS / MEBIBYTE) * MEBIBYTE,
  );
  const parts: PartETag[] = [];
  let uploadedBytes = 0;

  try {
    for (let start = 0; start < file.size; start += partSize) {
      const partNumber = parts.length + 1;
      const chunk = file.slice(start, Math.min(start + partSize, file.size));
      const presignedUrl = await getPresignedPartUrlApi(
        key,
        uploadId,
        partNumber,
      );
      const etag = await uploadPartToS3(presignedUrl, chunk, (partBytes) => {
        const percent = Math.round(
          ((uploadedBytes + Math.min(partBytes, chunk.size)) / file.size) * 100,
        );
        onProgress?.(Math.min(percent, 99));
      });
      if (!etag) {
        throw new Error('S3 did not return an ETag for an uploaded part.');
      }
      parts.push({ ETag: etag, PartNumber: partNumber });
      uploadedBytes += chunk.size;
    }

    await completeUploadApi(key, uploadId, parts);
  } catch (error) {
    try {
      await abortUploadApi(key, uploadId);
    } catch {
      // Preserve the original upload failure.
    }
    throw error;
  }

  onProgress?.(100);
  return key;
}

export const filesApi = {
  getStorage: async () => {
    const response = await api.get<ApiResponse<StorageUsage>>('/files/storage');
    return response.data.data;
  },

  getAllItems: async () => {
    const response =
      await api.get<ApiResponse<StoredItems>>('/files/getAllItems');
    return response.data.data;
  },

  getItems: async (parent?: string) => {
    const response = await api.post<ApiResponse<PaginatedItems>>(
      '/files/get-items',
      { parentFolder: parent },
    );
    return response.data.data;
  },

  searchItems: async (q: string) =>
    (
      await api.get<ApiResponse<SearchItem[]>>('/files/search', {
        params: { q },
      })
    ).data.data,

  createFile: async (input: CreateFileInput) => {
    const response = await api.post<ApiResponse<StoredFile>>(
      '/files/save-file',
      input,
    );
    return response.data.data;
  },

  createFolder: async (input: CreateFolderInput) => {
    const response = await api.post<ApiResponse<StoredFolder>>(
      '/files/save-folder',
      {
        name: input.name,
        size: Number(input.size),
        parentFolder: input.parent,
      },
    );
    return response.data.data;
  },

  renameFolder: async (input: RenameFolderInput) => {
    const response = await api.put<ApiResponse<StoredFolder>>(
      '/files/renameFolder',
      { folderId: input._id, name: input.name },
    );
    return response.data.data;
  },

  deleteFile: async (_id: string) => {
    const response = await api.delete('/files/deleteFile', {
      data: { fileId: _id },
    });
    return response.data;
  },

  deleteFolder: async (_id: string) => {
    const response = await api.delete('/files/deleteFolder', {
      data: { folderId: _id },
    });
    return response.data;
  },

  getTrash: async () =>
    (await api.get<ApiResponse<TrashItem[]>>('/files/trash')).data.data,

  restoreTrashItem: async (trashId: string) =>
    (await api.post('/files/trash/restore', { trashId })).data,

  getRecent: async () =>
    (await api.get<ApiResponse<RecentItem[]>>('/files/recent')).data.data,

  recordRecent: async ({
    itemId,
    itemType,
  }: {
    itemId: string;
    itemType: 'file' | 'folder';
  }) =>
    (
      await api.post('/files/recent/open', {
        [itemType === 'file' ? 'fileId' : 'folderId']: itemId,
      })
    ).data,

  upload: async ({
    file,
    parent,
    onProgress,
  }: {
    file: File;
    parent?: string;
    onProgress?: (percent: number) => void;
  }) => {
    const storage = await filesApi.getStorage();
    if (file.size > Math.max(0, storage.limitBytes - storage.usedBytes)) {
      throw new Error('Not enough storage space for this file.');
    }

    let key: string;
    const contentType = file.type || 'application/octet-stream';

    if (file.size > MAX_SINGLE_UPLOAD_BYTES) {
      key = await uploadMultipartFile(file, onProgress);
    } else {
      const response = await api.post<
        ApiResponse<{ fileUrl: string; uploadUrl: string; key: string }>
      >('/files/file-upload', {
        fileName: file.name,
        fileType: contentType,
        parentFolder: parent,
      });
      const { uploadUrl, key: singleUploadKey } = response.data.data;
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': contentType },
        onUploadProgress: (event) =>
          onProgress?.(Math.round((event.loaded * 100) / (event.total || 1))),
      });
      key = singleUploadKey;
    }

    return filesApi.createFile({
      itemName: file.name,
      size: file.size,
      mimeType: contentType,
      key,
      parentFolder: parent,
    });
  },
  openFile: (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  download: async (url: string, fileName: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  },
  searchUsers: async (q: string) =>
    (
      await api.get<
        ApiResponse<{ _id: string; name: string; email: string }[]>
      >('/files/search-users', { params: { q } })
    ).data.data,
  sharedWithMe: async () => {
    const { shares, folders, files } = (
      await api.get<ApiResponse<SharedWithMeResponse>>('/files/shared-with-me')
    ).data.data;
    return shares.flatMap((share): SharedEntry[] => {
      if (share.objectType === 'folder') {
        const folder = folders.find((item) => item._id === share.objectId) as
          | SharedFolder
          | undefined;
        return folder
          ? [
              {
                item: folder,
                itemType: 'folder',
                permissions: share.permissions,
                sharedBy: share.sharedBy,
              },
            ]
          : [];
      }
      const file = files.find((item) => item._id === share.objectId);
      return file
        ? [
            {
              item: file,
              itemType: 'file',
              permissions: share.permissions,
              sharedBy: share.sharedBy,
            },
          ]
        : [];
    });
  },
  sharesForItem: async (itemId: string, itemType: 'file' | 'folder') =>
    (
      await api.post<ApiResponse<ShareRecord[]>>('/files/shares', {
        itemId,
        itemType,
      })
    ).data.data,
  shareItems: async (input: ShareInput) => {
    const response = await api.post('/files/share', {
      email: input.email,
      permissions: input.permissions,
      ...(input.itemType === 'file'
        ? { fileId: input.itemId }
        : { folderId: input.itemId }),
    });
    return response.data;
  },
  inviteUser: async (email: string, itemName: string) => {
    const response = await api.post('/files/invite', { email, itemName });
    return response.data;
  },
};

export type Permission = 'read' | 'create' | 'delete';
export interface ShareInput {
  itemId: string;
  itemType: 'file' | 'folder';
  email: string;
  permissions: Permission[];
}
export interface ShareRecord {
  _id: string;
  permissions: Permission[];
  recipient: { name?: string; email: string } | null;
}
export interface SharedBy {
  name?: string;
  email: string;
}
interface DirectShareRecord {
  objectType: 'file' | 'folder';
  objectId: string;
  permissions: Permission[];
  sharedBy: SharedBy | null;
}
interface SharedWithMeResponse {
  shares: DirectShareRecord[];
  folders: StoredFolder[];
  files: StoredFile[];
}
export interface SharedFolder extends StoredFolder {
  folders: SharedFolder[];
  files: StoredFile[];
}
export interface SharedEntry {
  item: StoredFile | SharedFolder;
  itemType: 'file' | 'folder';
  permissions: Permission[];
  sharedBy: SharedBy | null;
}
