import axios from 'axios';
import { api } from '@/lib/axios';

export interface PartETag {
  ETag: string;
  PartNumber: number;
}

export const startUploadApi = async (filename: string, contentType: string) => {
  const { data } = await api.post<{ uploadId: string; key: string }>(
    '/upload/start',
    { filename, contentType },
  );
  return data;
};

export const getPresignedPartUrlApi = async (
  key: string,
  uploadId: string,
  partNumber: number,
) => {
  const { data } = await api.post<{ url: string }>('/upload/presign-part', {
    key,
    uploadId,
    partNumber,
  });
  return data.url;
};

export const uploadPartToS3 = async (
  presignedUrl: string,
  chunk: Blob,
  onProgress: (bytesUploaded: number) => void,
) => {
  const response = await axios.put(presignedUrl, chunk, {
    headers: {
      'Content-Type': chunk.type || 'application/octet-stream',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.loaded) {
        onProgress(progressEvent.loaded);
      }
    },
  });

  return response.headers['etag']?.replace(/"/g, '') || '';
};

export const completeUploadApi = async (
  key: string,
  uploadId: string,
  parts: PartETag[],
) => {
  const { data } = await api.post('/upload/complete', {
    key,
    uploadId,
    parts,
  });
  return data;
};

export const abortUploadApi = async (key: string, uploadId: string) => {
  await api.post('/upload/abort', { key, uploadId });
};
