import mongoose from 'mongoose';
import env from '@packages/env';
import User, { accountType } from '@/models/authModels/user.model';
import {
  VerificationType,
  verifyUser,
} from '@/models/authModels/verifyUser.model';
import {
  createOtpChallenge,
  validateOtpChallenge,
} from '@/services/authServices/otp.service';
import jwtService from '@/services/authServices/auth.service';

interface VerifySignupInput {
  challengeId: string;
  email: string;
  otp: string;
}

export const recreateSignupEmailChallenge = async (emailInput: string) => {
  const email = emailInput.trim().toLowerCase();

  return mongoose.connection.transaction(async (session) => {
    const user = await User.findOne({
      email,
      accountType: accountType.Local,
      emailVerified: false,
    }).session(session);

    if (!user) return null;

    await verifyUser.updateMany(
      {
        email,
        verificationType: VerificationType.Signup,
        consumedAt: { $exists: false },
      },
      { $set: { consumedAt: new Date() } },
      { session },
    );

    const { challengeId } = await createOtpChallenge(
      email,
      VerificationType.Signup,
      session,
    );

    return { challengeId, email };
  });
};

export const verifySignupEmail = async (input: VerifySignupInput) => {
  return mongoose.connection.transaction(async (session) => {
    const validation = await validateOtpChallenge(
      { ...input, verificationType: VerificationType.Signup },
      session,
    );

    // Returning lets the invalid-attempt increment commit.
    if (!validation.ok) return validation;

    const user = await User.findOne({
      email: input.email.trim().toLowerCase(),
    }).session(session);
    if (!user) throw new Error('Verified challenge has no matching user');

    const accessToken = await jwtService.signJwt(
      { id: user._id.toString() },
      env!.ACCESS_SECRET,
      { expiresIn: env!.ACCESS_SECRET_TTL },
    );

    user.emailVerified = true;
    user.access_token = accessToken;
    await user.save({ session });

    return { ok: true as const, user, accessToken };
  });
};
