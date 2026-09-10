import { Document, Schema, Types, model } from 'mongoose';

export interface storageSchema {
  user: Types.ObjectId;
  limit: string;
  used: string;
}

export interface storageInput extends storageSchema, Document {}

const storageSchema = new Schema<storageInput>({
  user: {
    type: Types.ObjectId,
    ref: 'User',
  },
  limit: {
    type: String,
    required: true,
  },
  used: {
    type: String,
    required: true,
    default: '0MB',
  },
});

export const Storage = model<storageInput>('Storage', storageSchema);
