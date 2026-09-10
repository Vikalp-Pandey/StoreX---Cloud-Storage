import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '@packages/env';
import S3 from '@/clients/s3';
import { File } from '@/models/fileModels/file.model';
import { Folder } from '@/models/fileModels/folder.model';
import { SharedItem } from '@/models/fileModels/sharedItem.model';

// Same key construction, public file URL, and five-minute PUT URL as the reference.
export async function generateUploadUrl(fileName: string, fileType: string) {
  const key = `uploads/${fileName.replace(/[^\w.-]/g, '')}`;
  const uploadUrl = await getSignedUrl(
    S3,
    new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      ContentType: fileType
    }),
    { expiresIn: 300 },
  );
  const fileUrl = `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  return { fileUrl, uploadUrl, key };
}

export async function shareFolderRecursive(
  folderId: string,
  senderId: string,
  recipientId: string,
  permissions: string[],
) {
  await SharedItem.findOneAndUpdate(
    { folderId, userId: recipientId },
    { $set: { permissions, sharedBy: senderId } },
    { upsert: true },
  );
  const [files, folders] = await Promise.all([
    File.find({ parent: folderId, user: senderId }),
    Folder.find({ parent: folderId, user: senderId }),
  ]);
  await Promise.all(
    files.map((file) =>
      SharedItem.findOneAndUpdate(
        { fileId: String(file._id), userId: recipientId },
        { $set: { permissions, sharedBy: senderId } },
        { upsert: true },
      ),
    ),
  );
  for (const folder of folders)
    await shareFolderRecursive(
      String(folder._id),
      senderId,
      recipientId,
      permissions,
    );
}

export interface SharedFolderTree {
  folders: Array<Record<string, unknown> & SharedFolderTree>;
  files: Array<Record<string, unknown>>;
}
export async function getSharedFolderRecursive(
  folderId: string,
): Promise<SharedFolderTree> {

  const [folders, files] = await Promise.all([
    Folder.find({ parent: folderId }).lean(),
    File.find({ parent: folderId }).lean(),
  ]);

  const folderItems = await Promise.all(folders.map(async (folder) => ({
        ...folder,
        itemType: 'folder',
        ...(await getSharedFolderRecursive(String(folder._id))),
      })))

  const fileItems = files.map((file) => ({ ...file, itemType: 'file' }));

  return {
    folders: folderItems,
    files: fileItems,
  };
}
