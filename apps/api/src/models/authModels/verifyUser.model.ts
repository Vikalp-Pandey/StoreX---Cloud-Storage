import { Document, model, Schema } from 'mongoose';

export enum VerificationType {
  Signup = 'Signup',
  Signin = 'Signin',
}

export interface VerifyUserDocument extends Document {
  email: string;
  otp: string;
  verificationType: VerificationType;
  attempts: number;
  consumedAt?: Date;
  expiresAt: Date;
}

const verifyUserSchema = new Schema<VerifyUserDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true, select: false },
    verificationType: {
      type: String,
      enum: Object.values(VerificationType),
      required: true,
    },
    attempts: { type: Number, default: 0 },
    consumedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

verifyUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const verifyUser = model<VerifyUserDocument>('OTP', verifyUserSchema);
