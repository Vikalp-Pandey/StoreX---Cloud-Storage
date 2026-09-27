import { Types } from 'mongoose';
import { File } from '@/models/fileModels/file.model';
import { Folder } from '@/models/fileModels/folder.model';

type FolderWithId = {
  _id: unknown;
};

type FolderSizeResult = {
  _id: Types.ObjectId;
  size: number;
};

/** Calculate each folder's recursive file size without double-counting folders. */
export async function withCalculatedFolderSizes<T extends FolderWithId>(
  folders: T[],
): Promise<Array<T & { size: string }>> {
  if (folders.length === 0) return [];

  const folderIds = folders.map(
    (folder) => new Types.ObjectId(String(folder._id)),
  );
  const totals = await Folder.aggregate<FolderSizeResult>([
    { $match: { _id: { $in: folderIds } } },
    {
      $graphLookup: {
        from: Folder.collection.name,
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parent',
        as: 'descendantFolders',
        maxDepth: 19,
      },
    },
    {
      $project: {
        folderIds: {
          $concatArrays: [['$_id'], '$descendantFolders._id'],
        },
      },
    },
    {
      $lookup: {
        from: File.collection.name,
        let: { folderIds: '$folderIds' },
        pipeline: [
          {
            $match: {
              $expr: { $in: ['$parent', '$$folderIds'] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $convert: {
                    input: '$size',
                    to: 'double',
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ],
        as: 'fileTotals',
      },
    },
    {
      $project: {
        size: {
          $ifNull: [{ $arrayElemAt: ['$fileTotals.total', 0] }, 0],
        },
      },
    },
  ]);
  const sizeByFolder = new Map(
    totals.map((total) => [String(total._id), Number(total.size) || 0]),
  );

  return folders.map((folder) => ({
    ...folder,
    size: String(sizeByFolder.get(String(folder._id)) || 0),
  }));
}
