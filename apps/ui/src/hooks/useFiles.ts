import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/api/files.api';

const fileQueryKeys = {
  allItems: ['files', 'getAllItems'] as const,
  items: (parent?: string) => ['files', 'getItems', parent] as const,
};

export const useGetAllItems = () =>
  useQuery({
    queryKey: fileQueryKeys.allItems,
    queryFn: filesApi.getAllItems,
  });

export const useGetItems = (parent?: string) =>
  useQuery({
    queryKey: fileQueryKeys.items(parent),
    queryFn: () => filesApi.getItems(parent),
    enabled: Boolean(parent),
  });

export const useGetSharedWithMe = () =>
  useQuery({
    queryKey: ['files', 'shared'],
    queryFn: filesApi.sharedWithMe,
  });

export const useGetTrash = () =>
  useQuery({
    queryKey: ['files', 'trash'],
    queryFn: filesApi.getTrash,
  });

export const useRestoreTrashItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.restoreTrashItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useGetRecent = () =>
  useQuery({
    queryKey: ['files', 'recent'],
    queryFn: filesApi.getRecent,
  });

export const useRecordRecent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.recordRecent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', 'recent'] });
    },
  });
};

export const useCreateFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.createFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useRenameFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.renameFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useShareItems = () =>
  useMutation({
    mutationFn: filesApi.shareItems,
  });
