import { Schema, model } from 'mongoose';
export interface ShareItemSchema {
  fileId?: string;
  folderId?: string;
  userId: string;
  sharedBy: string;
  permissions: string[];
}
const sharedItemSchema = new Schema<ShareItemSchema>(
  {
    fileId: { type: String, ref: 'File' },
    folderId: { type: String, ref: 'Folder' },
    userId: { type: String, ref: 'User', required: true },
    sharedBy: { type: String, ref: 'User', required: true },
    permissions: {
      type: [String],
      enum: ['read', 'create', 'delete'],
      required: true,
    },
  },
  { timestamps: true },
);
export const SharedItem = model<ShareItemSchema>(
  'sharedItem',
  sharedItemSchema,
);
