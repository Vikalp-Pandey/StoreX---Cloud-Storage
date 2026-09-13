import { model, Schema, Types } from 'mongoose';

export interface RecentSchema {
  user: Types.ObjectId;
  itemType: 'file' | 'folder';
  itemId: Types.ObjectId;
  openedAt: Date;
}

const recentSchema = new Schema<RecentSchema>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['file', 'folder'], required: true },
  itemId: { type: Schema.Types.ObjectId, required: true },
  openedAt: { type: Date, default: Date.now },
});

recentSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });
recentSchema.index({ user: 1, openedAt: -1 });

export const Recent = model<RecentSchema>('Recent', recentSchema);
