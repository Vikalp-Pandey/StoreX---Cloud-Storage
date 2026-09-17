import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '@packages/env';
import S3 from '@packages/clients/s3';

export function generatePublicFileUrl(key: string) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${encodedKey}`;
}

export async function generateUploadUrl(fileName: string, fileType: string) {
  const key = `uploads/${fileName.replace(/[^\w.-]/g, '')}`;
  const uploadUrl = await getSignedUrl(
    S3,
    new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    }),
    { expiresIn: 300 },
  );
  const fileUrl = generatePublicFileUrl(key);
  return { fileUrl, uploadUrl, key };
}
