import mongoose from 'mongoose';
import User, { accountType } from '@/models/authModels/user.model';
import { VerificationType } from '@/models/authModels/verifyUser.model';
import { createOtpChallenge } from '@/services/authServices/otp.service';
import { ensureStorageForUser } from '@/services/fileServices/storage.service';
import { ApiError } from '@packages/httputils';

export class UserAlreadyExistsError extends ApiError {
  constructor() {
    super(409, 'User with email already exists');
    this.name = 'UserAlreadyExistsError';
  }
}

interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export const createSignupAccount = async (input: SignupInput) => {
  const email = input.email.trim().toLowerCase();

  return mongoose.connection.transaction(async (session) => {
    const existing = await User.findOne({ email }).session(session);
    if (existing) throw new UserAlreadyExistsError();

    const [user] = await User.create(
      [
        {
          name: input.name,
          email,
          password: input.password,
          accountType: accountType.Local,
          emailVerified: false,
          twoFactorEnabled: false,
        },
      ],
      { session },
    );

    await ensureStorageForUser(user._id, session);

    const { challengeId } = await createOtpChallenge(
      email,
      VerificationType.Signup,
      session,
    );

    return { userId: user._id.toString(), email, challengeId };
  });
};
