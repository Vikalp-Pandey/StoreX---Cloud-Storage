import { model, Schema, Types } from 'mongoose';
import type { DirectSharePermission } from './directShare.model';

export interface TrashShareSnapshot {
  recipientId: Types.ObjectId;
  sharedBy: Types.ObjectId;
  permissions: DirectSharePermission[];
}

export interface TrashSchema {
  user: Types.ObjectId;
  trashOwner: Types.ObjectId;
  originalId: Types.ObjectId;
  batchId: Types.ObjectId;
  trashType: 'owned-item' | 'shared-access';
  itemType: 'file' | 'folder';
  isRoot: boolean;
  organization?: Types.ObjectId;
  parent?: Types.ObjectId | null;
  name: string;
  size: string;
  key?: string;
  url?: string;
  mimeType?: string;
  shares: TrashShareSnapshot[];
  deletedAt: Date;
}

const trashShareSchema = new Schema<TrashShareSnapshot>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sharedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: {
      type: [String],
      enum: ['read', 'create', 'delete'],
      required: true,
    },
  },
  { _id: false },
);

const trashSchema = new Schema<TrashSchema>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  trashOwner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  originalId: { type: Schema.Types.ObjectId, required: true },
  batchId: { type: Schema.Types.ObjectId, required: true },
  trashType: {
    type: String,
    enum: ['owned-item', 'shared-access'],
    required: true,
  },
  itemType: { type: String, enum: ['file', 'folder'], required: true },
  isRoot: { type: Boolean, required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  parent: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  name: { type: String, required: true },
  size: { type: String, required: true },
  key: { type: String, required: false },
  url: { type: String, required: false },
  mimeType: { type: String, required: false },
  shares: { type: [trashShareSchema], default: [] },
  deletedAt: { type: Date, default: Date.now },
});

trashSchema.index({ trashOwner: 1, isRoot: 1, deletedAt: -1 });

export const Trash = model<TrashSchema>('Trash', trashSchema);
