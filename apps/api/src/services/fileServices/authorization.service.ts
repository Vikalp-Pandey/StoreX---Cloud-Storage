import { fgaClient } from '@/clients/openfga';

export type ResourceType = 'drive' | 'folder' | 'file';
export type Permission = 'read' | 'create' | 'delete';

const permissionRelation: Record<Permission, string> = {
  read: 'can_read',
  create: 'can_create',
  delete: 'can_delete',
};

const shareRelation: Record<Permission, string> = {
  read: 'reader',
  create: 'creator',
  delete: 'deleter',
};

export async function isAllowed({
  userId,
  permission,
  type,
  id,
}: {
  userId: string;
  permission: Permission | 'share';
  type: ResourceType;
  id: string;
}) {
  const result = await fgaClient.check({
    user: `user:${userId}`,
    relation:
      permission === 'share' ? 'can_share' : permissionRelation[permission],
    object: `${type}:${id}`,
  });

  return result.allowed === true;
}

export async function writeResourceRelations({
  userId,
  type,
  id,
  parentType,
  parentId,
}: {
  userId: string;
  type: 'file' | 'folder';
  id: string;
  parentType: 'drive' | 'folder';
  parentId: string;
}) {
  await fgaClient.write({
    writes: [
      {
        user: `user:${userId}`,
        relation: 'owner',
        object: `${type}:${id}`,
      },
      {
        user: `${parentType}:${parentId}`,
        relation: 'parent',
        object: `${type}:${id}`,
      },
    ],
  });
}

export async function replaceDirectPermissions({
  userId,
  type,
  id,
  previous,
  next,
}: {
  userId: string;
  type: 'file' | 'folder';
  id: string;
  previous: Permission[];
  next: Permission[];
}) {
  const removed = previous.filter((permission) => !next.includes(permission));
  const added = next.filter((permission) => !previous.includes(permission));
  const tuple = (permission: Permission) => ({
    user: `user:${userId}`,
    relation: shareRelation[permission],
    object: `${type}:${id}`,
  });
  const writes = added.map(tuple);
  const deletes = removed.map(tuple);

  if (writes.length || deletes.length) {
    await fgaClient.write({
      ...(writes.length ? { writes } : {}),
      ...(deletes.length ? { deletes } : {}),
    });
  }
}
