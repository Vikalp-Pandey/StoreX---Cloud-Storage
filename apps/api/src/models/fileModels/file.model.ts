import { Document, Schema, Types, model } from 'mongoose';

export interface fileSchema {
  organization?: string;
  user?: string;
  name: string;
  size: string;
  parent?: string;
  key: string;
  url?: string;
  mimeType?: string;
}

export interface fileInput extends fileSchema, Document {}

const fileSchema = new Schema<fileInput>({
  mimeType: { type: String },
  user: {
    type: Types.ObjectId,
    ref: 'User',
  },
  organization: {
    type: Types.ObjectId,
    ref: 'Organization',
  },
  parent: {
    type: Types.ObjectId,
    ref: 'Folder',
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    unique: true,
    required: true,
  },
  url: { type: String },
});

export const File = model<fileInput>('File', fileSchema);
