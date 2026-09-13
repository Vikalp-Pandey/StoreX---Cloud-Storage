import { model, Schema, Types } from 'mongoose';

export type DirectSharePermission = 'read' | 'create' | 'delete';

export interface DirectShareSchema {
  objectType: 'file' | 'folder';
  objectId: string;
  recipientId: Types.ObjectId;
  sharedBy: Types.ObjectId;
  permissions: DirectSharePermission[];
  createdAt?: Date;
  updatedAt?: Date;
}

const directShareSchema = new Schema<DirectShareSchema>(
  {
    objectType: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    objectId: { type: String, required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sharedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: {
      type: [String],
      enum: ['read', 'create', 'delete'],
      required: true,
    },
  },
  { timestamps: true },
);

directShareSchema.index(
  { objectType: 1, objectId: 1, recipientId: 1 },
  { unique: true },
);

export const DirectShare = model<DirectShareSchema>(
  'DirectShare',
  directShareSchema,
);
