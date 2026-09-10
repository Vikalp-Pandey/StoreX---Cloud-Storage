import mongoose, { Schema, Document, model } from 'mongoose';

export enum VerificationType {
  Signup = 'Signup',
  Signin = 'Signin',
}

interface verifyUserSchema {
  email: string;
  otp: string;
  verification_type: VerificationType;
  createdAt: Date;
}

export interface verifyUserDocument extends verifyUserSchema, Document {}

const verifyUserSchema = new Schema<verifyUserDocument>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  verification_type: { type: String, enum: Object.values(VerificationType) },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL 5 minutes
  },
});

export const verifyUser = model<verifyUserDocument>('OTP', verifyUserSchema);
