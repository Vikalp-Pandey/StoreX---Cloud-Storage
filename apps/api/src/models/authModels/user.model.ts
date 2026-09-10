import { model, Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '@packages/env';

export enum accountType {
  Github = 'Github',
  Google = 'Google',
  Local = 'Local',
}

// This interface can also be used for typecasting in services
export interface userSchema {
  name: string;
  email: string;
  password?: string;
  accountType: accountType;
  picture?: string;
  emailVerified?: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

export interface userInput extends userSchema, Document {
  access_token?: string;
  comparePassword(password: boolean): Promise<boolean>;
}

// Defining the db schema
const userSchema = new Schema<userInput>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false, // Prevents field from showing it as output (in request queries)
    },
    accountType: {
      type: String,
      enum: Object.values(accountType),
      default: accountType.Local,
    },
    access_token: {
      type: String,
      expires: 7 * 24 * 60 * 60,
    },
    emailVerified: {
      type: String,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

// Pre Method for Hashing Password
userSchema.pre<userInput>('save', async function () {
  // Hash only when password is modified
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }

  // No need to call next() as mongoose knows automatically, hook is done or not.
});

// Instance Method: Compare Password
userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

const User = model<userInput>('User', userSchema);

export default User;
