import axios from 'axios';
import { api } from '@/lib/axios';

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

export const filesApi = {
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
    const response = await api.post<
      ApiResponse<{ fileUrl: string; uploadUrl: string; key: string }>
    >('/files/file-upload', {
      fileName: file.name,
      fileType: file.type,
      parentFolder: parent,
    });
    const { uploadUrl, key } = response.data.data;
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (event) =>
        onProgress?.(Math.round((event.loaded * 100) / (event.total || 1))),
    });
    return filesApi.createFile({
      itemName: file.name,
      size: file.size,
      mimeType: file.type,
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
