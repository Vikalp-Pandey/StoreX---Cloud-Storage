import { Document, Schema, Types, model } from 'mongoose';

export const FREE_STORAGE_LIMIT = '5GB';
export const INITIAL_STORAGE_USED = 0;

export interface storageSchema {
  user: Types.ObjectId;
  limit: string;
  used: number;
  usageInitialized: boolean;
}

export interface storageInput extends storageSchema, Document {}

const storageSchema = new Schema<storageInput>({
  user: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  limit: {
    type: String,
    required: true,
    default: FREE_STORAGE_LIMIT,
  },
  used: {
    type: Number,
    required: true,
    default: INITIAL_STORAGE_USED,
  },
  usageInitialized: { type: Boolean, default: false },
});

storageSchema.index({ user: 1 }, { unique: true });

export const Storage = model<storageInput>('Storage', storageSchema);
