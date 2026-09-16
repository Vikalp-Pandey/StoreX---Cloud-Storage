import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '@packages/clients/s3';
import env from '@packages/env';

const BUCKET_NAME = env.BUCKET_NAME;

export async function startMultipartUpload(filename: string, contentType: string) {
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${Date.now()}-${filename}`,
    ContentType: contentType,
  });

  const response = await s3Client.send(command);
  return {
    uploadId: response.UploadId,
    key: response.Key,
  };
}

export async function getPresignedPartUrl(key: string, uploadId: string, partNumber: number) {
  const command = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  // Presigned URL valid for 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  });

  return await s3Client.send(command);
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  return await s3Client.send(command);
}