import mongoose, { model, Schema, Types } from 'mongoose';

export interface ResetPassword extends Document {
  userId: Types.ObjectId;
  token: string;
  createdAt: Date;
}

export const resetpasswordSchema = new Schema<ResetPassword>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL: Document deletes itself after 5 minutes
  },
});

export const ResetPassword = model<ResetPassword>(
  'ResetPassword',
  resetpasswordSchema,
);
