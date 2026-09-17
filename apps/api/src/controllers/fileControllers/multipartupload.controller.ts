import type { Context } from 'hono';
import {
  startMultipartUpload,
  getPresignedPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
} from 'multipartuploadservices';

export async function startUpload(c: Context) {
  const { filename, contentType } = await c.req.json<{
    filename: string;
    contentType: string;
  }>();

  if (!filename || !contentType) {
    return c.json({ error: 'filename and contentType are required' }, 400);
  }

  try {
    const result = await startMultipartUpload(filename, contentType);
    return c.json(result);
  } catch {
    return c.json({ error: 'Failed to initialize upload' }, 500);
  }
}

export async function presignPart(c: Context) {
  const { key, uploadId, partNumber } = await c.req.json<{
    key: string;
    uploadId: string;
    partNumber: number;
  }>();

  if (!key || !uploadId || !Number.isInteger(partNumber) || partNumber < 1) {
    return c.json(
      { error: 'key, uploadId, and a positive partNumber are required' },
      400,
    );
  }

  try {
    const url = await getPresignedPartUrl(key, uploadId, partNumber);
    return c.json({ url });
  } catch {
    return c.json({ error: 'Failed to generate presigned URL' }, 500);
  }
}

export async function completeUpload(c: Context) {
  const { key, uploadId, parts } = await c.req.json<{
    key: string;
    uploadId: string;
    parts: { ETag: string; PartNumber: number }[];
  }>();

  if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
    return c.json({ error: 'key, uploadId, and parts are required' }, 400);
  }

  try {
    const result = await completeMultipartUpload(key, uploadId, parts);
    return c.json({
      message: 'Upload completed successfully',
      location: result.Location,
    });
  } catch {
    return c.json({ error: 'Failed to complete upload' }, 500);
  }
}

export async function abortUpload(c: Context) {
  const { key, uploadId } = await c.req.json<{
    key: string;
    uploadId: string;
  }>();

  if (!key || !uploadId) {
    return c.json({ error: 'key and uploadId are required' }, 400);
  }

  try {
    await abortMultipartUpload(key, uploadId);
    return c.json({ message: 'Upload aborted' });
  } catch {
    return c.json({ error: 'Failed to abort upload' }, 500);
  }
}
